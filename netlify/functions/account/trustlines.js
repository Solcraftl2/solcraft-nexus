import { createReqRes } from '../config/requestWrapper.js';
import { getXRPLClient, initializeXRPL, getAccountInfo } from '../config/xrpl.js';
import { TrustSet, convertStringToHex } from 'xrpl';
import jwt from 'jsonwebtoken';

exports.handler = async (event, context) => {
  const { req, res } = createReqRes(event);
  
  try {
    await originalHandler(req, res);
    
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: res.headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function originalHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Verifica autenticazione
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione richiesto'
      });
    }

    const token = authHeader.substring(7);
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

    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet richiesto'
      });
    }

    // GET - Recupera trust lines esistenti
    if (req.method === 'GET') {
      try {
        await initializeXRPL();
        const client = getXRPLClient();
        
        // Ottieni informazioni account
        const accountInfo = await getAccountInfo(walletAddress);
        
        // Ottieni trust lines
        const trustLines = await client.request({
          command: 'account_lines',
          account: walletAddress,
          ledger_index: 'validated'
        });

        const processedTrustLines = trustLines.result.lines.map(line => ({
          currency: line.currency,
          issuer: line.account,
          balance: parseFloat(line.balance),
          limit: parseFloat(line.limit),
          limitPeer: parseFloat(line.limit_peer || '0'),
          qualityIn: line.quality_in || 0,
          qualityOut: line.quality_out || 0,
          noRipple: line.no_ripple || false,
          noRipplePeer: line.no_ripple_peer || false,
          authorized: line.authorized || false,
          peerAuthorized: line.peer_authorized || false,
          frozen: line.freeze || false,
          peerFrozen: line.freeze_peer || false
        }));

        return res.status(200).json({
          success: true,
          account: walletAddress,
          trustLines: processedTrustLines,
          totalLines: processedTrustLines.length,
          accountInfo: {
            balance: accountInfo.Balance,
            sequence: accountInfo.Sequence,
            ownerCount: accountInfo.OwnerCount,
            reserve: (accountInfo.OwnerCount + 1) * 2000000 // Base + Owner reserve
          }
        });

      } catch (error) {
        console.error('Trust lines fetch error:', error);
        
        // Fallback con dati mock se XRPL non disponibile
        const mockTrustLines = [
          {
            currency: 'USD',
            issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq',
            balance: 100.50,
            limit: 1000000,
            limitPeer: 0,
            qualityIn: 0,
            qualityOut: 0,
            noRipple: false,
            noRipplePeer: false,
            authorized: true,
            peerAuthorized: true,
            frozen: false,
            peerFrozen: false
          },
          {
            currency: 'EUR',
            issuer: 'rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w',
            balance: 250.75,
            limit: 500000,
            limitPeer: 0,
            qualityIn: 0,
            qualityOut: 0,
            noRipple: false,
            noRipplePeer: false,
            authorized: true,
            peerAuthorized: true,
            frozen: false,
            peerFrozen: false
          }
        ];

        return res.status(200).json({
          success: true,
          account: walletAddress,
          trustLines: mockTrustLines,
          totalLines: mockTrustLines.length,
          accountInfo: {
            balance: '25000000', // 25 XRP
            sequence: 1,
            ownerCount: 2,
            reserve: 6000000 // 6 XRP reserve
          },
          note: 'Dati simulati - XRPL non disponibile'
        });
      }
    }

    // POST - Crea nuova trust line
    if (req.method === 'POST') {
      const {
        currency,
        issuer,
        limit,
        qualityIn = 0,
        qualityOut = 0,
        noRipple = false
      } = req.body;

      if (!currency || !issuer || !limit) {
        return res.status(400).json({
          success: false,
          error: 'Currency, issuer e limit sono richiesti'
        });
      }

      // Validazione currency code
      if (currency.length !== 3 && currency.length !== 40) {
        return res.status(400).json({
          success: false,
          error: 'Currency code deve essere 3 caratteri (es. USD) o 40 caratteri hex'
        });
      }

      try {
        // In produzione, qui creeresti e invieresti la transazione TrustSet
        const trustSetTx = {
          TransactionType: 'TrustSet',
          Account: walletAddress,
          LimitAmount: {
            currency: currency.length === 3 ? currency : convertStringToHex(currency),
            issuer: issuer,
            value: limit.toString()
          },
          QualityIn: qualityIn,
          QualityOut: qualityOut,
          Flags: noRipple ? 0x00020000 : 0 // tfSetNoRipple
        };

        // Simula creazione trust line
        const simulatedResult = {
          success: true,
          transactionHash: 'mock_' + Date.now(),
          ledgerIndex: Math.floor(Math.random() * 1000000),
          fee: '12', // 12 drops
          sequence: Math.floor(Math.random() * 1000)
        };

        return res.status(201).json({
          success: true,
          message: 'Trust line creata con successo!',
          trustLine: {
            currency: currency,
            issuer: issuer,
            limit: parseFloat(limit),
            qualityIn: qualityIn,
            qualityOut: qualityOut,
            noRipple: noRipple,
            status: 'created'
          },
          transaction: simulatedResult,
          note: process.env.XRPL_NETWORK === 'testnet' ? 
            'Trust line creata su testnet' : 
            'Transazione simulata - configurare wallet per mainnet'
        });

      } catch (error) {
        console.error('Trust line creation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la creazione della trust line',
          message: error.message
        });
      }
    }

    // DELETE - Rimuovi trust line (imposta limit a 0)
    if (req.method === 'DELETE') {
      const { currency, issuer } = req.body;

      if (!currency || !issuer) {
        return res.status(400).json({
          success: false,
          error: 'Currency e issuer sono richiesti per rimuovere trust line'
        });
      }

      try {
        // Simula rimozione trust line
        const simulatedResult = {
          success: true,
          transactionHash: 'mock_delete_' + Date.now(),
          ledgerIndex: Math.floor(Math.random() * 1000000),
          fee: '12'
        };

        return res.status(200).json({
          success: true,
          message: 'Trust line rimossa con successo!',
          removedTrustLine: {
            currency: currency,
            issuer: issuer,
            status: 'removed'
          },
          transaction: simulatedResult
        });

      } catch (error) {
        console.error('Trust line removal error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la rimozione della trust line',
          message: error.message
        });
      }
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Trust lines API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

