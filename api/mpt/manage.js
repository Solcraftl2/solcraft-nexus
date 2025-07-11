import { logger } from '../utils/logger.js';
import { getXRPLClient, initializeXRPL, getAccountInfo } from '../config/xrpl.js';
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
        logger.error('MPT fetch error:', error);
        
        // Fallback con dati mock
        const mockTokens = generateMockMPTTokens();
        return res.status(200).json({
          success: true,
          tokens: mockTokens,
          totalTokens: mockTokens.length,
          summary: calculatePortfolioSummary(mockTokens),
          note: 'Dati simulati - XRPL non disponibile'
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
        logger.error('MPT update error:', error);
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
        logger.error('MPT operation error:', error);
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
        logger.error('MPT deletion error:', error);
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
    logger.error('MPT manage API error:', error);
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
  // In produzione, recupererebbe dal database dell'utente
  return generateMockMPTTokens();
}

function generateMockMPTTokens() {
  return [
    {
      id: 'PROP001_A1B2C3D4',
      symbol: 'PROP001',
      name: 'Manhattan Office Building',
      assetType: 'real_estate',
      assetValue: 50000000,
      totalSupply: 1000000,
      userBalance: 5000,
      userValue: 260000,
      status: 'active',
      yieldRate: 4.2,
      created: '2024-01-01T00:00:00Z'
    },
    {
      id: 'GOLD001_E5F6G7H8',
      symbol: 'GOLD001',
      name: 'Physical Gold Reserve',
      assetType: 'commodity',
      assetValue: 10000000,
      totalSupply: 500000,
      userBalance: 1000,
      userValue: 20000,
      status: 'active',
      yieldRate: 0.0,
      created: '2024-01-15T00:00:00Z'
    },
    {
      id: 'ART001_I9J0K1L2',
      symbol: 'ART001',
      name: 'Renaissance Art Collection',
      assetType: 'art',
      assetValue: 25000000,
      totalSupply: 100000,
      userBalance: 250,
      userValue: 62500,
      status: 'active',
      yieldRate: 0.0,
      created: '2024-02-01T00:00:00Z'
    }
  ];
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
  // Simula aggiornamento token
  return {
    token: {
      id: params.tokenId,
      lastUpdated: new Date().toISOString()
    },
    changes: Object.keys(params).filter(key => params[key] && key !== 'tokenId' && key !== 'updatedBy'),
    auditLog: {
      action: 'update',
      timestamp: new Date().toISOString(),
      user: params.updatedBy,
      changes: 'Token metadata and valuation updated'
    }
  };
}

async function executeMPTOperation(params) {
  // Simula operazione su token
  return {
    operation: {
      type: params.operation,
      amount: params.amount,
      recipient: params.recipient,
      timestamp: new Date().toISOString()
    },
    transaction: {
      hash: 'mpt_op_' + Date.now(),
      fee: '12',
      validated: true
    },
    newState: {
      totalSupply: params.operation === 'mint' ? 'increased' : params.operation === 'burn' ? 'decreased' : 'unchanged'
    },
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

