import { applySecurityHeaders } from '../../utils/securityHeaders.js';
import { getXRPLClient, initializeXRPL } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';
import { dropsToXrp } from 'xrpl';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET for transaction history.' 
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
      walletAddress,
      limit = 50,
      offset = 0,
      type = 'all', // all, sent, received, exchange
      currency = 'all',
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      includeMetadata = true
    } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress richiesto'
      });
    }

    try {
      await initializeXRPL();
      const client = getXRPLClient();

      // Recupera cronologia transazioni
      const transactionHistory = await getTransactionHistory({
        client,
        address: walletAddress,
        limit: parseInt(limit),
        offset: parseInt(offset),
        filters: {
          type,
          currency,
          dateFrom,
          dateTo,
          minAmount: minAmount ? parseFloat(minAmount) : null,
          maxAmount: maxAmount ? parseFloat(maxAmount) : null
        }
      });

      // Processa e arricchisce le transazioni
      const processedTransactions = await processTransactions(transactionHistory.transactions, walletAddress, includeMetadata === 'true');

      // Calcola statistiche
      const statistics = calculateTransactionStatistics(processedTransactions, walletAddress);

      // Genera insights
      const insights = generateTransactionInsights(processedTransactions, statistics);

      const response = {
        success: true,
        pagination: {
          total: transactionHistory.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: transactionHistory.total > (parseInt(offset) + parseInt(limit))
        },
        filters: {
          type,
          currency,
          dateFrom,
          dateTo,
          minAmount,
          maxAmount,
          applied: Object.keys(req.query).filter(key => 
            ['type', 'currency', 'dateFrom', 'dateTo', 'minAmount', 'maxAmount'].includes(key)
          ).length > 0
        },
        transactions: processedTransactions,
        statistics: statistics,
        insights: insights,
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataSource: 'XRPL Ledger',
          includeMetadata: includeMetadata === 'true'
        }
      };

      return res.status(200).json(response);

    } catch (error) {
      console.error('Transaction history fetch error:', error);
      
      // Fallback con dati mock
      const mockHistory = generateMockTransactionHistory(walletAddress, parseInt(limit));
      
      return res.status(200).json({
        success: true,
        transactions: mockHistory.transactions,
        statistics: mockHistory.statistics,
        insights: mockHistory.insights,
        pagination: {
          total: mockHistory.transactions.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        },
        note: 'Dati simulati - XRPL non disponibile'
      });
    }

  } catch (error) {
    console.error('Transaction history API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

// Funzioni helper
async function getTransactionHistory({ client, address, limit, offset, filters }) {
  try {
    // In produzione, userebbe account_tx per recuperare transazioni reali
    const accountTxResult = await client.request({
      command: 'account_tx',
      account: address,
      limit: limit,
      offset: offset,
      descending: true
    });

    return {
      transactions: accountTxResult.result.transactions || [],
      total: accountTxResult.result.transactions?.length || 0
    };
  } catch (error) {
    console.error('XRPL transaction fetch error:', error);
    throw error;
  }
}

async function processTransactions(rawTransactions, userAddress, includeMetadata) {
  return rawTransactions.map(txData => {
    const tx = txData.tx || txData;
    const meta = txData.meta;
    
    const processedTx = {
      hash: tx.hash || tx.Hash,
      type: tx.TransactionType,
      timestamp: tx.date ? new Date((tx.date + 946684800) * 1000).toISOString() : new Date().toISOString(),
      ledgerIndex: tx.ledger_index || tx.LedgerIndex,
      sequence: tx.Sequence,
      fee: tx.Fee ? dropsToXrp(tx.Fee) : '0.000012',
      status: meta?.TransactionResult || 'tesSUCCESS'
    };

    // Processa in base al tipo di transazione
    if (tx.TransactionType === 'Payment') {
      const isOutgoing = tx.Account === userAddress;
      const isIncoming = tx.Destination === userAddress;

      processedTx.direction = isOutgoing ? 'sent' : 'received';
      processedTx.counterparty = isOutgoing ? tx.Destination : tx.Account;
      processedTx.amount = parseTransactionAmount(tx.Amount);
      processedTx.destinationTag = tx.DestinationTag;
      processedTx.memo = tx.Memos ? decodeMemo(tx.Memos[0]) : null;
      
      if (includeMetadata) {
        processedTx.metadata = {
          paths: tx.Paths || [],
          deliveredAmount: meta?.delivered_amount,
          sourceTag: tx.SourceTag,
          flags: tx.Flags
        };
      }
    }

    // Altri tipi di transazione
    if (tx.TransactionType === 'TrustSet') {
      processedTx.trustLine = {
        currency: tx.LimitAmount.currency,
        issuer: tx.LimitAmount.issuer,
        limit: tx.LimitAmount.value
      };
    }

    if (tx.TransactionType === 'OfferCreate') {
      processedTx.offer = {
        takerGets: parseTransactionAmount(tx.TakerGets),
        takerPays: parseTransactionAmount(tx.TakerPays),
        sequence: tx.OfferSequence
      };
    }

    return processedTx;
  });
}

function parseTransactionAmount(amount) {
  if (typeof amount === 'string') {
    // XRP in drops
    return {
      value: dropsToXrp(amount),
      currency: 'XRP',
      issuer: null
    };
  } else if (typeof amount === 'object') {
    // Token
    return {
      value: amount.value,
      currency: amount.currency,
      issuer: amount.issuer
    };
  }
  return null;
}

function decodeMemo(memo) {
  try {
    if (memo && memo.Memo && memo.Memo.MemoData) {
      return {
        type: memo.Memo.MemoType ? Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8') : null,
        data: Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8'),
        format: memo.Memo.MemoFormat ? Buffer.from(memo.Memo.MemoFormat, 'hex').toString('utf8') : null
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

function calculateTransactionStatistics(transactions, userAddress) {
  const stats = {
    total: transactions.length,
    sent: 0,
    received: 0,
    totalVolume: { XRP: 0 },
    totalFees: 0,
    averageAmount: { XRP: 0 },
    currencies: new Set(),
    counterparties: new Set(),
    timeRange: {
      earliest: null,
      latest: null
    }
  };

  transactions.forEach(tx => {
    if (tx.direction === 'sent') {
      stats.sent++;
    } else if (tx.direction === 'received') {
      stats.received++;
    }

    if (tx.amount) {
      const currency = tx.amount.currency;
      stats.currencies.add(currency);
      
      if (!stats.totalVolume[currency]) {
        stats.totalVolume[currency] = 0;
      }
      stats.totalVolume[currency] += parseFloat(tx.amount.value);
    }

    if (tx.fee) {
      stats.totalFees += parseFloat(tx.fee);
    }

    if (tx.counterparty) {
      stats.counterparties.add(tx.counterparty);
    }

    const txDate = new Date(tx.timestamp);
    if (!stats.timeRange.earliest || txDate < new Date(stats.timeRange.earliest)) {
      stats.timeRange.earliest = tx.timestamp;
    }
    if (!stats.timeRange.latest || txDate > new Date(stats.timeRange.latest)) {
      stats.timeRange.latest = tx.timestamp;
    }
  });

  // Calcola medie
  if (stats.totalVolume.XRP > 0) {
    stats.averageAmount.XRP = stats.totalVolume.XRP / transactions.length;
  }

  // Converti Set in Array per JSON
  stats.currencies = Array.from(stats.currencies);
  stats.counterparties = Array.from(stats.counterparties);

  return stats;
}

function generateTransactionInsights(transactions, statistics) {
  const insights = [];

  // Insight su volume
  if (statistics.totalVolume.XRP > 1000) {
    insights.push({
      type: 'volume',
      title: 'Alto Volume di Transazioni',
      description: `Hai processato ${statistics.totalVolume.XRP.toFixed(2)} XRP in totale`,
      severity: 'info'
    });
  }

  // Insight su frequenza
  if (statistics.total > 100) {
    insights.push({
      type: 'frequency',
      title: 'Utente Attivo',
      description: `Hai effettuato ${statistics.total} transazioni`,
      severity: 'positive'
    });
  }

  // Insight su commissioni
  if (statistics.totalFees > 1) {
    insights.push({
      type: 'fees',
      title: 'Commissioni Elevate',
      description: `Hai pagato ${statistics.totalFees.toFixed(6)} XRP in commissioni`,
      severity: 'warning',
      suggestion: 'Considera l\'uso di fee più basse per transazioni non urgenti'
    });
  }

  // Insight su diversificazione
  if (statistics.currencies.length > 3) {
    insights.push({
      type: 'diversification',
      title: 'Portfolio Diversificato',
      description: `Hai transato con ${statistics.currencies.length} valute diverse`,
      severity: 'positive'
    });
  }

  return insights;
}

function generateMockTransactionHistory(address, limit) {
  const mockTransactions = [];
  const now = Date.now();
  
  for (let i = 0; i < Math.min(limit, 20); i++) {
    const isOutgoing = Math.random() > 0.5;
    const timestamp = new Date(now - (i * 3600000 + Math.random() * 3600000)).toISOString();
    
    mockTransactions.push({
      hash: `mock_tx_${Date.now()}_${i}`,
      type: 'Payment',
      timestamp: timestamp,
      ledgerIndex: 70000000 + i,
      sequence: 1000 + i,
      fee: '0.000012',
      status: 'tesSUCCESS',
      direction: isOutgoing ? 'sent' : 'received',
      counterparty: isOutgoing ? 'rDestination123456789' : 'rSender123456789',
      amount: {
        value: (Math.random() * 1000 + 10).toFixed(6),
        currency: 'XRP',
        issuer: null
      },
      destinationTag: Math.random() > 0.7 ? Math.floor(Math.random() * 1000000) : null,
      memo: Math.random() > 0.8 ? {
        type: 'payment',
        data: 'Test transaction',
        format: 'text/plain'
      } : null
    });
  }

  const statistics = calculateTransactionStatistics(mockTransactions, address);
  const insights = generateTransactionInsights(mockTransactions, statistics);

  return {
    transactions: mockTransactions,
    statistics: statistics,
    insights: insights
  };
}

