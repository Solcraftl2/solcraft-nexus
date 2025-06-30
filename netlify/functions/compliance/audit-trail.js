
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

import { Client } from 'xrpl'

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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const client = new Client('wss://s1.ripple.com')
  
  try {
    await client.connect()
    
    const { 
      account, 
      report_type = 'full',
      start_date,
      end_date,
      transaction_types,
      include_metadata = true
    } = req.query
    
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Account address is required'
      })
    }
    
    // Get account information for compliance flags
    const accountInfo = await client.request({
      command: 'account_info',
      account: account,
      ledger_index: 'validated'
    })
    
    const flags = accountInfo.result.account_data.Flags || 0
    const complianceFlags = {
      deposit_auth: !!(flags & 0x01000000),
      require_authorization: !!(flags & 0x00040000),
      require_destination_tag: !!(flags & 0x00020000),
      disallow_incoming_xrp: !!(flags & 0x00080000),
      disallow_incoming_trustline: !!(flags & 0x20000000),
      global_freeze: !!(flags & 0x00400000),
      no_freeze: !!(flags & 0x00200000)
    }
    
    // Get transaction history
    let txLimit = 1000
    if (report_type === 'summary') txLimit = 100
    if (report_type === 'recent') txLimit = 50
    
    const accountTx = await client.request({
      command: 'account_tx',
      account: account,
      limit: txLimit,
      ledger_index_min: -1,
      ledger_index_max: -1
    })
    
    let transactions = accountTx.result.transactions || []
    
    // Filter by date range if provided
    if (start_date || end_date) {
      const startTime = start_date ? new Date(start_date).getTime() : 0
      const endTime = end_date ? new Date(end_date).getTime() : Date.now()
      
      transactions = transactions.filter(tx => {
        const txTime = (tx.tx.date + 946684800) * 1000 // Convert Ripple time to Unix time
        return txTime >= startTime && txTime <= endTime
      })
    }
    
    // Filter by transaction types if provided
    if (transaction_types) {
      const types = transaction_types.split(',')
      transactions = transactions.filter(tx => types.includes(tx.tx.TransactionType))
    }
    
    // Analyze transactions for compliance
    const complianceAnalysis = {
      total_transactions: transactions.length,
      transaction_breakdown: {},
      compliance_events: [],
      risk_indicators: [],
      aml_flags: [],
      kyc_requirements: []
    }
    
    // Track suspicious patterns
    const suspiciousPatterns = {
      high_frequency_trading: 0,
      large_transactions: [],
      cross_border_transfers: [],
      unusual_counterparties: new Set(),
      rapid_succession_trades: []
    }
    
    // Process each transaction
    transactions.forEach((tx, index) => {
      const txType = tx.tx.TransactionType
      const txTime = (tx.tx.date + 946684800) * 1000
      
      // Count transaction types
      complianceAnalysis.transaction_breakdown[txType] = 
        (complianceAnalysis.transaction_breakdown[txType] || 0) + 1
      
      // Check for compliance events
      if (txType === 'Payment') {
        const amount = tx.tx.Amount
        let amountValue = 0
        let currency = 'XRP'
        
        if (typeof amount === 'string') {
          amountValue = parseInt(amount) / 1000000
        } else {
          amountValue = parseFloat(amount.value)
          currency = amount.currency
        }
        
        // Flag large transactions (>$10,000 equivalent)
        if (amountValue > 20000 || (currency !== 'XRP' && amountValue > 10000)) {
          suspiciousPatterns.large_transactions.push({
            hash: tx.tx.hash,
            amount: amountValue,
            currency: currency,
            date: new Date(txTime).toISOString(),
            counterparty: tx.tx.Account === account ? tx.tx.Destination : tx.tx.Account
          })
        }
        
        // Track counterparties
        const counterparty = tx.tx.Account === account ? tx.tx.Destination : tx.tx.Account
        suspiciousPatterns.unusual_counterparties.add(counterparty)
        
        // Check for missing destination tags on regulated tokens
        if (!tx.tx.DestinationTag && typeof amount === 'object') {
          complianceAnalysis.compliance_events.push({
            type: 'missing_destination_tag',
            transaction: tx.tx.hash,
            date: new Date(txTime).toISOString(),
            severity: 'medium'
          })
        }
      }
      
      // Check for MPT compliance
      if (txType === 'MPTokenIssuanceCreate') {
        const metadata = tx.tx.MPTokenMetadata
        if (metadata && include_metadata === 'true') {
          try {
            const metadataObj = JSON.parse(Buffer.from(metadata, 'hex').toString())
            
            // Check for required compliance fields
            const requiredFields = ['Jurisdiction', 'RegulatoryCompliance', 'Issuer']
            const missingFields = requiredFields.filter(field => !metadataObj[field])
            
            if (missingFields.length > 0) {
              complianceAnalysis.compliance_events.push({
                type: 'incomplete_mpt_metadata',
                transaction: tx.tx.hash,
                missing_fields: missingFields,
                date: new Date(txTime).toISOString(),
                severity: 'high'
              })
            }
          } catch (e) {
            complianceAnalysis.compliance_events.push({
              type: 'invalid_mpt_metadata',
              transaction: tx.tx.hash,
              date: new Date(txTime).toISOString(),
              severity: 'high'
            })
          }
        }
      }
      
      // Check for rapid succession trades (potential wash trading)
      if (index > 0) {
        const prevTx = transactions[index - 1]
        const timeDiff = txTime - ((prevTx.tx.date + 946684800) * 1000)
        
        if (timeDiff < 60000 && txType === 'OfferCreate') { // Less than 1 minute
          suspiciousPatterns.rapid_succession_trades.push({
            hash1: prevTx.tx.hash,
            hash2: tx.tx.hash,
            time_difference_ms: timeDiff,
            date: new Date(txTime).toISOString()
          })
        }
      }
    })
    
    // Generate risk score
    let riskScore = 0
    
    // High frequency trading risk
    if (transactions.length > 100) riskScore += 10
    if (transactions.length > 500) riskScore += 20
    
    // Large transaction risk
    riskScore += suspiciousPatterns.large_transactions.length * 5
    
    // Counterparty diversity risk
    if (suspiciousPatterns.unusual_counterparties.size < 3 && transactions.length > 50) {
      riskScore += 15 // Low counterparty diversity
    }
    
    // Rapid trading risk
    riskScore += suspiciousPatterns.rapid_succession_trades.length * 3
    
    // Compliance violations
    riskScore += complianceAnalysis.compliance_events.length * 10
    
    // Generate recommendations
    const recommendations = []
    
    if (!complianceFlags.deposit_auth && suspiciousPatterns.large_transactions.length > 0) {
      recommendations.push({
        type: 'enable_deposit_auth',
        priority: 'high',
        description: 'Enable Deposit Authorization to control incoming payments'
      })
    }
    
    if (!complianceFlags.require_destination_tag && transactions.some(tx => tx.tx.TransactionType === 'Payment')) {
      recommendations.push({
        type: 'require_destination_tags',
        priority: 'medium',
        description: 'Require destination tags for better transaction tracking'
      })
    }
    
    if (suspiciousPatterns.rapid_succession_trades.length > 5) {
      recommendations.push({
        type: 'implement_trading_limits',
        priority: 'high',
        description: 'Implement trading frequency limits to prevent wash trading'
      })
    }
    
    res.status(200).json({
      success: true,
      data: {
        account: account,
        compliance_status: {
          flags: complianceFlags,
          risk_score: Math.min(riskScore, 100),
          risk_level: riskScore < 20 ? 'low' : riskScore < 50 ? 'medium' : 'high'
        },
        analysis: complianceAnalysis,
        suspicious_patterns: {
          ...suspiciousPatterns,
          unusual_counterparties: Array.from(suspiciousPatterns.unusual_counterparties)
        },
        recommendations: recommendations,
        report_metadata: {
          report_type: report_type,
          transactions_analyzed: transactions.length,
          date_range: {
            start: start_date || 'all_time',
            end: end_date || 'current'
          },
          generated_at: new Date().toISOString(),
          ledger_index: accountInfo.result.ledger_index,
          validated: accountInfo.result.validated
        }
      }
    })
    
  } catch (error) {
    console.error('Compliance analysis error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate compliance report'
    })
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}

