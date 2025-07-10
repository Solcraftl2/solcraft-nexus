const express = require('express');
const router = express.Router();
const XRPLService = require('../services/XRPLService');
const DatabaseService = require('../services/DatabaseService');

/**
 * GET /api/transactions/:hash
 * Ottieni dettagli transazione specifica
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!hash || hash.length !== 64) {
      return res.status(400).json({
        success: false,
        error: 'Hash transazione non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    // Cerca prima nel database
    let transaction = await DatabaseService.getTransaction(hash);
    
    // Se non trovata nel DB, cerca su XRPL
    if (!transaction && XRPLService.isConnected()) {
      try {
        const response = await XRPLService.client.request({
          command: 'tx',
          transaction: hash
        });
        
        if (response.result) {
          transaction = response.result;
          // Salva nel database per future query
          await DatabaseService.saveTransaction({
            hash: transaction.hash,
            type: transaction.TransactionType,
            account: transaction.Account,
            destination: transaction.Destination,
            amount: transaction.Amount,
            fee: transaction.Fee,
            sequence: transaction.Sequence,
            ledger_index: transaction.ledger_index,
            meta: transaction.meta,
            network: XRPLService.network,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn('Errore recupero transazione da XRPL:', error.message);
      }
    }
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transazione non trovata',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore recupero transazione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/transactions/account/:address
 * Ottieni transazioni di un account
 */
router.get('/account/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { 
      limit = 20, 
      offset = 0, 
      type,
      from_date,
      to_date 
    } = req.query;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    let transactions = await DatabaseService.getTransactions(address, parseInt(limit) + parseInt(offset));
    
    // Applica filtri
    if (type) {
      transactions = transactions.filter(tx => tx.type === type);
    }
    
    if (from_date) {
      const fromDate = new Date(from_date);
      transactions = transactions.filter(tx => new Date(tx.timestamp) >= fromDate);
    }
    
    if (to_date) {
      const toDate = new Date(to_date);
      transactions = transactions.filter(tx => new Date(tx.timestamp) <= toDate);
    }
    
    // Applica paginazione
    const paginatedTransactions = transactions
      .slice(parseInt(offset))
      .slice(0, parseInt(limit));
    
    // Calcola statistiche
    const stats = {
      total: transactions.length,
      sent: transactions.filter(tx => tx.account === address).length,
      received: transactions.filter(tx => tx.destination === address).length,
      totalVolume: transactions.reduce((sum, tx) => {
        if (typeof tx.amount === 'string') {
          return sum + parseFloat(XRPLService.dropsToXrp(tx.amount));
        }
        return sum;
      }, 0)
    };
    
    res.json({
      success: true,
      data: {
        address,
        transactions: paginatedTransactions,
        stats,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: transactions.length
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore transazioni account:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/transactions/send
 * Invia nuova transazione
 */
router.post('/send', async (req, res) => {
  try {
    const { 
      fromSeed, 
      toAddress, 
      amount, 
      memo,
      tokenCode,
      issuerAddress 
    } = req.body;
    
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
    
    let result;
    
    // Determina se è XRP o token personalizzato
    if (tokenCode && issuerAddress) {
      // Invio token personalizzato
      if (!XRPLService.isValidAddress(issuerAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Indirizzo issuer non valido',
          timestamp: new Date().toISOString()
        });
      }
      
      result = await XRPLService.sendToken(
        fromSeed,
        toAddress,
        tokenCode,
        issuerAddress,
        amount,
        memo
      );
    } else {
      // Invio XRP
      result = await XRPLService.sendXRP(fromSeed, toAddress, amount, memo);
    }
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore invio transazione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/transactions/pending/:address
 * Ottieni transazioni pending per un address
 */
router.get('/pending/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    // TODO: Implementare tracking transazioni pending
    // Per ora restituiamo array vuoto
    const pendingTransactions = [];
    
    res.json({
      success: true,
      data: {
        address,
        pending: pendingTransactions,
        count: pendingTransactions.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore transazioni pending:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/transactions/stats/network
 * Ottieni statistiche network
 */
router.get('/stats/network', async (req, res) => {
  try {
    const stats = await DatabaseService.getNetworkStats();
    
    // Aggiungi info ledger corrente se connesso
    let currentLedger = null;
    if (XRPLService.isConnected()) {
      try {
        const response = await XRPLService.client.request({
          command: 'ledger',
          ledger_index: 'validated'
        });
        currentLedger = {
          index: response.result.ledger.ledger_index,
          hash: response.result.ledger.ledger_hash,
          closeTime: response.result.ledger.close_time,
          txnCount: response.result.ledger.transactions?.length || 0
        };
      } catch (error) {
        console.warn('Errore recupero ledger corrente:', error.message);
      }
    }
    
    res.json({
      success: true,
      data: {
        ...stats,
        currentLedger,
        network: XRPLService.network,
        isConnected: XRPLService.isConnected()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore statistiche network:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/transactions/estimate-fee
 * Stima fee per transazione
 */
router.post('/estimate-fee', async (req, res) => {
  try {
    const { transactionType = 'Payment', account } = req.body;
    
    if (!account || !XRPLService.isValidAddress(account)) {
      return res.status(400).json({
        success: false,
        error: 'Account valido è richiesto',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!XRPLService.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Non connesso a XRPL',
        timestamp: new Date().toISOString()
      });
    }
    
    // Crea transazione di esempio per stima fee
    const mockTransaction = {
      TransactionType: transactionType,
      Account: account
    };
    
    if (transactionType === 'Payment') {
      mockTransaction.Destination = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'; // Address di esempio
      mockTransaction.Amount = '1000000'; // 1 XRP in drops
    }
    
    try {
      const prepared = await XRPLService.client.autofill(mockTransaction);
      const estimatedFee = XRPLService.dropsToXrp(prepared.Fee);
      
      res.json({
        success: true,
        data: {
          transactionType,
          estimatedFee,
          feeInDrops: prepared.Fee,
          formatted: XRPLService.formatXRP(estimatedFee)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Fallback a fee standard
      const standardFee = '0.000012'; // 12 drops
      res.json({
        success: true,
        data: {
          transactionType,
          estimatedFee: standardFee,
          feeInDrops: '12',
          formatted: XRPLService.formatXRP(standardFee),
          note: 'Fee stimata (standard)'
        },
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Errore stima fee:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

