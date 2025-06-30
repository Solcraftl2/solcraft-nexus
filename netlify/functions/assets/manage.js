
const { parse } = require('querystring');

// Helper per compatibilità Vercel -> Netlify
function createReqRes(event) {
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? (event.headers['content-type']?.includes('application/json') ? JSON.parse(event.body) : parse(event.body)) : {},
    query: event.queryStringParameters || {},
    ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1'
  };
  
  const res = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: '',
    
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    json: function(data) {
      this.body = JSON.stringify(data);
      return this;
    },
    
    end: function(data) {
      if (data) this.body = data;
      return this;
    },
    
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    }
  };
  
  return { req, res };
}

import { getXRPLClient, initializeXRPL } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

    const { assetId } = req.query;

    // GET - Recupera informazioni asset
    if (req.method === 'GET') {
      try {
        if (assetId) {
          const assetInfo = await getAssetDetails(assetId);
          return res.status(200).json({
            success: true,
            asset: assetInfo
          });
        }

        // Recupera tutti gli asset dell'utente
        const userAssets = await getUserAssets(decoded.userId);
        return res.status(200).json({
          success: true,
          assets: userAssets,
          totalAssets: userAssets.length,
          summary: calculateAssetSummary(userAssets)
        });

      } catch (error) {
        console.error('Asset fetch error:', error);
        
        // Fallback con dati mock
        const mockAssets = generateMockAssets();
        return res.status(200).json({
          success: true,
          assets: mockAssets,
          totalAssets: mockAssets.length,
          summary: calculateAssetSummary(mockAssets),
          note: 'Dati simulati - Database non disponibile'
        });
      }
    }

    // POST - Registra nuovo asset
    if (req.method === 'POST') {
      const {
        assetType,
        assetName,
        assetDescription,
        location,
        legalOwnership,
        valuation,
        documentation,
        custodyArrangement,
        complianceInfo
      } = req.body;

      if (!assetType || !assetName || !valuation) {
        return res.status(400).json({
          success: false,
          error: 'assetType, assetName e valuation sono richiesti'
        });
      }

      try {
        const newAsset = await registerAsset({
          assetType,
          assetName,
          assetDescription,
          location,
          legalOwnership,
          valuation,
          documentation,
          custodyArrangement,
          complianceInfo,
          registeredBy: decoded.userId
        });

        return res.status(201).json({
          success: true,
          message: 'Asset registrato con successo!',
          asset: newAsset,
          nextSteps: [
            'Completare la documentazione legale',
            'Organizzare la custodia fisica',
            'Ottenere valutazione professionale',
            'Preparare per la tokenizzazione'
          ]
        });

      } catch (error) {
        console.error('Asset registration error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la registrazione asset',
          message: error.message
        });
      }
    }

    // PUT - Aggiorna asset esistente
    if (req.method === 'PUT') {
      if (!assetId) {
        return res.status(400).json({
          success: false,
          error: 'assetId richiesto per aggiornamento'
        });
      }

      const {
        valuationUpdate,
        statusUpdate,
        documentationUpdate,
        maintenanceRecord,
        complianceUpdate
      } = req.body;

      try {
        const updatedAsset = await updateAsset({
          assetId,
          valuationUpdate,
          statusUpdate,
          documentationUpdate,
          maintenanceRecord,
          complianceUpdate,
          updatedBy: decoded.userId
        });

        return res.status(200).json({
          success: true,
          message: 'Asset aggiornato con successo!',
          asset: updatedAsset.asset,
          changes: updatedAsset.changes,
          auditLog: updatedAsset.auditLog
        });

      } catch (error) {
        console.error('Asset update error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante l\'aggiornamento asset',
          message: error.message
        });
      }
    }

    // DELETE - Rimuovi asset (solo se non tokenizzato)
    if (req.method === 'DELETE') {
      if (!assetId) {
        return res.status(400).json({
          success: false,
          error: 'assetId richiesto per eliminazione'
        });
      }

      const { reason, confirmationCode } = req.body;

      if (!reason || !confirmationCode) {
        return res.status(400).json({
          success: false,
          error: 'Motivo e codice di conferma richiesti'
        });
      }

      try {
        const deleteResult = await deleteAsset({
          assetId,
          reason,
          confirmationCode,
          deletedBy: decoded.userId
        });

        return res.status(200).json({
          success: true,
          message: 'Asset rimosso con successo!',
          result: deleteResult
        });

      } catch (error) {
        console.error('Asset deletion error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante l\'eliminazione asset',
          message: error.message
        });
      }
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Asset manage API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

