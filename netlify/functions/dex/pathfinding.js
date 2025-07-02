const Sentry = require('./../utils/sentry.js');

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

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  const client = new Client('wss://s1.ripple.com')
  
  try {
    await client.connect()
    
    const {
      sourceAccount,
      destinationAccount,
      destinationAmount,
      sourceCurrencies,
      sendMax
    } = req.body
    
    if (!sourceAccount || !destinationAccount || !destinationAmount) {
      return res.status(400).json({
        success: false,
        error: 'Source account, destination account, and destination amount are required'
      })
    }
    
    // Find payment paths
    const pathfindRequest = {
      command: 'ripple_path_find',
      source_account: sourceAccount,
      destination_account: destinationAccount,
      destination_amount: destinationAmount
    }
    
    if (sourceCurrencies && sourceCurrencies.length > 0) {
      pathfindRequest.source_currencies = sourceCurrencies
    }
    
    if (sendMax) {
      pathfindRequest.send_max = sendMax
    }
    
    const pathfindResult = await client.request(pathfindRequest)
    
    if (!pathfindResult.result.alternatives || pathfindResult.result.alternatives.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No payment paths found'
      })
    }
    
    // Analyze paths and calculate best execution
    const alternatives = pathfindResult.result.alternatives.map((alt, index) => {
      const sourceAmount = alt.source_amount
      const paths = alt.paths_computed || []
      
      // Calculate exchange rate
      let exchangeRate = 0
      if (typeof sourceAmount === 'string' && typeof destinationAmount === 'string') {
        exchangeRate = parseInt(destinationAmount) / parseInt(sourceAmount)
      } else if (typeof sourceAmount === 'object' && typeof destinationAmount === 'object') {
        exchangeRate = parseFloat(destinationAmount.value) / parseFloat(sourceAmount.value)
      }
      
      // Calculate path complexity score
      const complexityScore = paths.reduce((score, path) => score + path.length, 0)
      
      // Calculate estimated slippage (simplified)
      const slippageEstimate = complexityScore * 0.001 // 0.1% per hop
      
      return {
        index: index,
        source_amount: sourceAmount,
        destination_amount: destinationAmount,
        paths: paths,
        exchange_rate: exchangeRate,
        complexity_score: complexityScore,
        estimated_slippage: slippageEstimate,
        quality: exchangeRate * (1 - slippageEstimate) // Quality score
      }
    })
    
    // Sort by quality (best execution first)
    alternatives.sort((a, b) => b.quality - a.quality)
    
    // Get market depth for primary path
    const bestPath = alternatives[0]
    let marketDepth = null
    
    if (bestPath.paths.length > 0) {
      try {
        // Get order book for first hop
        const firstHop = bestPath.paths[0][0]
        if (firstHop && firstHop.currency) {
          const orderBook = await client.request({
            command: 'book_offers',
            taker_gets: {
              currency: firstHop.currency,
              issuer: firstHop.issuer
            },
            taker_pays: 'XRP',
            limit: 10
          })
          
          marketDepth = {
            offers_count: orderBook.result.offers.length,
            total_liquidity: orderBook.result.offers.reduce((sum, offer) => {
              const amount = typeof offer.TakerGets === 'string' 
                ? parseInt(offer.TakerGets) / 1000000 
                : parseFloat(offer.TakerGets.value)
              return sum + amount
            }, 0)
          }
        }
      } catch (depthError) {
        console.log('Could not fetch market depth:', depthError.message)
      }
    }
    
    // Calculate arbitrage opportunities
    const arbitrageOpportunities = []
    if (alternatives.length > 1) {
      for (let i = 0; i < alternatives.length - 1; i++) {
        const path1 = alternatives[i]
        const path2 = alternatives[i + 1]
        
        if (path1.exchange_rate > path2.exchange_rate * 1.005) { // 0.5% threshold
          arbitrageOpportunities.push({
            path1_index: path1.index,
            path2_index: path2.index,
            rate_difference: path1.exchange_rate - path2.exchange_rate,
            profit_potential: (path1.exchange_rate - path2.exchange_rate) / path2.exchange_rate
          })
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        source_account: sourceAccount,
        destination_account: destinationAccount,
        destination_amount: destinationAmount,
        alternatives: alternatives,
        best_path: alternatives[0],
        market_depth: marketDepth,
        arbitrage_opportunities: arbitrageOpportunities,
        pathfind_result: pathfindResult.result,
        ledger_index: pathfindResult.result.ledger_index,
        validated: pathfindResult.result.validated
      }
    })
    
  } catch (error) {
    console.error('Pathfinding error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to find payment paths'
    })
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}

