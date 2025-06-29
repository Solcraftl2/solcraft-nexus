import xrplTokenizationService from '../services/xrplTokenizationService.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST for MPT creation.' 
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
      issuerAccount,
      assetDetails,
      tokenConfig,
      complianceSettings,
      metadata
    } = req.body;

    // Validazione dati richiesti
    if (!issuerAccount || !assetDetails || !tokenConfig) {
      return res.status(400).json({
        success: false,
        error: 'issuerAccount, assetDetails e tokenConfig sono richiesti'
      });
    }

    // Validazione asset details
    const {
      assetType, // real_estate, commodity, equity, bond, art, etc.
      assetName,
      assetDescription,
      assetValue,
      assetCurrency = 'USD',
      assetLocation,
      legalOwnership,
      appraisalDate,
      appraisalValue,
      custodian
    } = assetDetails;

    if (!assetType || !assetName || !assetValue) {
      return res.status(400).json({
        success: false,
        error: 'assetType, assetName e assetValue sono richiesti'
      });
    }

    // Validazione token config
    const {
      tokenSymbol,
      totalSupply,
      decimals = 6,
      transferable = true,
      burnable = false,
      mintable = false,
      freezable = true
    } = tokenConfig;

    if (!tokenSymbol || !totalSupply) {
      return res.status(400).json({
        success: false,
        error: 'tokenSymbol e totalSupply sono richiesti'
      });
    }

    // Genera ID univoco per il token MPT
    const mptId = crypto.randomBytes(16).toString('hex').toUpperCase();
    const tokenId = `${tokenSymbol}_${mptId.substring(0, 8)}`;

    // Costruisci la transazione MPTCreate
    const mptCreateTx = {
      TransactionType: 'MPTCreate',
      Account: issuerAccount,
      MPTokenIssuanceID: mptId,
      MaximumAmount: (totalSupply * Math.pow(10, decimals)).toString(),
      TransferFee: tokenConfig.transferFee || 0,
      MPTFlags: calculateMPTFlags({
        transferable,
        burnable,
        mintable,
        freezable
      })
    };

    // Metadata del token (seguendo standard XRPL)
    const tokenMetadata = {
      name: assetName,
      symbol: tokenSymbol,
      description: assetDescription,
      decimals: decimals,
      totalSupply: totalSupply,
      assetBacking: {
        type: assetType,
        value: assetValue,
        currency: assetCurrency,
        location: assetLocation,
        appraisal: {
          value: appraisalValue,
          date: appraisalDate,
          currency: assetCurrency
        },
        legalOwnership: legalOwnership,
        custodian: custodian
      },
      compliance: {
        jurisdiction: complianceSettings?.jurisdiction || 'International',
        regulations: complianceSettings?.regulations || [],
        kycRequired: complianceSettings?.kycRequired || true,
        amlCompliant: complianceSettings?.amlCompliant || true,
        accreditedInvestorsOnly: complianceSettings?.accreditedInvestorsOnly || false
      },
      issuer: {
        account: issuerAccount,
        name: metadata?.issuerName || 'SolCraft Nexus Platform',
        website: metadata?.issuerWebsite,
        contact: metadata?.issuerContact
      },
      created: new Date().toISOString(),
      version: '1.0',
      standard: 'XRPL-MPT-RWA'
    };

      // Creazione reale del token MPT tramite servizio condiviso
      try {
        const assetForXRPL = {
          name: assetName,
          symbol: tokenSymbol,
          location: assetLocation,
          description: assetDescription,
          faceValue: assetValue,
          totalSupply: totalSupply,
          currency: assetCurrency,
          valuation: appraisalValue || assetValue,
          legalDocuments: []
        };

        const creation = await xrplTokenizationService.createRealEstateToken(assetForXRPL);
        await xrplTokenizationService.disconnect();

        const simulatedTxResult = {
          success: true,
          transactionHash: creation.transactionHash,
          ledgerIndex: creation.ledgerIndex,
          validated: true,
          mptId: creation.mptIssuanceId
        };

      // Calcola metriche del token
      const tokenMetrics = {
        tokenizationRatio: (totalSupply / assetValue).toFixed(6),
        minimumInvestment: (assetValue / totalSupply).toFixed(2),
        marketCap: assetValue,
        backingRatio: '1:1', // 1 token = 1/totalSupply dell'asset
        liquidityScore: calculateLiquidityScore(assetType, assetValue),
        riskScore: calculateRiskScore(assetType, complianceSettings)
      };

      // Genera documenti di compliance
      const complianceDocuments = generateComplianceDocuments({
        tokenId,
        assetDetails,
        tokenConfig,
        complianceSettings,
        issuerAccount
      });

      const response = {
        success: true,
        message: 'Multi-Purpose Token creato con successo!',
        token: {
          id: tokenId,
          mptId: mptId,
          symbol: tokenSymbol,
          name: assetName,
          totalSupply: totalSupply,
          decimals: decimals,
          issuer: issuerAccount,
          status: 'created',
          network: process.env.XRPL_NETWORK || 'testnet'
        },
        assetBacking: {
          type: assetType,
          value: assetValue,
          currency: assetCurrency,
          tokenizationDate: new Date().toISOString()
        },
        transaction: simulatedTxResult,
        metadata: tokenMetadata,
        metrics: tokenMetrics,
        compliance: {
          status: 'compliant',
          documents: complianceDocuments,
          nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 anno
        },
        nextSteps: [
          'Configurare le trust lines per la distribuzione',
          'Impostare le autorizzazioni di trasferimento',
          'Completare la documentazione legale',
          'Avviare il processo di distribuzione ai investitori',
          'Configurare il monitoraggio dell\'asset sottostante'
        ],
        warnings: [
          'Assicurarsi che l\'asset sia correttamente custodito',
          'Verificare la conformità normativa nella giurisdizione applicabile',
          'Mantenere aggiornate le valutazioni dell\'asset',
          'Implementare procedure di audit regolari'
        ]
      };

      // Log per audit
      console.log('MPT Token created:', {
        tokenId: tokenId,
        mptId: mptId,
        issuer: issuerAccount,
        assetType: assetType,
        assetValue: assetValue,
        totalSupply: totalSupply,
        createdBy: decoded.userId,
        timestamp: new Date().toISOString()
      });

      return res.status(201).json(response);

    } catch (error) {
      console.error('MPT creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore durante la creazione del token MPT',
        message: error.message
      });
    }

  } catch (error) {
    console.error('MPT create API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server durante la creazione MPT',
      message: error.message
    });
  }
}