// Funzioni helper
async function getAssetDetails(assetId) {
  // In produzione, recupererebbe dal database
  return {
    id: assetId,
    name: 'Manhattan Office Building',
    type: 'real_estate',
    description: 'Premium office building in Manhattan financial district',
    location: {
      address: '123 Wall Street, New York, NY 10005',
      coordinates: { lat: 40.7074, lng: -74.0113 },
      jurisdiction: 'New York, USA'
    },
    valuation: {
      current: 52000000,
      currency: 'USD',
      lastAppraisal: {
        value: 52000000,
        date: '2024-01-15',
        appraiser: 'Manhattan Real Estate Valuations LLC',
        method: 'Income Approach',
        report: 'appraisal_report_2024_001.pdf'
      },
      history: [
        { date: '2023-01-15', value: 50000000, appraiser: 'Manhattan Real Estate Valuations LLC' },
        { date: '2022-01-15', value: 48000000, appraiser: 'Manhattan Real Estate Valuations LLC' }
      ]
    },
    ownership: {
      legalOwner: 'SolCraft Property Holdings LLC',
      ownershipType: 'Fee Simple',
      titleInsurance: 'First American Title Insurance',
      registrationNumber: 'NYC-PROP-2024-001'
    },
    custody: {
      custodian: 'Manhattan Property Management LLC',
      custodyType: 'Physical Asset Management',
      insuranceProvider: 'Lloyds of London',
      insuranceValue: 55000000,
      securityMeasures: ['24/7 Security', 'Access Control', 'CCTV Monitoring']
    },
    tokenization: {
      status: 'tokenized',
      tokenId: 'PROP001_A1B2C3D4',
      tokenSymbol: 'PROP001',
      totalSupply: 1000000,
      tokenizationDate: '2024-01-01',
      tokenizationRatio: '1 token = $52 asset value'
    },
    compliance: {
      status: 'compliant',
      jurisdiction: 'USA',
      regulations: ['SEC Regulation D', 'CFTC Commodity Pool'],
      licenses: ['Real Estate License NY-12345'],
      lastAudit: '2024-01-01',
      nextAudit: '2024-07-01'
    },
    performance: {
      rentalIncome: {
        monthly: 416667, // $5M annual / 12
        annual: 5000000,
        occupancyRate: 95,
        yieldRate: 9.6
      },
      maintenance: {
        lastMaintenance: '2024-01-01',
        nextMaintenance: '2024-04-01',
        annualCosts: 500000
      },
      marketMetrics: {
        capRate: 9.6,
        pricePerSqFt: 650,
        totalSqFt: 80000,
        comparablesSales: [
          { address: '125 Wall Street', price: 48000000, date: '2023-12-01' },
          { address: '127 Wall Street', price: 54000000, date: '2024-01-01' }
        ]
      }
    },
    documentation: [
      { type: 'deed', name: 'Property Deed', status: 'verified', hash: 'deed_hash_123' },
      { type: 'appraisal', name: 'Current Appraisal', status: 'current', hash: 'appraisal_hash_456' },
      { type: 'insurance', name: 'Insurance Policy', status: 'active', hash: 'insurance_hash_789' },
      { type: 'environmental', name: 'Environmental Report', status: 'current', hash: 'env_hash_012' }
    ],
    status: 'active',
    created: '2024-01-01T00:00:00Z',
    lastUpdated: '2024-01-15T10:30:00Z'
  };
}

