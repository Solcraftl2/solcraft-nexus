import { getXRPLClient, initializeXRPL, getAccountInfo, walletFromSeed } from '../config/xrpl.js';
import { supabase, insertAsset, insertToken, insertTransaction, handleSupabaseError } from '../config/supabaseClient.js';
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
      issuerSeed,
      assetDetails,
      tokenConfig,
      complianceSettings,
      metadata
    } = req.body;

    const walletSeed = issuerSeed || process.env.ISSUER_WALLET_SEED;

    // Validazione input
    if (!issuerAccount || !walletSeed || !assetDetails || !tokenConfig) {
      return res.status(400).json({
        success: false,
        error: 'Parametri obbligatori mancanti: issuerAccount, issuerSeed, assetDetails, tokenConfig'
      });
    }

    const {
      assetName,
      assetType,
      assetValue,
      assetCurrency,
      assetLocation,
      appraisalValue,
      appraisalDate,
      legalOwnership,
      custodian
    } = assetDetails;

    const {
      tokenSymbol,
      totalSupply,
      decimals,
      transferable,
      burnable,
      mintable,
      freezable
    } = tokenConfig;

    // Validazione asset
    if (!assetName || !assetType || !assetValue || !tokenSymbol || !totalSupply) {
      return res.status(400).json({
        success: false,
        error: 'Dettagli asset e token incompleti'
      });
    }

    // Generazione ID unici
    const tokenId = `MPT_${tokenSymbol}_${Date.now()}`;
    const mptId = crypto.randomBytes(16).toString('hex').toUpperCase();
    const createdAt = new Date().toISOString();

    // Calcola metriche del token
    const tokenMetrics = {
      tokenizationRatio: (totalSupply / assetValue).toFixed(6),
      minimumInvestment: (assetValue / totalSupply).toFixed(2),
      marketCap: assetValue,
      backingRatio: '1:1',
      liquidityScore: calculateLiquidityScore(assetType, assetValue),
      riskScore: calculateRiskScore(assetType, complianceSettings)
    };

    // Salvataggio Asset nel database Supabase
    let savedAsset;
    try {
      const assetData = {
        name: assetName,
        type: assetType,
        description: `Multi-Purpose Token backed by ${assetType}`,
        location: assetLocation || '',
        value: parseFloat(assetValue),
        currency: assetCurrency || 'USD',
        appraisal_value: appraisalValue ? parseFloat(appraisalValue) : parseFloat(assetValue),
        appraisal_date: appraisalDate || createdAt,
        legal_ownership: legalOwnership || '',
        custodian: custodian || '',
        documents: [],
        metadata: {
          ...metadata,
          mptId: mptId,
          tokenMetrics: tokenMetrics
        },
        owner_id: decoded.userId,
        status: 'tokenized',
        created_at: createdAt,
        updated_at: createdAt
      };

      savedAsset = await insertAsset(assetData);
      console.log('MPT Asset saved to database:', savedAsset.id);

    } catch (error) {
      console.error('Error saving MPT asset to database:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore durante il salvataggio dell\'asset MPT nel database',
        details: error.message
      });
    }

    // Creazione token MPT su XRPL
    let mptCreationResult;
    const useMock = process.env.MOCK_XRPL === 'true';

    try {
      if (!useMock) {
        await initializeXRPL().catch(() => {});
        const client = getXRPLClient();
        const issuerWallet = walletFromSeed(walletSeed);

        const metadataHex = Buffer.from(JSON.stringify(metadata || {}))
          .toString('hex')
          .toUpperCase();

        const mptCreateTx = {
          TransactionType: 'MPTokenIssuanceCreate',
          Account: issuerWallet.address,
          MPTokenMetadata: metadataHex,
          MaximumAmount: totalSupply.toString()
        };

        const prepared = await client.autofill(mptCreateTx);
        const signed = issuerWallet.sign(prepared);
        const result = await client.submitAndWait(signed.tx_blob);

        let onChainMptId = mptId;
        const created = result.result.meta?.CreatedNode
          ? Array.isArray(result.result.meta.CreatedNode)
            ? result.result.meta.CreatedNode
            : [result.result.meta.CreatedNode]
          : [];
        for (const node of created) {
          if (node.NewFields && node.NewFields.MPTokenID) {
            onChainMptId = node.NewFields.MPTokenID;
            break;
          }
        }

        mptCreationResult = {
          success: true,
          transactionHash: result.result.hash,
          ledgerIndex: result.result.ledger_index,
          fee: prepared.Fee,
          sequence: prepared.Sequence,
          validated: result.result.validated,
          mptId: onChainMptId
        };
      } else {
        // Logic mocked when MOCK_XRPL=true
        mptCreationResult = {
          success: true,
          transactionHash: `MPT_${mptId}_${Date.now().toString(16).toUpperCase()}`,
          ledgerIndex: Math.floor(Math.random() * 1000000),
          fee: '2000',
          sequence: Math.floor(Math.random() * 1000),
          validated: true,
          mptId: mptId
        };
      }

    } catch (error) {
      console.error('MPT creation error:', error);
      mptCreationResult = {
        success: false,
        error: error.message
      };
    }

    // Salvataggio Token MPT nel database Supabase
    let savedToken;
    try {
      const tokenData = {
        id: tokenId,
        symbol: tokenSymbol,
        name: `${assetName} MPT`,
        type: 'MPT',
        total_supply: totalSupply,
        circulating_supply: 0,
        decimals: decimals || 6,
        asset_id: savedAsset.id,
        issuer_address: issuerAccount,
        blockchain_network: 'XRPL',
        tx_hash: mptCreationResult.transactionHash,
        mpt_id: mptId,
        status: mptCreationResult.success ? 'active' : 'failed',
        transferable: transferable !== false,
        burnable: burnable === true,
        mintable: mintable === true,
        freezable: freezable === true,
        initial_price: parseFloat(assetValue) / totalSupply,
        current_price: parseFloat(assetValue) / totalSupply,
        price_currency: assetCurrency || 'USD',
        creator_id: decoded.userId,
        metadata: {
          tokenMetrics: tokenMetrics,
          complianceSettings: complianceSettings,
          assetBacking: {
            type: assetType,
            value: assetValue,
            currency: assetCurrency,
            appraisalValue: appraisalValue,
            appraisalDate: appraisalDate
          }
        },
        created_at: createdAt,
        updated_at: createdAt
      };

      savedToken = await insertToken(tokenData);
      console.log('MPT Token saved to database:', savedToken.id);

    } catch (error) {
      console.error('Error saving MPT token to database:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore durante il salvataggio del token MPT nel database',
        details: error.message
      });
    }

    // Salvataggio Transazione nel database Supabase
    if (mptCreationResult.success) {
      try {
        const transactionData = {
          tx_hash: mptCreationResult.transactionHash,
          type: 'mpt_creation',
          from_address: null,
          to_address: issuerAccount,
          amount: totalSupply,
          currency: tokenSymbol,
          token_id: savedToken.id,
          user_id: decoded.userId,
          status: 'confirmed',
          blockchain_network: 'XRPL',
          block_height: mptCreationResult.ledgerIndex,
          gas_fee: parseFloat(mptCreationResult.fee) / 1000000, // Convert drops to XRP
          description: `MPT creation for ${assetName}`,
          metadata: {
            mptId: mptId,
            assetName,
            assetType,
            assetValue,
            tokenSymbol,
            totalSupply,
            tokenMetrics
          },
          created_at: createdAt
        };

        const savedTransaction = await insertTransaction(transactionData);
        console.log('MPT Transaction saved to database:', savedTransaction.id);

      } catch (error) {
        console.error('Error saving MPT transaction to database:', error);
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
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: decoded.userId,
            name: 'Portfolio MPT',
            description: 'Portfolio Multi-Purpose Token',
            total_value: parseFloat(assetValue),
            currency: assetCurrency || 'USD',
            created_at: createdAt
          })
          .select()
          .single();

        if (createError) throw createError;
        portfolioId = newPortfolio.id;
      } else {
        portfolioId = portfolios[0].id;
        
        await supabase
          .from('portfolios')
          .update({
            total_value: portfolios[0].total_value + parseFloat(assetValue),
            updated_at: createdAt
          })
          .eq('id', portfolioId);
      }

      // Aggiungi MPT al portfolio
      await supabase
        .from('portfolio_assets')
        .insert({
          portfolio_id: portfolioId,
          asset_id: savedAsset.id,
          token_id: savedToken.id,
          quantity: totalSupply,
          purchase_price: parseFloat(assetValue) / totalSupply,
          current_price: parseFloat(assetValue) / totalSupply,
          total_value: parseFloat(assetValue),
          currency: assetCurrency || 'USD',
          created_at: createdAt
        });

    } catch (error) {
      console.error('Error updating user portfolio with MPT:', error);
    }

    // Registra attività utente
    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: decoded.userId,
          activity_type: 'mpt_creation',
          description: `Created MPT ${tokenSymbol} for asset ${assetName}`,
          metadata: {
            tokenId: savedToken.id,
            assetId: savedAsset.id,
            mptId: mptId,
            txHash: mptCreationResult.transactionHash
          },
          created_at: createdAt
        });
    } catch (error) {
      console.error('Error logging MPT creation activity:', error);
    }

    // Genera documenti di compliance
    const complianceDocuments = generateComplianceDocuments({
      tokenId,
      assetDetails,
      tokenConfig,
      complianceSettings,
      issuerAccount
    });

    // Risposta di successo
    if (mptCreationResult.success) {
      return res.status(201).json({
        success: true,
        message: 'Multi-Purpose Token creato con successo e salvato nel database!',
        data: {
          token: {
            id: savedToken.id,
            mptId: mptId,
            symbol: tokenSymbol,
            name: savedToken.name,
            totalSupply: totalSupply,
            decimals: decimals || 6,
            issuer: issuerAccount,
            status: 'active',
            network: 'XRPL'
          },
          asset: {
            id: savedAsset.id,
            name: assetName,
            type: assetType,
            value: assetValue,
            currency: assetCurrency
          },
          transaction: {
            hash: mptCreationResult.transactionHash,
            status: 'confirmed',
            ledgerIndex: mptCreationResult.ledgerIndex,
            fee: mptCreationResult.fee,
            network: 'XRPL'
          },
          metrics: tokenMetrics,
          compliance: {
            status: 'compliant',
            documents: complianceDocuments,
            nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          nextSteps: [
            'MPT salvato nel database con successo',
            'Asset aggiunto al portfolio',
            'Configurare le trust lines per la distribuzione',
            'Completare la documentazione legale',
            'Avviare il processo di distribuzione'
          ]
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Errore durante la creazione del token MPT sulla blockchain',
        details: mptCreationResult.error,
        data: {
          asset: savedAsset ? { id: savedAsset.id } : null,
          token: savedToken ? { id: savedToken.id, status: 'failed' } : null
        }
      });
    }

  } catch (error) {
    console.error('MPT creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server durante la creazione MPT',
      message: error.message
    });
  }
}