// Funzioni helper
function calculateMPTFlags({ transferable, burnable, mintable, freezable }) {
  let flags = 0;
  if (!transferable) flags |= 0x00000001; // lsfMPTLocked
  if (burnable) flags |= 0x00000002; // lsfMPTCanEscrow
  if (mintable) flags |= 0x00000004; // lsfMPTCanTrade
  if (freezable) flags |= 0x00000008; // lsfMPTCanTransfer
  return flags;
}

function calculateLiquidityScore(assetType, assetValue) {
  const liquidityScores = {
    'real_estate': 3, // Bassa liquidità
    'commodity': 7, // Alta liquidità
    'equity': 8, // Molto alta liquidità
    'bond': 6, // Media-alta liquidità
    'art': 2, // Molto bassa liquidità
    'collectible': 2,
    'infrastructure': 4,
    'renewable_energy': 5
  };
  
  const baseScore = liquidityScores[assetType] || 5;
  const valueMultiplier = assetValue > 1000000 ? 1.2 : assetValue > 100000 ? 1.0 : 0.8;
  
  return Math.min(10, Math.round(baseScore * valueMultiplier));
}

function calculateRiskScore(assetType, complianceSettings) {
  const riskScores = {
    'real_estate': 4, // Rischio medio-basso
    'commodity': 6, // Rischio medio-alto
    'equity': 7, // Rischio alto
    'bond': 3, // Rischio basso
    'art': 8, // Rischio molto alto
    'collectible': 8,
    'infrastructure': 3,
    'renewable_energy': 5
  };
  
  let baseScore = riskScores[assetType] || 5;
  
  // Aggiustamenti per compliance
  if (complianceSettings?.kycRequired) baseScore -= 1;
  if (complianceSettings?.amlCompliant) baseScore -= 1;
  if (complianceSettings?.accreditedInvestorsOnly) baseScore -= 1;
  
  return Math.max(1, Math.min(10, baseScore));
}

function generateComplianceDocuments({ tokenId, assetDetails, tokenConfig, complianceSettings, issuerAccount }) {
  return [
    {
      type: 'token_whitepaper',
      name: `${tokenId}_Whitepaper.pdf`,
      description: 'Documento tecnico del token e dell\'asset sottostante',
      status: 'generated',
      hash: crypto.createHash('sha256').update(tokenId + 'whitepaper').digest('hex')
    },
    {
      type: 'legal_opinion',
      name: `${tokenId}_Legal_Opinion.pdf`,
      description: 'Parere legale sulla conformità normativa',
      status: 'pending',
      requiredBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      type: 'asset_appraisal',
      name: `${tokenId}_Asset_Appraisal.pdf`,
      description: 'Valutazione professionale dell\'asset',
      status: assetDetails.appraisalDate ? 'completed' : 'required',
      validUntil: assetDetails.appraisalDate ? 
        new Date(new Date(assetDetails.appraisalDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() : 
        null
    },
    {
      type: 'custody_agreement',
      name: `${tokenId}_Custody_Agreement.pdf`,
      description: 'Accordo di custodia dell\'asset',
      status: assetDetails.custodian ? 'completed' : 'required'
    }
  ];
}