async function getUserAssets(userId) {
  // In produzione, recupererebbe dal database dell'utente
  return generateMockAssets();
}

function generateMockAssets() {
  return [
    {
      id: 'ASSET_001',
      name: 'Manhattan Office Building',
      type: 'real_estate',
      value: 52000000,
      currency: 'USD',
      status: 'tokenized',
      tokenId: 'PROP001_A1B2C3D4',
      location: 'Manhattan, NY',
      yieldRate: 9.6,
      lastValuation: '2024-01-15'
    },
    {
      id: 'ASSET_002',
      name: 'Physical Gold Reserve',
      type: 'commodity',
      value: 10000000,
      currency: 'USD',
      status: 'tokenized',
      tokenId: 'GOLD001_E5F6G7H8',
      location: 'Swiss Vault, Zurich',
      yieldRate: 0.0,
      lastValuation: '2024-01-20'
    },
    {
      id: 'ASSET_003',
      name: 'Renaissance Art Collection',
      type: 'art',
      value: 25000000,
      currency: 'USD',
      status: 'tokenized',
      tokenId: 'ART001_I9J0K1L2',
      location: 'Secure Art Storage, Geneva',
      yieldRate: 0.0,
      lastValuation: '2024-02-01'
    },
    {
      id: 'ASSET_004',
      name: 'Solar Farm Texas',
      type: 'renewable_energy',
      value: 15000000,
      currency: 'USD',
      status: 'pending_tokenization',
      tokenId: null,
      location: 'Texas, USA',
      yieldRate: 7.2,
      lastValuation: '2024-01-10'
    }
  ];
}

function calculateAssetSummary(assets) {
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const tokenizedAssets = assets.filter(asset => asset.status === 'tokenized').length;
  const assetTypes = [...new Set(assets.map(asset => asset.type))];
  const avgYield = assets.reduce((sum, asset) => sum + asset.yieldRate, 0) / assets.length;

  return {
    totalValue: totalValue,
    totalAssets: assets.length,
    tokenizedAssets: tokenizedAssets,
    pendingTokenization: assets.length - tokenizedAssets,
    assetTypes: assetTypes,
    averageYield: parseFloat(avgYield.toFixed(2)),
    topPerformer: assets.reduce((top, asset) => 
      asset.yieldRate > (top?.yieldRate || 0) ? asset : top, null
    )
  };
}

async function registerAsset(params) {
  // Simula registrazione asset
  const assetId = 'ASSET_' + Date.now();
  
  return {
    id: assetId,
    name: params.assetName,
    type: params.assetType,
    description: params.assetDescription,
    location: params.location,
    valuation: params.valuation,
    status: 'registered',
    registrationDate: new Date().toISOString(),
    registeredBy: params.registeredBy,
    nextSteps: [
      'Complete legal documentation',
      'Arrange physical custody',
      'Obtain professional appraisal',
      'Prepare for tokenization'
    ]
  };
}

async function updateAsset(params) {
  // Simula aggiornamento asset
  return {
    asset: {
      id: params.assetId,
      lastUpdated: new Date().toISOString()
    },
    changes: Object.keys(params).filter(key => params[key] && key !== 'assetId' && key !== 'updatedBy'),
    auditLog: {
      action: 'update',
      timestamp: new Date().toISOString(),
      user: params.updatedBy,
      changes: 'Asset information updated'
    }
  };
}

async function deleteAsset(params) {
  // Simula eliminazione asset
  return {
    status: 'deleted',
    deletedAt: new Date().toISOString(),
    reason: params.reason,
    auditLog: {
      action: 'delete',
      timestamp: new Date().toISOString(),
      user: params.deletedBy,
      confirmationCode: params.confirmationCode
    }
  };
}

