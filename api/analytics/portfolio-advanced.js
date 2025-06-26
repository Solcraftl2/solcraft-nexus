import { Client } from 'xrpl'

export default async function handler(req, res) {
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
    
    const { account, period = '30d', include_history = false } = req.query
    
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Account address is required'
      })
    }
    
    // Get current account state
    const [accountInfo, accountObjects, accountLines, accountTx] = await Promise.all([
      client.request({
        command: 'account_info',
        account: account,
        ledger_index: 'validated'
      }),
      client.request({
        command: 'account_objects',
        account: account,
        ledger_index: 'validated'
      }),
      client.request({
        command: 'account_lines',
        account: account,
        ledger_index: 'validated'
      }),
      client.request({
        command: 'account_tx',
        account: account,
        limit: include_history === 'true' ? 200 : 50,
        ledger_index_min: -1,
        ledger_index_max: -1
      })
    ])
    
    // Calculate current portfolio value
    const xrpBalance = parseInt(accountInfo.result.account_data.Balance) / 1000000
    const reserve = (accountInfo.result.account_data.OwnerCount * 2 + 10) // 2 XRP per object + 10 XRP base
    const availableXrp = Math.max(0, xrpBalance - reserve)
    
    // Process tokens
    const tokens = accountLines.result.lines.map(line => ({
      currency: line.currency,
      issuer: line.account,
      balance: parseFloat(line.balance),
      limit: parseFloat(line.limit),
      quality_in: line.quality_in,
      quality_out: line.quality_out,
      no_ripple: line.no_ripple,
      freeze: line.freeze,
      // Estimated value (would need market data API)
      estimated_value_xrp: 0,
      estimated_value_usd: 0
    }))
    
    // Process MPTs
    const mpts = accountObjects.result.account_objects
      .filter(obj => obj.LedgerEntryType === 'MPToken')
      .map(obj => {
        let metadata = null
        try {
          if (obj.MPTokenMetadata) {
            metadata = JSON.parse(Buffer.from(obj.MPTokenMetadata, 'hex').toString())
          }
        } catch (e) {
          metadata = { raw: obj.MPTokenMetadata }
        }
        
        return {
          mpt_id: obj.MPTokenID,
          balance: parseInt(obj.MPTAmount || 0),
          metadata: metadata,
          flags: obj.Flags,
          // Estimated value based on metadata
          estimated_value_xrp: metadata?.FaceValue ? parseFloat(metadata.FaceValue) * 0.001 : 0,
          estimated_value_usd: metadata?.FaceValue ? parseFloat(metadata.FaceValue) : 0
        }
      })
    
    // Process NFTs
    const nfts = accountObjects.result.account_objects
      .filter(obj => obj.LedgerEntryType === 'NFTokenPage')
      .reduce((acc, page) => {
        if (page.NFTokens) {
          acc.push(...page.NFTokens.map(nft => ({
            nft_id: nft.NFTokenID,
            uri: nft.URI ? Buffer.from(nft.URI, 'hex').toString() : null,
            flags: nft.Flags,
            estimated_value_xrp: 0, // Would need NFT market data
            estimated_value_usd: 0
          })))
        }
        return acc
      }, [])
    
    // Calculate portfolio totals
    const totalXrpValue = xrpBalance + 
      tokens.reduce((sum, token) => sum + token.estimated_value_xrp, 0) +
      mpts.reduce((sum, mpt) => sum + mpt.estimated_value_xrp, 0) +
      nfts.reduce((sum, nft) => sum + nft.estimated_value_xrp, 0)
    
    const totalUsdValue = totalXrpValue * 0.5 + // Assuming XRP = $0.50
      tokens.reduce((sum, token) => sum + token.estimated_value_usd, 0) +
      mpts.reduce((sum, mpt) => sum + mpt.estimated_value_usd, 0) +
      nfts.reduce((sum, nft) => sum + nft.estimated_value_usd, 0)
    
    // Analyze transaction history
    const transactions = accountTx.result.transactions || []
    const recentTx = transactions.slice(0, 30) // Last 30 transactions
    
    // Calculate transaction statistics
    const txStats = {
      total_transactions: transactions.length,
      recent_transactions: recentTx.length,
      transaction_types: {},
      volume_analysis: {
        total_xrp_sent: 0,
        total_xrp_received: 0,
        total_token_transfers: 0,
        total_mpt_transfers: 0
      }
    }
    
    recentTx.forEach(tx => {
      const txType = tx.tx.TransactionType
      txStats.transaction_types[txType] = (txStats.transaction_types[txType] || 0) + 1
      
      if (txType === 'Payment') {
        const amount = tx.tx.Amount
        if (typeof amount === 'string') {
          const xrpAmount = parseInt(amount) / 1000000
          if (tx.tx.Account === account) {
            txStats.volume_analysis.total_xrp_sent += xrpAmount
          } else if (tx.tx.Destination === account) {
            txStats.volume_analysis.total_xrp_received += xrpAmount
          }
        } else {
          txStats.volume_analysis.total_token_transfers += 1
        }
      }
      
      if (txType === 'MPTokenIssuanceCreate' || txType === 'MPTokenMint') {
        txStats.volume_analysis.total_mpt_transfers += 1
      }
    })
    
    // Risk analysis
    const riskMetrics = {
      diversification_score: 0,
      concentration_risk: 0,
      liquidity_risk: 0,
      counterparty_risk: 0
    }
    
    // Calculate diversification
    const totalAssets = 1 + tokens.length + mpts.length + nfts.length // XRP + other assets
    riskMetrics.diversification_score = Math.min(totalAssets / 10, 1) // Max score at 10+ assets
    
    // Calculate concentration risk (% in largest holding)
    const holdings = [
      { type: 'XRP', value: xrpBalance * 0.5 },
      ...tokens.map(t => ({ type: 'Token', value: t.estimated_value_usd })),
      ...mpts.map(m => ({ type: 'MPT', value: m.estimated_value_usd })),
      ...nfts.map(n => ({ type: 'NFT', value: n.estimated_value_usd }))
    ]
    
    const largestHolding = Math.max(...holdings.map(h => h.value))
    riskMetrics.concentration_risk = totalUsdValue > 0 ? largestHolding / totalUsdValue : 0
    
    // Performance metrics (simplified)
    const performanceMetrics = {
      total_return: 0, // Would need historical data
      sharpe_ratio: 0, // Would need risk-free rate and volatility
      max_drawdown: 0, // Would need historical portfolio values
      win_rate: 0, // Would need profit/loss analysis
      average_holding_period: 0 // Would need detailed transaction analysis
    }
    
    res.status(200).json({
      success: true,
      data: {
        account: account,
        portfolio: {
          xrp: {
            balance: xrpBalance,
            available: availableXrp,
            reserved: reserve,
            value_usd: xrpBalance * 0.5
          },
          tokens: tokens,
          mpts: mpts,
          nfts: nfts,
          totals: {
            total_xrp_value: totalXrpValue,
            total_usd_value: totalUsdValue,
            asset_count: totalAssets
          }
        },
        analytics: {
          transaction_stats: txStats,
          risk_metrics: riskMetrics,
          performance_metrics: performanceMetrics
        },
        metadata: {
          ledger_index: accountInfo.result.ledger_index,
          validated: accountInfo.result.validated,
          analysis_period: period,
          last_updated: new Date().toISOString()
        }
      }
    })
    
  } catch (error) {
    console.error('Portfolio analytics error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze portfolio'
    })
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}

