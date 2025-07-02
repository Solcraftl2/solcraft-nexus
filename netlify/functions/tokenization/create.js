import { logger } from '../utils/logger.js';
import { withCors } from '../utils/cors.js';
import { getXRPLClient, initializeXRPL, walletFromSeed, createTrustLine } from '../config/xrpl.js';
import { supabase, insertAsset, insertToken, insertTransaction } from '../config/supabaseClient.js';
import redisService from '../config/redis.js';
import { rateLimitMiddleware, cacheMiddleware, initializeRedis } from '../middleware/redis.js';
import jwt from 'jsonwebtoken';

async function createTokenization(event, context) {
  try {
    // Validazione metodo HTTP
    if (event.httpMethod !== 'POST') {
      logger.warn('Invalid HTTP method for tokenization', { 
        method: event.httpMethod,
        path: event.path 
      });
      return {
        statusCode: 405,
        body: JSON.stringify({ 
          success: false, 
          error: 'Method not allowed. Use POST for tokenization.' 
        })
      };
    }

    // Parse del body
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch (error) {
      logger.error('Invalid JSON in request body', { error: error.message });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON format'
        })
      };
    }

    const { assetData, userWallet, tokenSymbol, totalSupply, issuerSeed } = requestData;
    const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1';

    logger.info('Tokenization request received', { 
      tokenSymbol,
      totalSupply,
      userWalletAddress: userWallet?.address,
      clientIp,
      assetType: assetData?.type
    });

    // Inizializza Redis
    try {
      await initializeRedis();
    } catch (error) {
      logger.error('Redis initialization failed', { error: error.message });
      // Continua senza Redis se non disponibile
    }

    // Rate limiting per operazioni di tokenizzazione (max 10 per ora)
    const rateLimitKey = `tokenization:${clientIp}`;
    try {
      const rateLimitAllowed = await redisService.checkRateLimit(rateLimitKey, 10, 3600);
      
      if (!rateLimitAllowed) {
        logger.warn('Rate limit exceeded for tokenization', { 
          clientIp,
          rateLimitKey 
        });
        return {
          statusCode: 429,
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded. Maximum 10 tokenizations per hour.',
            retry_after: 3600
          })
        };
      }
    } catch (error) {
      logger.warn('Rate limiting check failed, proceeding without limit', { 
        error: error.message 
      });
    }

    // Verifica autenticazione
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: 'Token di autenticazione richiesto'
        })
      };
    }

    const token = authHeader.substring(7);
    let decodedToken;
    
    try {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        logger.error('JWT_SECRET not configured');
        return {
          statusCode: 500,
          body: JSON.stringify({
            success: false,
            error: 'Errore di configurazione del server'
          })
        };
      }
      
      decodedToken = jwt.verify(token, JWT_SECRET);
      logger.debug('JWT token verified successfully', { 
        userId: decodedToken.userId,
        email: decodedToken.email 
      });
    } catch (jwtError) {
      logger.warn('Invalid JWT token', { error: jwtError.message });
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: 'Token di autenticazione non valido'
        })
      };
    }

    // Validazione input
    if (!assetData || !userWallet || !tokenSymbol || !totalSupply) {
      logger.warn('Missing required fields for tokenization', {
        hasAssetData: !!assetData,
        hasUserWallet: !!userWallet,
        hasTokenSymbol: !!tokenSymbol,
        hasTotalSupply: !!totalSupply
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Dati richiesti mancanti: assetData, userWallet, tokenSymbol, totalSupply'
        })
      };
    }

    // Validazione tokenSymbol
    if (tokenSymbol.length < 3 || tokenSymbol.length > 20) {
      logger.warn('Invalid token symbol length', { 
        tokenSymbol, 
        length: tokenSymbol.length 
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Token symbol deve essere tra 3 e 20 caratteri'
        })
      };
    }

    // Validazione totalSupply
    if (totalSupply <= 0 || totalSupply > 100000000000) {
      logger.warn('Invalid total supply', { totalSupply });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Total supply deve essere tra 1 e 100,000,000,000'
        })
      };
    }

    // Cache check per tokenSymbol duplicato
    const existingTokenKey = `token_exists:${tokenSymbol}`;
    try {
      const existingToken = await redisService.get(existingTokenKey);
      
      if (existingToken) {
        logger.warn('Token symbol already exists (cached)', { tokenSymbol });
        return {
          statusCode: 409,
          body: JSON.stringify({
            success: false,
            error: 'Token symbol già esistente',
            existing_token: existingToken
          })
        };
      }
    } catch (error) {
      logger.warn('Cache check failed, proceeding with database check', { 
        error: error.message 
      });
    }

    // Controllo duplicati nel database
    try {
      const { data: existingTokens } = await supabase
        .from('tokens')
        .select('symbol')
        .eq('symbol', tokenSymbol)
        .limit(1);

      if (existingTokens && existingTokens.length > 0) {
        logger.warn('Token symbol already exists in database', { tokenSymbol });
        
        // Cache il risultato per evitare query future
        try {
          await redisService.set(existingTokenKey, { symbol: tokenSymbol, exists: true }, 3600);
        } catch (cacheError) {
          logger.warn('Failed to cache token existence', { error: cacheError.message });
        }
        
        return {
          statusCode: 409,
          body: JSON.stringify({
            success: false,
            error: 'Token symbol già esistente nel database'
          })
        };
      }
    } catch (error) {
      logger.error('Database check for existing token failed', { 
        error: error.message,
        tokenSymbol 
      });
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Errore durante la verifica del token'
        })
      };
    }

    // Cache key per questa operazione di tokenizzazione
    const operationKey = `tokenization_op:${tokenSymbol}:${userWallet.address}`;
    
    // Controllo se operazione già in corso
    try {
      const existingOperation = await redisService.get(operationKey);
      if (existingOperation) {
        logger.warn('Tokenization already in progress', { 
          tokenSymbol,
          userWalletAddress: userWallet.address,
          operationId: existingOperation.operation_id
        });
        return {
          statusCode: 409,
          body: JSON.stringify({
            success: false,
            error: 'Tokenization already in progress for this asset',
            operation_id: existingOperation.operation_id
          })
        };
      }
    } catch (error) {
      logger.warn('Failed to check existing operation, proceeding', { 
        error: error.message 
      });
    }

    // Registra operazione in corso
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      await redisService.set(operationKey, { 
        operation_id: operationId, 
        status: 'in_progress',
        started_at: new Date().toISOString()
      }, 1800); // 30 minuti TTL
    } catch (error) {
      logger.warn('Failed to register operation in progress', { error: error.message });
    }

    try {
      // Inizializzazione XRPL
      logger.info('Initializing XRPL connection', { operationId });
      await initializeXRPL();
      const client = getXRPLClient();

      // Creazione wallet issuer
      const issuerWallet = issuerSeed ? 
        walletFromSeed(issuerSeed) : 
        walletFromSeed(process.env.ISSUER_SEED || 'sEdTM1uX8pu2do5XvTnutH6HsouMaM2');

      logger.info('Wallet addresses configured', { 
        issuerAddress: issuerWallet.address,
        userAddress: userWallet.address,
        operationId
      });

      // Step 1: Creazione TrustLine REALE su XRPL
      logger.info('Creating TrustLine on XRPL', { 
        tokenSymbol,
        totalSupply,
        operationId 
      });
      
      const trustLineResult = await createTrustLine(
        userWallet,
        tokenSymbol,
        issuerWallet.address,
        totalSupply
      );

      if (!trustLineResult || !trustLineResult.hash) {
        throw new Error('TrustLine creation failed - no transaction hash received');
      }

      logger.info('TrustLine created successfully', { 
        transactionHash: trustLineResult.hash,
        operationId 
      });

      // Step 2: Verifica transazione su ledger
      const txInfo = await client.request({
        command: 'tx',
        transaction: trustLineResult.hash
      });

      if (txInfo.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`TrustLine transaction failed: ${txInfo.result.meta.TransactionResult}`);
      }

      logger.info('TrustLine transaction verified on ledger', { 
        ledgerIndex: txInfo.result.ledger_index,
        operationId 
      });

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
      logger.info('Asset saved to database', { 
        assetId: savedAsset.id,
        operationId 
      });

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
      logger.info('Token saved to database', { 
        tokenId: savedToken.id,
        operationId 
      });

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
      logger.info('Transaction saved to database', { 
        transactionId: savedTransaction.id,
        operationId 
      });

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
      try {
        await redisService.set(existingTokenKey, { 
          symbol: tokenSymbol, 
          exists: true, 
          token_id: savedToken.id 
        }, 3600 * 24); // 24 ore

        // Cache il risultato della tokenizzazione
        await redisService.set(`tokenization_result:${operationId}`, tokenizationResult, 3600 * 24);

        // Cache i dati del token per accesso rapido
        await redisService.cacheTokenPrice(tokenSymbol, assetData.value / totalSupply, 3600);
      } catch (cacheError) {
        logger.warn('Failed to cache tokenization results', { 
          error: cacheError.message,
          operationId 
        });
      }

      // Rimuovi operazione in corso
      try {
        await redisService.del(operationKey);
      } catch (error) {
        logger.warn('Failed to remove operation key', { error: error.message });
      }

      logger.info('Tokenization completed successfully', { 
        tokenSymbol,
        assetId: savedAsset.id,
        tokenId: savedToken.id,
        operationId 
      });

      return {
        statusCode: 200,
        body: JSON.stringify(tokenizationResult)
      };

    } catch (operationError) {
      logger.error('Tokenization operation failed', { 
        error: operationError.message,
        stack: operationError.stack,
        operationId,
        tokenSymbol
      });

      // Rimuovi operazione in corso in caso di errore
      try {
        await redisService.del(operationKey);
      } catch (error) {
        logger.warn('Failed to remove operation key after error', { 
          error: error.message 
        });
      }
      
      // Cache dell'errore per evitare retry immediati
      try {
        await redisService.set(`tokenization_error:${operationId}`, {
          error: operationError.message,
          timestamp: new Date().toISOString()
        }, 300); // 5 minuti
      } catch (error) {
        logger.warn('Failed to cache error', { error: error.message });
      }

      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Errore durante la tokenizzazione',
          details: operationError.message,
          operation_id: operationId,
          timestamp: new Date().toISOString()
        })
      };
    }

  } catch (error) {
    logger.error('Tokenization error', { 
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Errore interno del server durante la tokenizzazione',
        timestamp: new Date().toISOString()
      })
    };
  }
}

export const handler = withCors(createTokenization);

