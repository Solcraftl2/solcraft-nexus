import { getXRPLClient, initializeXRPL } from '../config/xrpl.js';
import { Wallet } from 'xrpl';
import { supabase, insertTransaction } from '../config/supabaseClient.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
          error: 'Errore durante il recupero dei token',
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
  // In produzione, recupererebbe da XRPL e database
  return {
    id: tokenId,
    symbol: 'PROP001',
    name: 'Manhattan Office Building Token',
    totalSupply: 1000000,
    circulatingSupply: 750000,
    decimals: 6,
    issuer: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
    status: 'active',
    assetBacking: {
      type: 'real_estate',
      value: 50000000,
      currency: 'USD',
      location: 'Manhattan, NY',
      lastAppraisal: {
        value: 52000000,
        date: '2024-01-15',
        appraiser: 'Manhattan Real Estate Valuations LLC'
      }
    },
    metrics: {
      tokenPrice: 52.00,
      marketCap: 52000000,
      backingRatio: '1:1',
      liquidityScore: 4,
      riskScore: 3,
      yieldRate: 4.2
    },
    compliance: {
      status: 'compliant',
      jurisdiction: 'USA',
      lastAudit: '2024-01-01',
      nextAudit: '2024-07-01'
    },
    created: '2024-01-01T00:00:00Z',
    lastUpdated: '2024-01-15T10:30:00Z'
  };
}

async function getUserMPTTokens(userId) {
  const { data, error } = await supabase
    .from('mpt_tokens')
    .select('*')
    .eq('creator_id', userId);
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
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
  await initializeXRPL();
  const client = getXRPLClient();

  const { data: token, error } = await supabase
    .from('mpt_tokens')
    .select('*')
    .eq('id', params.tokenId)
    .single();
  if (error || !token) {
    throw new Error('Token not found');
  }

  const { data: account, error: accErr } = await supabase
    .from('xrpl_accounts')
    .select('*')
    .eq('user_id', params.updatedBy)
    .eq('network', token.network)
    .single();
  if (accErr || !account) {
    throw new Error('XRPL account not found');
  }

  const wallet = Wallet.fromSeed(account.private_key);

  const tx = {
    TransactionType: 'AccountSet',
    Account: wallet.address,
    Memos: params.metadataUpdate
      ? [{ Memo: { MemoData: Buffer.from(JSON.stringify(params.metadataUpdate)).toString('hex') } }]
      : undefined
  };

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(result.result.meta.TransactionResult);
  }

  const updates = {};
  if (params.assetValuation) updates.asset_valuation = params.assetValuation;
  if (params.metadataUpdate) updates.metadata = {
    ...(token.metadata || {}),
    ...params.metadataUpdate
  };
  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    await supabase.from('mpt_tokens').update(updates).eq('id', params.tokenId);
  }

  await insertTransaction({
    tx_hash: result.result.hash,
    type: 'mpt_update',
    from_address: wallet.address,
    to_address: wallet.address,
    amount: null,
    currency: token.currency_code,
    token_id: params.tokenId,
    user_id: params.updatedBy,
    status: result.result.validated ? 'confirmed' : 'submitted',
    blockchain_network: token.network,
    metadata: { reason: params.operationalChanges || null },
    created_at: new Date().toISOString()
  });

  return {
    token: { id: params.tokenId, lastUpdated: new Date().toISOString(), txHash: result.result.hash },
    changes: Object.keys(updates),
    auditLog: {
      action: 'update',
      timestamp: new Date().toISOString(),
      user: params.updatedBy
    }
  };
}

async function executeMPTOperation(params) {
  await initializeXRPL();
  const client = getXRPLClient();

  const { data: token, error } = await supabase
    .from('mpt_tokens')
    .select('*')
    .eq('id', params.tokenId)
    .single();
  if (error || !token) {
    throw new Error('Token not found');
  }

  const { data: account, error: accErr } = await supabase
    .from('xrpl_accounts')
    .select('*')
    .eq('user_id', params.executedBy)
    .eq('network', token.network)
    .single();
  if (accErr || !account) {
    throw new Error('XRPL account not found');
  }

  const wallet = Wallet.fromSeed(account.private_key);
  let tx;

  switch (params.operation) {
    case 'mint':
      tx = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: params.recipient,
        Amount: {
          currency: token.currency_code,
          issuer: wallet.address,
          value: params.amount.toString()
        }
      };
      break;
    case 'burn':
      tx = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: wallet.address,
        Amount: {
          currency: token.currency_code,
          issuer: wallet.address,
          value: params.amount.toString()
        },
        Flags: 0x00020000
      };
      break;
    case 'transfer':
      tx = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: params.recipient,
        Amount: {
          currency: token.currency_code,
          issuer: token.issuer_address || wallet.address,
          value: params.amount.toString()
        }
      };
      break;
    case 'authorize':
    case 'revoke':
      tx = {
        TransactionType: 'AllowTrust',
        Account: wallet.address,
        Trustor: params.recipient,
        Currency: token.currency_code,
        Authorized: params.operation === 'authorize'
      };
      break;
    default:
      throw new Error('Unsupported operation');
  }

  if (params.reason) {
    tx.Memos = [{ Memo: { MemoData: Buffer.from(params.reason).toString('hex') } }];
  }

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
    throw new Error(result.result.meta.TransactionResult);
  }

  let newSupply = parseFloat(token.current_supply || 0);
  if (params.operation === 'mint') newSupply += parseFloat(params.amount || 0);
  if (params.operation === 'burn') newSupply -= parseFloat(params.amount || 0);

  if (params.operation === 'mint' || params.operation === 'burn') {
    await supabase
      .from('mpt_tokens')
      .update({ current_supply: newSupply, updated_at: new Date().toISOString() })
      .eq('id', params.tokenId);
  }

  await insertTransaction({
    tx_hash: result.result.hash,
    type: `mpt_${params.operation}`,
    from_address: wallet.address,
    to_address: params.recipient || wallet.address,
    amount: params.amount || null,
    currency: token.currency_code,
    token_id: params.tokenId,
    user_id: params.executedBy,
    status: result.result.validated ? 'confirmed' : 'submitted',
    blockchain_network: token.network,
    created_at: new Date().toISOString()
  });

  return {
    operation: {
      type: params.operation,
      amount: params.amount,
      recipient: params.recipient
    },
    transaction: { hash: result.result.hash, validated: result.result.validated },
    newState: { currentSupply: newSupply },
    auditLog: {
      action: params.operation,
      timestamp: new Date().toISOString(),
      user: params.executedBy,
      reason: params.reason
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

