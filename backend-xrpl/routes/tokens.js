const express = require('express');
const router = express.Router();
const XRPLService = require('../services/XRPLService');
const DatabaseService = require('../services/DatabaseService');

/**
 * POST /api/tokens/create
 * Crea nuovo token personalizzato
 */
router.post('/create', async (req, res) => {
  try {
    const { 
      issuerSeed, 
      tokenCode, 
      initialSupply, 
      holderAddress,
      metadata 
    } = req.body;
    
    if (!issuerSeed || !tokenCode || !initialSupply || !holderAddress) {
      return res.status(400).json({
        success: false,
        error: 'issuerSeed, tokenCode, initialSupply e holderAddress sono richiesti',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!XRPLService.isValidAddress(holderAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo holder non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    if (tokenCode.length < 3 || tokenCode.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Token code deve essere tra 3 e 20 caratteri',
        timestamp: new Date().toISOString()
      });
    }
    
    if (initialSupply <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Supply iniziale deve essere maggiore di 0',
        timestamp: new Date().toISOString()
      });
    }
    
    // Step 1: Crea Trust Line
    const trustLineResult = await XRPLService.createTrustLine(
      holderAddress, // Nota: serve il seed del holder, non l'address
      tokenCode,
      XRPLService.importWallet(issuerSeed).address,
      initialSupply.toString()
    );
    
    if (!trustLineResult.success) {
      throw new Error('Errore creazione Trust Line');
    }
    
    // Step 2: Emetti token
    const tokenResult = await XRPLService.issueToken(
      issuerSeed,
      holderAddress,
      tokenCode,
      initialSupply
    );
    
    if (!tokenResult.success) {
      throw new Error('Errore emissione token');
    }
    
    // Step 3: Salva metadata nel database
    const tokenData = {
      ...tokenResult,
      metadata: metadata || {},
      trustLineHash: trustLineResult.hash
    };
    
    await DatabaseService.saveToken(tokenData);
    
    res.status(201).json({
      success: true,
      data: {
        token: tokenResult,
        trustLine: trustLineResult,
        metadata
      },
      message: 'Token creato con successo',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore creazione token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/tokens/:address
 * Ottieni token di un address
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { type = 'all' } = req.query; // 'issued', 'held', 'all'
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const tokens = await DatabaseService.getTokens(address);
    
    // Filtra per tipo se specificato
    let filteredTokens = tokens;
    if (type === 'issued') {
      filteredTokens = tokens.filter(token => token.issuer === address);
    } else if (type === 'held') {
      filteredTokens = tokens.filter(token => token.holder === address);
    }
    
    res.json({
      success: true,
      data: {
        address,
        tokens: filteredTokens,
        count: filteredTokens.length,
        type
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore recupero token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/tokens/info/:tokenCode/:issuer
 * Ottieni informazioni specifiche token
 */
router.get('/info/:tokenCode/:issuer', async (req, res) => {
  try {
    const { tokenCode, issuer } = req.params;
    
    if (!XRPLService.isValidAddress(issuer)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo issuer non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const token = await DatabaseService.getToken(tokenCode, issuer);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token non trovato',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: token,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore info token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/tokens/transfer
 * Trasferisci token personalizzato
 */
router.post('/transfer', async (req, res) => {
  try {
    const { 
      fromSeed, 
      toAddress, 
      tokenCode, 
      issuerAddress, 
      amount, 
      memo 
    } = req.body;
    
    if (!fromSeed || !toAddress || !tokenCode || !issuerAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'fromSeed, toAddress, tokenCode, issuerAddress e amount sono richiesti',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!XRPLService.isValidAddress(toAddress) || !XRPLService.isValidAddress(issuerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzi non validi',
        timestamp: new Date().toISOString()
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Importo deve essere maggiore di 0',
        timestamp: new Date().toISOString()
      });
    }
    
    // Usa il servizio XRPL per inviare token personalizzato
    // Nota: Questo richiede una modifica al servizio XRPL per supportare token personalizzati
    const result = await XRPLService.sendToken(
      fromSeed,
      toAddress,
      tokenCode,
      issuerAddress,
      amount,
      memo
    );
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore trasferimento token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/tokens/marketplace
 * Ottieni token disponibili nel marketplace
 */
router.get('/marketplace', async (req, res) => {
  try {
    const { limit = 20, offset = 0, category } = req.query;
    
    // Per ora restituiamo tutti i token dal database
    // In futuro si può implementare filtri per categoria, prezzo, etc.
    const { data: tokens, error } = await DatabaseService.supabase
      .from('tokens')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (error) throw error;
    
    // Aggiungi informazioni aggiuntive per il marketplace
    const marketplaceTokens = tokens.map(token => ({
      ...token,
      marketPrice: null, // TODO: Implementare pricing
      volume24h: null,   // TODO: Implementare volume
      holders: null      // TODO: Implementare conteggio holders
    }));
    
    res.json({
      success: true,
      data: {
        tokens: marketplaceTokens,
        count: marketplaceTokens.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore marketplace token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/tokens/trustline
 * Crea Trust Line per token esistente
 */
router.post('/trustline', async (req, res) => {
  try {
    const { walletSeed, tokenCode, issuerAddress, limit } = req.body;
    
    if (!walletSeed || !tokenCode || !issuerAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletSeed, tokenCode e issuerAddress sono richiesti',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!XRPLService.isValidAddress(issuerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo issuer non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await XRPLService.createTrustLine(
      walletSeed,
      tokenCode,
      issuerAddress,
      limit || '1000000'
    );
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore trust line:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/tokens/trustlines/:address
 * Ottieni Trust Lines di un address
 */
router.get('/trustlines/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const trustLines = await DatabaseService.getTrustLines(address);
    
    res.json({
      success: true,
      data: {
        address,
        trustLines,
        count: trustLines.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore trust lines:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

