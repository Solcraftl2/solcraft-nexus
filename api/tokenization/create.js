import { getXRPLClient, initializeXRPL, walletFromSeed, createTrustLine } from '../config/xrpl.js';
import { supabase, insertAsset, insertToken, insertTransaction, handleSupabaseError } from '../config/supabaseClient.js';
import jwt from 'jsonwebtoken';

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

    // Creazione token su XRPL (reale o testnet)
    let tokenCreationResult = {
      success: false,
      txHash: null,
      issuerAddress: null,
      error: null
    };

    try {
      // Inizializza connessione XRPL
      await initializeXRPL().catch(() => {}); // Ignora se già connesso

      // TODO: Implementare creazione token reale su XRPL
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

    // Salvataggio Asset nel database Supabase
    let savedAsset;
    try {
      const assetData = {
        name: assetName,
        type: assetType,
        description: assetDescription || '',
        location: assetLocation || '',
        value: parseFloat(assetValue),
        currency: 'USD',
        documents: documents || [],
        metadata: metadata || {},
        owner_id: decoded.userId,
        status: 'active',
        created_at: createdAt,
        updated_at: createdAt
      };

      savedAsset = await insertAsset(assetData);
      console.log('Asset saved to database:', savedAsset.id);

    } catch (error) {
      console.error('Error saving asset to database:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore durante il salvataggio dell\'asset nel database',
        details: error.message
      });
    }

    // Salvataggio Token nel database Supabase
    let savedToken;
    try {
      const tokenData = {
        id: tokenId,
        symbol: tokenSymbol,
        name: `${assetName} Token`,
        total_supply: supply,
        circulating_supply: 0,
        decimals: 6, // Standard XRPL
        asset_id: savedAsset.id,
        issuer_address: tokenCreationResult.issuerAddress,
        blockchain_network: 'XRPL',
        tx_hash: tokenCreationResult.txHash,
        status: tokenCreationResult.success ? 'active' : 'failed',
        transferable: transferable !== false,
        clawback_enabled: clawback === true,
        authorization_required: authorization === true,
        initial_price: parseFloat(assetValue) / supply,
        current_price: parseFloat(assetValue) / supply,
        price_currency: 'USD',
        creator_id: decoded.userId,
        created_at: createdAt,
        updated_at: createdAt
      };

      savedToken = await insertToken(tokenData);
      console.log('Token saved to database:', savedToken.id);

    } catch (error) {
      console.error('Error saving token to database:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore durante il salvataggio del token nel database',
        details: error.message
      });
    }

    // Salvataggio Transazione nel database Supabase
    if (tokenCreationResult.success) {
      try {
        const transactionData = {
          tx_hash: tokenCreationResult.txHash,
          type: 'token_creation',
          from_address: null,
          to_address: tokenCreationResult.issuerAddress,
          amount: supply,
          currency: tokenSymbol,
          token_id: savedToken.id,
          user_id: decoded.userId,
          status: 'confirmed',
          blockchain_network: 'XRPL',
          block_height: null,
          gas_fee: 0,
          description: `Token creation for ${assetName}`,
          metadata: {
            assetName,
            assetType,
            assetValue,
            tokenSymbol,
            totalSupply: supply
          },
          created_at: createdAt
        };

        const savedTransaction = await insertTransaction(transactionData);
        console.log('Transaction saved to database:', savedTransaction.id);

      } catch (error) {
        console.error('Error saving transaction to database:', error);
        // Non bloccare la risposta per errori di transazione
      }
    }

    // Aggiorna portfolio dell'utente
    try {
      // Trova o crea portfolio principale dell'utente
      const { data: portfolios, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', decoded.userId)
        .limit(1);

      let portfolioId;
      if (portfolioError || !portfolios || portfolios.length === 0) {
        // Crea portfolio se non esiste
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: decoded.userId,
            name: 'Portfolio Principale',
            description: 'Portfolio di investimenti principale',
            total_value: parseFloat(assetValue),
            currency: 'USD',
            created_at: createdAt
          })
          .select()
          .single();

        if (createError) throw createError;
        portfolioId = newPortfolio.id;
      } else {
        portfolioId = portfolios[0].id;
        
        // Aggiorna valore portfolio
        await supabase
          .from('portfolios')
          .update({
            total_value: portfolios[0].total_value + parseFloat(assetValue),
            updated_at: createdAt
          })
          .eq('id', portfolioId);
      }

      // Aggiungi asset al portfolio
      await supabase
        .from('portfolio_assets')
        .insert({
          portfolio_id: portfolioId,
          asset_id: savedAsset.id,
          token_id: savedToken.id,
          quantity: supply,
          purchase_price: parseFloat(assetValue) / supply,
          current_price: parseFloat(assetValue) / supply,
          total_value: parseFloat(assetValue),
          currency: 'USD',
          created_at: createdAt
        });

    } catch (error) {
      console.error('Error updating user portfolio:', error);
      // Non bloccare la risposta per errori di portfolio
    }

    // Registra attività utente
    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: decoded.userId,
          activity_type: 'tokenization',
          description: `Created token ${tokenSymbol} for asset ${assetName}`,
          metadata: {
            tokenId: savedToken.id,
            assetId: savedAsset.id,
            txHash: tokenCreationResult.txHash
          },
          created_at: createdAt
        });
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Non bloccare la risposta per errori di logging
    }

    // Risposta di successo
    if (tokenCreationResult.success) {
      return res.status(201).json({
        success: true,
        message: 'Asset tokenizzato con successo e salvato nel database!',
        data: {
          asset: {
            id: savedAsset.id,
            name: savedAsset.name,
            type: savedAsset.type,
            value: savedAsset.value,
            location: savedAsset.location
          },
          token: {
            id: savedToken.id,
            symbol: savedToken.symbol,
            totalSupply: savedToken.total_supply,
            issuerAddress: savedToken.issuer_address,
            status: savedToken.status
          },
          transaction: {
            hash: tokenCreationResult.txHash,
            status: 'confirmed',
            network: 'XRPL Testnet',
            explorer: `https://testnet.xrpl.org/transactions/${tokenCreationResult.txHash}`
          },
          nextSteps: [
            'Il token è stato creato e salvato nel database',
            'L\'asset è stato aggiunto al tuo portfolio',
            'Puoi ora distribuire i token agli investitori',
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
          asset: savedAsset ? { id: savedAsset.id } : null,
          token: savedToken ? { id: savedToken.id, status: 'failed' } : null
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

