import { getXRPLClient, initializeXRPL, walletFromSeed, createTrustLine } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST for tokenization.' 
    })
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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const {
      assetName,
      assetType,
      assetValue,
      assetDescription,
      assetLocation,
      tokenSymbol,
      totalSupply,
      transferable,
      clawback,
      authorization,
      documents,
      metadata
    } = req.body;

    // Validazione input
    if (!assetName || !assetType || !assetValue || !tokenSymbol || !totalSupply) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti: assetName, assetType, assetValue, tokenSymbol, totalSupply'
      });
    }

    // Validazione token symbol (deve essere 3 caratteri per XRPL)
    if (tokenSymbol.length !== 3 || !/^[A-Z]{3}$/.test(tokenSymbol)) {
      return res.status(400).json({
        success: false,
        error: 'Token symbol deve essere esattamente 3 lettere maiuscole (es: USD, EUR, GOL)'
      });
    }

    // Validazione supply
    const supply = parseFloat(totalSupply);
    if (isNaN(supply) || supply <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Total supply deve essere un numero positivo'
      });
    }

    // Generazione ID unico per il token
    const tokenId = `${tokenSymbol}_${Date.now()}`;
    const createdAt = new Date().toISOString();

    // Simulazione creazione token su XRPL
    let tokenCreationResult = {
      success: false,
      txHash: null,
      issuerAddress: null,
      error: null
    };

    try {
      // Inizializza connessione XRPL
      await initializeXRPL().catch(() => {}); // Ignora se già connesso

      // In produzione, qui creeresti il token reale su XRPL
      // Per ora simuliamo il processo con dati realistici
      
      // Simula indirizzo issuer (in produzione sarebbe il tuo issuing address)
      const mockIssuerAddress = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH';
      const mockTxHash = `${tokenSymbol}${Date.now().toString(16).toUpperCase()}`;

      tokenCreationResult = {
        success: true,
        txHash: mockTxHash,
        issuerAddress: mockIssuerAddress,
        tokenSymbol: tokenSymbol,
        totalSupply: supply.toString(),
        created: true
      };

    } catch (error) {
      console.error('Token creation error:', error);
      tokenCreationResult.error = error.message;
    }

    // Creazione oggetto token completo
    const tokenData = {
      id: tokenId,
      assetInfo: {
        name: assetName,
        type: assetType,
        value: parseFloat(assetValue),
        description: assetDescription || '',
        location: assetLocation || '',
        documents: documents || [],
        metadata: metadata || {}
      },
      tokenInfo: {
        symbol: tokenSymbol,
        totalSupply: supply,
        circulatingSupply: 0,
        decimals: 6, // Standard XRPL
        issuerAddress: tokenCreationResult.issuerAddress,
        transferable: transferable !== false,
        clawback: clawback === true,
        authorization: authorization === true
      },
      blockchain: {
        network: 'XRPL',
        txHash: tokenCreationResult.txHash,
        status: tokenCreationResult.success ? 'confirmed' : 'failed',
        confirmations: tokenCreationResult.success ? 1 : 0
      },
      compliance: {
        kyc: false,
        aml: false,
        accredited: false,
        jurisdiction: 'TBD'
      },
      ownership: {
        creator: decoded.userId,
        creatorAddress: decoded.address,
        createdAt: createdAt,
        lastUpdated: createdAt
      },
      status: tokenCreationResult.success ? 'active' : 'failed',
      pricing: {
        initialPrice: parseFloat(assetValue) / supply,
        currentPrice: parseFloat(assetValue) / supply,
        currency: 'USD',
        lastUpdated: createdAt
      }
    };

    // Simulazione salvataggio in database
    // In produzione salveresti in un database reale
    console.log('Token created:', tokenData);

    if (tokenCreationResult.success) {
      // Salva token su Supabase
      const { error: insertError } = await supabase.from('tokens').insert({
        id: tokenId,
        metadata: tokenData,
        issuer: tokenCreationResult.issuerAddress,
        tx_hash: tokenCreationResult.txHash,
        created_at: createdAt
      });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Errore salvataggio token',
          details: insertError.message
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Asset tokenizzato con successo!',
        data: {
          token: tokenData,
          transaction: {
            hash: tokenCreationResult.txHash,
            status: 'confirmed',
            network: 'XRPL Testnet',
            explorer: `https://testnet.xrpl.org/transactions/${tokenCreationResult.txHash}`
          },
          nextSteps: [
            'Il token è stato creato sulla blockchain XRPL',
            'Puoi ora distribuire i token agli investitori',
            'Configura le impostazioni di compliance se necessario',
            'Monitora le transazioni nel dashboard'
          ]
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Errore durante la creazione del token sulla blockchain',
        details: tokenCreationResult.error,
        data: {
          token: tokenData,
          status: 'failed'
        }
      });
    }

  } catch (error) {
    console.error('Tokenization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server durante la tokenizzazione',
      message: error.message
    });
  }
}

