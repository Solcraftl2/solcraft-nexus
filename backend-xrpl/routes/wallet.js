const express = require('express');
const router = express.Router();
const XRPLService = require('../services/XRPLService');
const DatabaseService = require('../services/DatabaseService');

/**
 * GET /api/wallet/:address/info
 * Ottieni informazioni complete wallet
 */
router.get('/:address/info', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    // Ottieni info da XRPL
    const accountInfo = await XRPLService.getAccountInfo(address);
    
    // Ottieni statistiche dal database
    const stats = await DatabaseService.getWalletStats(address);
    
    // Ottieni token e trust lines
    const [tokens, trustLines] = await Promise.all([
      DatabaseService.getTokens(address),
      DatabaseService.getTrustLines(address)
    ]);
    
    const walletInfo = {
      ...accountInfo,
      stats,
      tokens,
      trustLines
    };
    
    res.json({
      success: true,
      data: walletInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore info wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/wallet/:address/balance
 * Ottieni bilancio dettagliato
 */
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const balance = await XRPLService.getBalance(address);
    
    // TODO: Implementare bilanci token personalizzati
    const tokenBalances = [];
    
    res.json({
      success: true,
      data: {
        address,
        xrp: {
          balance,
          formatted: XRPLService.formatXRP(balance)
        },
        tokens: tokenBalances,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore bilancio wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/wallet/:address/transactions
 * Ottieni transazioni wallet
 */
router.get('/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    // Ottieni da database (più veloce)
    const dbTransactions = await DatabaseService.getTransactions(address, parseInt(limit));
    
    // Se non ci sono abbastanza transazioni nel DB, ottieni da XRPL
    let xrplTransactions = [];
    if (dbTransactions.length < parseInt(limit)) {
      try {
        xrplTransactions = await XRPLService.getTransactionHistory(address, parseInt(limit));
      } catch (error) {
        console.warn('Errore recupero transazioni XRPL:', error.message);
      }
    }
    
    // Combina e deduplica
    const allTransactions = [...dbTransactions];
    const existingHashes = new Set(dbTransactions.map(tx => tx.hash));
    
    for (const tx of xrplTransactions) {
      const hash = tx.transaction?.hash || tx.hash;
      if (hash && !existingHashes.has(hash)) {
        allTransactions.push(tx);
      }
    }
    
    // Ordina per timestamp
    allTransactions.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.transaction?.date || 0);
      const timeB = new Date(b.timestamp || b.transaction?.date || 0);
      return timeB - timeA;
    });
    
    // Applica limit e offset
    const paginatedTransactions = allTransactions
      .slice(parseInt(offset))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        address,
        transactions: paginatedTransactions,
        count: paginatedTransactions.length,
        total: allTransactions.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore transazioni wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/wallet/:address/subscribe
 * Sottoscrivi aggiornamenti wallet
 */
router.post('/:address/subscribe', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await XRPLService.subscribeToAccount(address);
    
    res.json({
      success: true,
      data: result,
      message: 'Sottoscrizione attivata per aggiornamenti real-time',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore sottoscrizione wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/wallet/:address/subscribe
 * Rimuovi sottoscrizione wallet
 */
router.delete('/:address/subscribe', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await XRPLService.unsubscribeFromAccount(address);
    
    res.json({
      success: true,
      data: result,
      message: 'Sottoscrizione rimossa',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore rimozione sottoscrizione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/wallet/:address/stats
 * Ottieni statistiche wallet
 */
router.get('/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    const stats = await DatabaseService.getWalletStats(address);
    
    // Aggiungi bilancio corrente
    const balance = await XRPLService.getBalance(address);
    
    const walletStats = {
      ...stats,
      currentBalance: balance,
      formattedBalance: XRPLService.formatXRP(balance)
    };
    
    res.json({
      success: true,
      data: walletStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore statistiche wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

