import { logger } from '../../netlify/functions/utils/logger.js';
import { getXRPLClient, initializeXRPL, walletFromSeed, createTrustLine } from '../config/xrpl.js';
import { supabase, insertAsset, insertToken, insertTransaction, handleSupabaseError } from '../config/supabaseClient.js';
import redisService from '../config/redis.js';
import { rateLimitMiddleware, cacheMiddleware, initializeRedis } from '../middleware/redis.js';
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
    // Inizializza Redis
    await initializeRedis(req, res, () => {});

    // Rate limiting per operazioni di tokenizzazione (max 10 per ora)
    const rateLimitKey = `tokenization:${req.ip}`;
    const rateLimitAllowed = await redisService.checkRateLimit(rateLimitKey, 10, 3600);
    
    if (!rateLimitAllowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Maximum 10 tokenizations per hour.',
        retry_after: 3600
      });
    }

    // Verifica autenticazione
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione richiesto'
      });
    }

    const token = authHeader.substring(7);
    let decodedToken;
    
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'solcraft-nexus-xrpl-secure-2025');
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione non valido'
      });
    }

    const { assetData, userWallet, tokenSymbol, totalSupply, issuerSeed } = req.body;

    // Validazione input
    if (!assetData || !userWallet || !tokenSymbol || !totalSupply) {
      return res.status(400).json({
        success: false,
        error: 'Dati richiesti mancanti: assetData, userWallet, tokenSymbol, totalSupply'
      });
    }

    // Validazione tokenSymbol
    if (tokenSymbol.length < 3 || tokenSymbol.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Token symbol deve essere tra 3 e 20 caratteri'
      });
    }

    // Validazione totalSupply
    if (totalSupply <= 0 || totalSupply > 100000000000) {
      return res.status(400).json({
        success: false,
        error: 'Total supply deve essere tra 1 e 100,000,000,000'
      });
    }

    // Cache check per tokenSymbol duplicato
    const existingTokenKey = `token_exists:${tokenSymbol}`;
    const existingToken = await redisService.get(existingTokenKey);
    
    if (existingToken) {
      return res.status(409).json({
        success: false,
        error: 'Token symbol già esistente',
        existing_token: existingToken
      });
    }

    // Controllo duplicati nel database
    const { data: existingTokens } = await supabase
      .from('tokens')
      .select('symbol')
      .eq('symbol', tokenSymbol)
      .limit(1);

    if (existingTokens && existingTokens.length > 0) {
      // Cache il risultato per evitare query future
      await redisService.set(existingTokenKey, { symbol: tokenSymbol, exists: true }, 3600);
      
      return res.status(409).json({
        success: false,
        error: 'Token symbol già esistente nel database'
      });
    }

    // Inizializzazione XRPL
    await initializeXRPL();
    const client = getXRPLClient();

    // Creazione wallet issuer
    const issuerWallet = issuerSeed ? 
      walletFromSeed(issuerSeed) : 
      walletFromSeed(process.env.ISSUER_SEED || 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2');

    logger.info('🏦 Issuer wallet address:', issuerWallet.address);
    logger.info('👤 User wallet address:', userWallet.address);

    // Cache key per questa operazione di tokenizzazione
    const operationKey = `tokenization_op:${tokenSymbol}:${userWallet.address}`;
    
    // Controllo se operazione già in corso
    const existingOperation = await redisService.get(operationKey);
    if (existingOperation) {
      return res.status(409).json({
        success: false,
        error: 'Tokenization already in progress for this asset',
        operation_id: existingOperation.operation_id
      });
    }

    // Registra operazione in corso
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await redisService.set(operationKey, { 
      operation_id: operationId, 
      status: 'in_progress',
      started_at: new Date().toISOString()
    }, 1800); // 30 minuti TTL

    try {
      // Step 1: Creazione TrustLine REALE su XRPL
      logger.info('🔗 Creating TrustLine on XRPL...');
      
      const trustLineResult = await createTrustLine(
        userWallet,
        tokenSymbol,
        issuerWallet.address,
        totalSupply
      );

      if (!trustLineResult || !trustLineResult.hash) {
        throw new Error('TrustLine creation failed - no transaction hash received');
      }

      logger.info('✅ TrustLine created successfully:', trustLineResult.hash);

      // Step 2: Verifica transazione su ledger
      const txInfo = await client.request({
        command: 'tx',
        transaction: trustLineResult.hash
      });

      if (txInfo.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`TrustLine transaction failed: ${txInfo.result.meta.TransactionResult}`);
      }

      // Step 3: Salvataggio Asset nel database
      const assetRecord = {
        name: assetData.name,
        description: assetData.description,
        asset_type: assetData.type || 'real_estate',
        location: assetData.location,
        value_usd: assetData.value,
        owner_address: userWallet.address,
        status: 'tokenized',
        metadata: assetData.metadata || {},
        created_at: new Date().toISOString()
      };

      const savedAsset = await insertAsset(assetRecord);
      logger.info('💾 Asset saved to database:', savedAsset.id);

      // Step 4: Salvataggio Token nel database
      const tokenRecord = {
        asset_id: savedAsset.id,
        symbol: tokenSymbol,
        name: `${assetData.name} Token`,
        total_supply: totalSupply,
        issuer_address: issuerWallet.address,
        holder_address: userWallet.address,
        xrpl_currency_code: tokenSymbol,
        trust_line_hash: trustLineResult.hash,
        ledger_index: txInfo.result.ledger_index,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const savedToken = await insertToken(tokenRecord);
      logger.info('🪙 Token saved to database:', savedToken.id);

      // Step 5: Salvataggio Transazione
      const transactionRecord = {
        tx_hash: trustLineResult.hash,
        transaction_type: 'tokenization',
        from_address: issuerWallet.address,
        to_address: userWallet.address,
        amount: totalSupply,
        currency: tokenSymbol,
        asset_id: savedAsset.id,
        token_id: savedToken.id,
        fee: trustLineResult.fee || '12',
        status: 'completed',
        ledger_index: txInfo.result.ledger_index,
        created_at: new Date().toISOString()
      };

      const savedTransaction = await insertTransaction(transactionRecord);
      logger.info('📝 Transaction saved to database:', savedTransaction.id);

      // Step 6: Cache dei risultati
      const tokenizationResult = {
        success: true,
        asset: savedAsset,
        token: savedToken,
        transaction: {
          hash: trustLineResult.hash,
          ledger_index: txInfo.result.ledger_index,
          fee: trustLineResult.fee,
          status: 'completed'
        },
        xrpl_details: {
          trust_line_hash: trustLineResult.hash,
          issuer_address: issuerWallet.address,
          currency_code: tokenSymbol,
          total_supply: totalSupply
        },
        operation_id: operationId,
        completed_at: new Date().toISOString()
      };

      // Cache il token per evitare duplicati futuri
      await redisService.set(existingTokenKey, { 
        symbol: tokenSymbol, 
        exists: true, 
        token_id: savedToken.id 
      }, 3600 * 24); // 24 ore

      // Cache il risultato della tokenizzazione
      await redisService.set(`tokenization_result:${operationId}`, tokenizationResult, 3600 * 24);

      // Cache i dati del token per accesso rapido
      await redisService.cacheTokenPrice(tokenSymbol, assetData.value / totalSupply, 3600);

      // Rimuovi operazione in corso
      await redisService.del(operationKey);

      logger.info('🎉 Tokenization completed successfully!');

      return res.status(200).json(tokenizationResult);

    } catch (operationError) {
      // Rimuovi operazione in corso in caso di errore
      await redisService.del(operationKey);
      
      // Cache dell'errore per evitare retry immediati
      await redisService.set(`tokenization_error:${operationId}`, {
        error: operationError.message,
        timestamp: new Date().toISOString()
      }, 300); // 5 minuti

      throw operationError;
    }

  } catch (error) {
    logger.error('❌ Tokenization error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Errore durante la tokenizzazione',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

