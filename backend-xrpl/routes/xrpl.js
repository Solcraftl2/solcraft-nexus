const express = require('express');
const router = express.Router();
const XRPLService = require('../services/XRPLService');
const DatabaseService = require('../services/DatabaseService');
const RedisService = require('../services/RedisService');

/**
 * GET /api/xrpl/status
 * Ottieni stato connessione XRPL
 */
router.get('/status', async (req, res) => {
  try {
    const networkInfo = XRPLService.getNetworkInfo();
    
    res.json({
      success: true,
      data: networkInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore status XRPL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/xrpl/connect
 * Connetti a network XRPL
 */
router.post('/connect', async (req, res) => {
  try {
    const { network = 'testnet' } = req.body;
    
    const result = await XRPLService.connect(network);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore connessione XRPL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/xrpl/wallet/generate
 * Genera nuovo wallet
 */
router.post('/wallet/generate', async (req, res) => {
  try {
    const wallet = XRPLService.generateWallet();
    
    // Non salvare il seed nel database per sicurezza
    const safeWallet = {
      address: wallet.address,
      publicKey: wallet.publicKey
    };
    
    res.json({
      success: true,
      data: {
        ...wallet, // Include seed solo nella risposta
        message: 'Wallet generato con successo. Salva il seed in modo sicuro!'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore generazione wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/xrpl/wallet/import
 * Importa wallet da seed
 */
router.post('/wallet/import', async (req, res) => {
  try {
    const { seed } = req.body;
    
    if (!seed) {
      return res.status(400).json({
        success: false,
        error: 'Seed è richiesto',
        timestamp: new Date().toISOString()
      });
    }
    
    const wallet = XRPLService.importWallet(seed);
    
    res.json({
      success: true,
      data: wallet,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore import wallet:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/xrpl/wallet/fund
 * Finanzia wallet su testnet
 */
router.post('/wallet/fund', async (req, res) => {
  try {
    const { wallet } = req.body;
    
    const result = await XRPLService.fundTestnetAccount(wallet);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore funding wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/xrpl/account/:address
 * Ottieni informazioni account
 */
router.get('/account/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const accountInfo = await XRPLService.getAccountInfo(address);
    
    res.json({
      success: true,
      data: accountInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore info account:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/xrpl/balance/:address
 * Ottieni bilancio account
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const balance = await XRPLService.getBalance(address);
    
    res.json({
      success: true,
      data: { 
        address,
        balance,
        formatted: XRPLService.formatXRP(balance)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore bilancio:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/xrpl/payment
 * Invia pagamento XRP
 */
router.post('/payment', async (req, res) => {
  try {
    const { fromSeed, toAddress, amount, memo } = req.body;
    
    if (!fromSeed || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'fromSeed, toAddress e amount sono richiesti',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!XRPLService.isValidAddress(toAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo destinazione non valido',
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
    
    const result = await XRPLService.sendXRP(fromSeed, toAddress, amount, memo);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore pagamento:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/xrpl/trustline
 * Crea Trust Line
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
    
    const result = await XRPLService.createTrustLine(walletSeed, tokenCode, issuerAddress, limit);
    
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
 * POST /api/xrpl/token/issue
 * Emetti token
 */
router.post('/token/issue', async (req, res) => {
  try {
    const { issuerSeed, holderAddress, tokenCode, amount } = req.body;
    
    if (!issuerSeed || !holderAddress || !tokenCode || !amount) {
      return res.status(400).json({
        success: false,
        error: 'issuerSeed, holderAddress, tokenCode e amount sono richiesti',
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
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Importo deve essere maggiore di 0',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await XRPLService.issueToken(issuerSeed, holderAddress, tokenCode, amount);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore emissione token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/xrpl/transactions/:address
 * Ottieni storico transazioni
 */
router.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 20 } = req.query;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const transactions = await XRPLService.getTransactionHistory(address, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        address,
        transactions,
        count: transactions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore transazioni:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/xrpl/subscribe/:address
 * Sottoscrivi aggiornamenti account
 */
router.post('/subscribe/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await XRPLService.subscribeToAccount(address);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore sottoscrizione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/xrpl/subscribe/:address
 * Disiscrivi aggiornamenti account
 */
router.delete('/subscribe/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await XRPLService.unsubscribeFromAccount(address);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore disiscrizione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/xrpl/validate/:address
 * Valida indirizzo XRPL
 */
router.get('/validate/:address', (req, res) => {
  try {
    const { address } = req.params;
    const isValid = XRPLService.isValidAddress(address);
    
    res.json({
      success: true,
      data: {
        address,
        isValid
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore validazione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

