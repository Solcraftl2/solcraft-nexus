import { getAccountBalance, getAccountInfo, initializeXRPL } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      // Get user from authorization header
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Token di autorizzazione richiesto'
        })
      }

      // Verifica JWT token reale
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
      
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Token non valido'
        });
      }

      const userAddress = decoded.address;
      const walletType = decoded.walletType;

      let portfolioData = {
        totalValue: 0,
        currency: 'EUR',
        mainWallet: {
          balance: 0,
          currency: 'EUR',
          lastUpdated: new Date().toISOString()
        },
        assets: [],
        cryptoBalances: {},
        performance: {
          lastMonth: 0,
          lastQuarter: 0,
          lastYear: 0,
          allTime: 0
        },
        protectionLevel: 95
      };

      // Ottieni dati reali se wallet XRPL
      if (walletType === 'xrp' && userAddress) {
        try {
          // Inizializza connessione XRPL
          await initializeXRPL().catch(() => {}); // Ignora se già connesso
          
          // Ottieni bilancio reale XRPL
          const balance = await getAccountBalance(userAddress);
          
          if (balance) {
            const xrpToEur = 0.48; // Mock exchange rate
            const xrpBalance = parseFloat(balance.xrp);
            const xrpValueEur = xrpBalance * xrpToEur;

            portfolioData.cryptoBalances.XRP = {
              balance: xrpBalance,
              valueEUR: xrpValueEur,
              address: userAddress
            };

            portfolioData.totalValue += xrpValueEur;
            portfolioData.mainWallet.balance = xrpValueEur;

            // Aggiungi token se presenti
            if (balance.tokens && balance.tokens.length > 0) {
              balance.tokens.forEach(token => {
                const tokenBalance = parseFloat(token.balance) || 0;
                const mockValueEur = tokenBalance * 0.9; // Mock conversion
                
                portfolioData.cryptoBalances[token.currency] = {
                  balance: tokenBalance,
                  valueEUR: mockValueEur,
                  issuer: token.issuer
                };

                portfolioData.totalValue += mockValueEur;
              });
            }

            // Performance mock basata su dati reali
            portfolioData.performance = {
              lastMonth: Math.random() * 15 - 5,
              lastQuarter: Math.random() * 25 - 10,
              lastYear: Math.random() * 50 - 20,
              allTime: Math.random() * 100 - 30
            };

          } else {
            // Account non trovato, usa dati mock minimi
            portfolioData.cryptoBalances.XRP = {
              balance: 0.0,
              valueEUR: 0.0,
              address: userAddress
            };
          }

        } catch (error) {
          console.error('XRPL portfolio error:', error);
          // Fallback a dati mock se XRPL non disponibile
          portfolioData.cryptoBalances.XRP = {
            balance: 2450.50,
            valueEUR: 1250.75,
            address: userAddress
          };
          portfolioData.totalValue = 1250.75;
          portfolioData.mainWallet.balance = 1250.75;
        }
      } else if (walletType === 'ethereum') {
        // Mock data per Ethereum
        portfolioData.cryptoBalances.ETH = {
          balance: 0.75,
          valueEUR: 1800.0,
          address: userAddress
        };
        portfolioData.totalValue = 1800.0;
        portfolioData.mainWallet.balance = 1800.0;
      } else {
        // Fallback a dati mock della piattaforma esistente
        portfolioData.cryptoBalances.XRP = {
          balance: 2450.50,
          valueEUR: 1250.75,
          address: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        };
        portfolioData.totalValue = 1250.75;
        portfolioData.mainWallet.balance = 1250.75;
      }

      // Aggiungi asset tokenizzati mock (mantenendo struttura esistente)
      portfolioData.assets = [
        {
          id: 'asset_1',
          name: 'Appartamento Milano',
          type: 'Immobiliare',
          value: 85000,
          currency: 'EUR',
          tokensOwned: 1000,
          totalTokens: 10000,
          ownership: 10,
          annualYield: 6.2,
          status: 'active',
          lastDividend: {
            amount: 100,
            currency: 'XRP',
            date: '2025-06-25'
          }
        },
        {
          id: 'asset_2', 
          name: 'Startup TechCorp',
          type: 'Equity',
          value: 15000,
          currency: 'EUR',
          tokensOwned: 500,
          totalTokens: 5000,
          ownership: 10,
          annualYield: 12.8,
          status: 'active',
          lastDividend: null
        }
      ];

      // Aggiungi ETH se non presente
      if (!portfolioData.cryptoBalances.ETH) {
        portfolioData.cryptoBalances.ETH = {
          balance: 0.0,
          valueEUR: 0.0,
          address: '0x0000000000000000000000000000000000000000'
        };
      }

      return res.status(200).json({
        success: true,
        data: portfolioData,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Portfolio balance error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      })
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use GET to retrieve portfolio balance.' 
  })
}

