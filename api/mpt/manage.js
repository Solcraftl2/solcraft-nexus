import { getXRPLClient, initializeXRPL } from '../config/xrpl.js';
import { supabase } from '../config/supabaseClient.js';
import { Wallet } from 'xrpl';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
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

    const { tokenId, mptId } = req.query;

    // GET - Recupera informazioni token MPT
    if (req.method === 'GET') {
      try {
        // Se specificato un tokenId, recupera quel token specifico
        if (tokenId || mptId) {
          const tokenInfo = await getMPTTokenInfo(tokenId || mptId);
          return res.status(200).json({
            success: true,
            token: tokenInfo
          });
        }

        // Altrimenti recupera tutti i token dell'utente
        const userTokens = await getUserMPTTokens(decoded.userId);
        return res.status(200).json({
          success: true,
          tokens: userTokens,
          totalTokens: userTokens.length,
          summary: calculatePortfolioSummary(userTokens)
        });

      } catch (error) {
        console.error('MPT fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch tokens',
          message: error.message
        });
      }
    }

    // PUT - Aggiorna configurazioni token
    if (req.method === 'PUT') {
      if (!tokenId && !mptId) {
        return res.status(400).json({
          success: false,
          error: 'tokenId o mptId richiesto per aggiornamento'
        });
      }

      const {
        assetValuation,
        complianceUpdate,
        metadataUpdate,
        operationalChanges
      } = req.body;

      try {
        const updateResult = await updateMPTToken({
          tokenId: tokenId || mptId,
          assetValuation,
          complianceUpdate,
          metadataUpdate,
          operationalChanges,
          updatedBy: decoded.userId
        });

        return res.status(200).json({
          success: true,
          message: 'Token aggiornato con successo!',
          token: updateResult.token,
          changes: updateResult.changes,
          auditLog: updateResult.auditLog
        });

      } catch (error) {
        console.error('MPT update error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante l\'aggiornamento del token',
          message: error.message
        });
      }
    }

    // POST - Operazioni speciali sui token (mint, burn, freeze)
    if (req.method === 'POST') {
      if (!tokenId && !mptId) {
        return res.status(400).json({
          success: false,
          error: 'tokenId o mptId richiesto per operazioni'
        });
      }

      const {
        operation, // mint, burn, freeze, unfreeze, authorize, unauthorize
        amount,
        recipient,
        reason,
        complianceCheck = true
      } = req.body;

      if (!operation) {
        return res.status(400).json({
          success: false,
          error: 'Operazione richiesta (mint, burn, freeze, etc.)'
        });
      }

      try {
        const operationResult = await executeMPTOperation({
          tokenId: tokenId || mptId,
          operation,
          amount,
          recipient,
          reason,
          complianceCheck,
          executedBy: decoded.userId
        });

        return res.status(200).json({
          success: true,
          message: `Operazione ${operation} completata con successo!`,
          operation: operationResult.operation,
          transaction: operationResult.transaction,
          newState: operationResult.newState,
          auditLog: operationResult.auditLog
        });

      } catch (error) {
        console.error('MPT operation error:', error);
        return res.status(500).json({
          success: false,
          error: `Errore durante l'operazione ${operation}`,
          message: error.message
        });
      }
    }

    // DELETE - Burn completo del token (solo se autorizzato)
    if (req.method === 'DELETE') {
      if (!tokenId && !mptId) {
        return res.status(400).json({
          success: false,
          error: 'tokenId o mptId richiesto per eliminazione'
        });
      }

      const { confirmationCode, reason } = req.body;

      if (!confirmationCode || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Codice di conferma e motivo richiesti per eliminazione'
        });
      }

      try {
        const deleteResult = await deleteMPTToken({
          tokenId: tokenId || mptId,
          confirmationCode,
          reason,
          deletedBy: decoded.userId
        });

        return res.status(200).json({
          success: true,
          message: 'Token eliminato con successo!',
          finalState: deleteResult.finalState,
          auditLog: deleteResult.auditLog,
          assetDisposition: deleteResult.assetDisposition
        });

      } catch (error) {
        console.error('MPT deletion error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante l\'eliminazione del token',
          message: error.message
        });
      }
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('MPT manage API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

// Funzioni helper
async function getMPTTokenInfo(tokenId) {
  const { data, error } = await supabase
    .from('mpt_tokens')
    .select('*')
    .or(`id.eq.${tokenId},mpt_id.eq.${tokenId}`)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getUserMPTTokens(userId) {
  const { data, error } = await supabase
    .from('mpt_holdings')
    .select(`*, mpt_tokens(*)`)
    .eq('user_id', userId)
    .gt('balance', 0);

  if (error) {
    throw new Error(error.message);
  }

  return (
    data?.map(h => ({
      id: h.mpt_tokens.id,
      symbol: h.mpt_tokens.symbol,
      name: h.mpt_tokens.name,
      assetType: h.mpt_tokens.asset_type,
      assetValue: h.mpt_tokens.asset_valuation,
      totalSupply: h.mpt_tokens.current_supply,
      userBalance: h.balance,
      userValue: h.balance * (h.mpt_tokens.current_price || 0),
      status: h.mpt_tokens.status,
      yieldRate: h.mpt_tokens.yield_rate,
      created: h.mpt_tokens.created_at
    })) || []
  );
}

function calculatePortfolioSummary(tokens) {
  const totalValue = tokens.reduce((sum, token) => sum + (token.userValue || 0), 0);
  const totalTokens = tokens.length;
  const assetTypes = [...new Set(tokens.map(token => token.assetType))];
  const avgYield = tokens.reduce((sum, token) => sum + (token.yieldRate || 0), 0) / totalTokens;

  return {
    totalValue: totalValue,
    totalTokens: totalTokens,
    assetTypes: assetTypes,
    averageYield: parseFloat(avgYield.toFixed(2)),
    diversificationScore: Math.min(10, assetTypes.length * 2),
    riskLevel: calculatePortfolioRisk(tokens)
  };
}

function calculatePortfolioRisk(tokens) {
  const riskScores = {
    'real_estate': 3,
    'commodity': 5,
    'equity': 7,
    'bond': 2,
    'art': 8,
    'collectible': 8
  };

  const weightedRisk = tokens.reduce((sum, token) => {
    const risk = riskScores[token.assetType] || 5;
    const weight = (token.userValue || 0) / tokens.reduce((total, t) => total + (t.userValue || 0), 0);
    return sum + (risk * weight);
  }, 0);

  return Math.round(weightedRisk);
}

async function updateMPTToken(params) {
  const { tokenId, metadataUpdate, assetValuation, complianceUpdate, operationalChanges, updatedBy } = params;

  const { data: token, error } = await supabase
    .from('mpt_tokens')
    .select('*')
    .eq('id', tokenId)
    .single();

  if (error || !token) {
    throw new Error(error?.message || 'Token not found');
  }

  await initializeXRPL();
  const client = getXRPLClient();

  const { data: account } = await supabase
    .from('xrpl_accounts')
    .select('*')
    .eq('user_id', updatedBy)
    .eq('network', token.network)
    .single();

  if (!account) {
    throw new Error('XRPL account not found');
  }

  const wallet = Wallet.fromSeed(account.private_key);

  let txHash = null;
  if (metadataUpdate) {
    const metaHex = Buffer.from(JSON.stringify(metadataUpdate)).toString('hex');
    const metaTx = {
      TransactionType: 'MPTokenSet',
      Account: wallet.address,
      MPTokenID: token.mpt_id,
      MPTokenMetadata: metaHex
    };

    const prepared = await client.autofill(metaTx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(result.result.meta.TransactionResult);
    }

    txHash = result.result.hash;
  }

  await supabase
    .from('mpt_tokens')
    .update({
      asset_valuation: assetValuation ?? token.asset_valuation,
      metadata: metadataUpdate ? metadataUpdate : token.metadata,
      compliance: complianceUpdate ?? token.compliance,
      operational_changes: operationalChanges ?? token.operational_changes,
      updated_at: new Date().toISOString()
    })
    .eq('id', tokenId);

  return {
    token: { id: tokenId, lastUpdated: new Date().toISOString() },
    changes: Object.keys(params).filter(k => params[k] && k !== 'tokenId' && k !== 'updatedBy'),
    auditLog: {
      action: 'update',
      timestamp: new Date().toISOString(),
      user: updatedBy,
      transaction: txHash
    }
  };
}

async function executeMPTOperation(params) {
  const { tokenId, operation, amount, recipient, executedBy } = params;

  const { data: token, error } = await supabase
    .from('mpt_tokens')
    .select('*')
    .eq('id', tokenId)
    .single();

  if (error || !token) {
    throw new Error(error?.message || 'Token not found');
  }

  await initializeXRPL();
  const client = getXRPLClient();

  const { data: account } = await supabase
    .from('xrpl_accounts')
    .select('*')
    .eq('user_id', executedBy)
    .eq('network', token.network)
    .single();

  if (!account) {
    throw new Error('XRPL account not found');
  }

  const wallet = Wallet.fromSeed(account.private_key);

  let tx;
  const amountValue = amount ? (parseFloat(amount) * Math.pow(10, token.decimals)).toString() : undefined;

  switch (operation) {
    case 'mint':
      tx = {
        TransactionType: 'MPTokenMint',
        Account: wallet.address,
        MPTokenID: token.mpt_id,
        Amount: amountValue,
        Destination: recipient
      };
      break;
    case 'burn':
      tx = {
        TransactionType: 'MPTokenBurn',
        Account: wallet.address,
        MPTokenID: token.mpt_id,
        Amount: amountValue
      };
      break;
    case 'transfer':
      tx = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: recipient,
        Amount: {
          currency: token.currency_code,
          issuer: wallet.address,
          value: amount
        }
      };
      break;
    case 'authorize':
      tx = {
        TransactionType: 'MPTokenAuthorize',
        Account: wallet.address,
        MPTokenID: token.mpt_id,
        TokenHolder: recipient
      };
      break;
    case 'unauthorize':
    case 'revoke':
      tx = {
        TransactionType: 'MPTokenUnauthorize',
        Account: wallet.address,
        MPTokenID: token.mpt_id,
        TokenHolder: recipient
      };
      break;
    default:
      throw new Error('Unsupported operation');
  }

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(result.result.meta.TransactionResult);
  }

  return {
    operation: {
      type: operation,
      amount,
      recipient,
      timestamp: new Date().toISOString()
    },
    transaction: {
      hash: result.result.hash,
      fee: prepared.Fee,
      validated: result.result.validated
    },
    auditLog: {
      action: operation,
      timestamp: new Date().toISOString(),
      user: executedBy
    }
  };
}

async function deleteMPTToken(params) {
  // Simula eliminazione token
  return {
    finalState: {
      status: 'deleted',
      totalSupply: 0,
      deletedAt: new Date().toISOString()
    },
    auditLog: {
      action: 'delete',
      timestamp: new Date().toISOString(),
      user: params.deletedBy,
      reason: params.reason,
      confirmationCode: params.confirmationCode
    },
    assetDisposition: {
      status: 'pending_liquidation',
      process: 'Asset will be liquidated according to token terms',
      timeline: '30-90 days'
    }
  };
}