// Funzioni helper
function calculateLiquidityScore(assetType, assetValue) {
  const baseScore = 50;
  const typeMultiplier = {
    'real_estate': 0.3,
    'commodity': 0.7,
    'equity': 0.9,
    'bond': 0.8,
    'art': 0.2,
    'collectible': 0.1
  };
  
  const valueMultiplier = assetValue > 1000000 ? 1.2 : assetValue > 100000 ? 1.0 : 0.8;
  
  return Math.min(100, Math.round(baseScore * (typeMultiplier[assetType] || 0.5) * valueMultiplier));
}

function calculateRiskScore(assetType, complianceSettings) {
  const baseRisk = 50;
  const typeRisk = {
    'real_estate': 30,
    'commodity': 60,
    'equity': 70,
    'bond': 20,
    'art': 80,
    'collectible': 90
  };
  
  const complianceBonus = complianceSettings?.jurisdiction ? -10 : 0;
  
  return Math.max(0, Math.min(100, (typeRisk[assetType] || 50) + complianceBonus));
}

function generateComplianceDocuments(params) {
  return [
    {
      type: 'token_creation_certificate',
      name: 'Certificato di Creazione Token',
      status: 'generated',
      date: new Date().toISOString()
    },
    {
      type: 'asset_backing_declaration',
      name: 'Dichiarazione di Backing Asset',
      status: 'generated',
      date: new Date().toISOString()
    },
    {
      type: 'compliance_checklist',
      name: 'Checklist di Compliance',
      status: 'pending_review',
      date: new Date().toISOString()
    }
  ];
}

