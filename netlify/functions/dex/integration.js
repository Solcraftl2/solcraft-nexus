
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

import { getXRPLClient, initializeXRPL } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';

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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Autenticazione richiesta per operazioni POST
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione richiesto'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
    
    try {
      jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }
  }

  try {
    // GET - Informazioni DEX e order book
    if (req.method === 'GET') {
      const {
        action = 'orderbook', // orderbook, liquidity, stats, pairs
        baseCurrency = 'XRP',
        quoteCurrency = 'USD',
        depth = 20
      } = req.query;

      try {
        let dexData;

        switch (action) {
          case 'orderbook':
            dexData = await getDEXOrderBook(baseCurrency, quoteCurrency, depth);
            break;
          case 'liquidity':
            dexData = await getDEXLiquidity();
            break;
          case 'stats':
            dexData = await getDEXStats();
            break;
          case 'pairs':
            dexData = await getTradingPairs();
            break;
          default:
            throw new Error('Azione non supportata');
        }

        return res.status(200).json({
          success: true,
          data: dexData,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore DEX GET:', error);
        
        // Fallback a dati mock per sviluppo
        const mockData = getMockDEXData(req.query.action);
        return res.status(200).json({
          success: true,
          data: mockData,
          mock: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // POST - Operazioni DEX (place order, cancel order)
    if (req.method === 'POST') {
      const { action, ...orderData } = req.body;

      try {
        let result;

        switch (action) {
          case 'place_order':
            result = await placeDEXOrder(orderData);
            break;
          case 'cancel_order':
            result = await cancelDEXOrder(orderData);
            break;
          case 'modify_order':
            result = await modifyDEXOrder(orderData);
            break;
          default:
            throw new Error('Azione non supportata');
        }

        return res.status(200).json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore DEX POST:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Metodo non supportato'
    });

  } catch (error) {
    console.error('Errore generale DEX:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      timestamp: new Date().toISOString()
    });
  }
}

// Funzioni helper per DEX XRPL
async function getDEXOrderBook(baseCurrency, quoteCurrency, depth) {
  try {
    const client = await getXRPLClient();
    
    // Richiesta order book da XRPL DEX
    const orderBookRequest = {
      command: 'book_offers',
      taker_gets: {
        currency: baseCurrency === 'XRP' ? 'XRP' : baseCurrency,
        issuer: baseCurrency === 'XRP' ? undefined : 'rTokenIssuerAddress'
      },
      taker_pays: {
        currency: quoteCurrency === 'XRP' ? 'XRP' : quoteCurrency,
        issuer: quoteCurrency === 'XRP' ? undefined : 'rTokenIssuerAddress'
      },
      limit: depth
    };

    const response = await client.request(orderBookRequest);
    
    return {
      pair: `${baseCurrency}/${quoteCurrency}`,
      bids: response.result.offers.map(offer => ({
        price: parseFloat(offer.quality),
        amount: parseFloat(offer.TakerGets.value || offer.TakerGets) / 1000000,
        total: parseFloat(offer.TakerPays.value || offer.TakerPays) / 1000000,
        account: offer.Account
      })),
      asks: [], // Richiesta separata per asks
      timestamp: new Date().toISOString(),
      spread: 0.001,
      volume24h: 125000
    };

  } catch (error) {
    console.error('Errore order book XRPL:', error);
    throw error;
  }
}

async function getDEXLiquidity() {
  return {
    totalLiquidity: 15750000,
    liquidityPools: [
      {
        pair: 'XRP/USD',
        liquidity: 8500000,
        volume24h: 2100000,
        apy: 12.5,
        fees24h: 8400
      },
      {
        pair: 'RLUSD/XRP',
        liquidity: 4200000,
        volume24h: 980000,
        apy: 15.2,
        fees24h: 3920
      },
      {
        pair: 'SOLO/XRP',
        liquidity: 1850000,
        volume24h: 450000,
        apy: 18.7,
        fees24h: 1800
      },
      {
        pair: 'CSC/XRP',
        liquidity: 1200000,
        volume24h: 320000,
        apy: 22.1,
        fees24h: 1280
      }
    ],
    topProviders: [
      { address: 'rLiquidityProvider1...', contribution: 2500000, rewards24h: 3125 },
      { address: 'rLiquidityProvider2...', contribution: 1800000, rewards24h: 2250 },
      { address: 'rLiquidityProvider3...', contribution: 1200000, rewards24h: 1500 }
    ]
  };
}

async function getDEXStats() {
  return {
    volume24h: 3850000,
    volume7d: 28700000,
    volume30d: 125000000,
    trades24h: 15420,
    trades7d: 98500,
    trades30d: 425000,
    activeTraders24h: 2840,
    activeTraders7d: 12500,
    activeTraders30d: 45200,
    totalValueLocked: 15750000,
    topPairs: [
      { pair: 'XRP/USD', volume24h: 2100000, change24h: 5.2 },
      { pair: 'RLUSD/XRP', volume24h: 980000, change24h: -2.1 },
      { pair: 'SOLO/XRP', volume24h: 450000, change24h: 12.8 },
      { pair: 'CSC/XRP', volume24h: 320000, change24h: 8.5 }
    ],
    priceImpact: {
      low: 0.1,
      medium: 0.5,
      high: 2.0
    },
    fees: {
      maker: 0.1,
      taker: 0.15,
      total24h: 15400
    }
  };
}

async function getTradingPairs() {
  return {
    pairs: [
      {
        symbol: 'XRP/USD',
        baseAsset: 'XRP',
        quoteAsset: 'USD',
        price: 0.52,
        change24h: 5.2,
        volume24h: 2100000,
        high24h: 0.54,
        low24h: 0.49,
        liquidity: 8500000,
        active: true
      },
      {
        symbol: 'RLUSD/XRP',
        baseAsset: 'RLUSD',
        quoteAsset: 'XRP',
        price: 1.92,
        change24h: -2.1,
        volume24h: 980000,
        high24h: 1.98,
        low24h: 1.89,
        liquidity: 4200000,
        active: true
      },
      {
        symbol: 'SOLO/XRP',
        baseAsset: 'SOLO',
        quoteAsset: 'XRP',
        price: 0.28,
        change24h: 12.8,
        volume24h: 450000,
        high24h: 0.31,
        low24h: 0.25,
        liquidity: 1850000,
        active: true
      },
      {
        symbol: 'CSC/XRP',
        baseAsset: 'CSC',
        quoteAsset: 'XRP',
        price: 0.0045,
        change24h: 8.5,
        volume24h: 320000,
        high24h: 0.0048,
        low24h: 0.0041,
        liquidity: 1200000,
        active: true
      }
    ],
    totalPairs: 24,
    activePairs: 18,
    newPairs24h: 2
  };
}

async function placeDEXOrder(orderData) {
  const {
    pair,
    side, // 'buy' or 'sell'
    type, // 'market', 'limit', 'stop'
    amount,
    price,
    stopPrice,
    timeInForce = 'GTC' // GTC, IOC, FOK
  } = orderData;

  // Simulazione piazzamento ordine su XRPL DEX
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    orderId,
    pair,
    side,
    type,
    amount: parseFloat(amount),
    price: price ? parseFloat(price) : null,
    stopPrice: stopPrice ? parseFloat(stopPrice) : null,
    status: 'pending',
    timeInForce,
    filled: 0,
    remaining: parseFloat(amount),
    fees: {
      estimated: parseFloat(amount) * 0.0015,
      currency: pair.split('/')[1]
    },
    timestamp: new Date().toISOString(),
    estimatedSettlement: new Date(Date.now() + 4000).toISOString(),
    txHash: `tx_${Math.random().toString(36).substr(2, 16)}`
  };
}

async function cancelDEXOrder(orderData) {
  const { orderId } = orderData;
  
  return {
    orderId,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    refund: {
      amount: 1000,
      currency: 'XRP',
      txHash: `refund_${Math.random().toString(36).substr(2, 16)}`
    }
  };
}

async function modifyDEXOrder(orderData) {
  const { orderId, newPrice, newAmount } = orderData;
  
  return {
    orderId,
    status: 'modified',
    newPrice: parseFloat(newPrice),
    newAmount: parseFloat(newAmount),
    modifiedAt: new Date().toISOString(),
    fees: {
      modification: 0.1,
      currency: 'XRP'
    }
  };
}

function getMockDEXData(action) {
  switch (action) {
    case 'orderbook':
      return {
        pair: 'XRP/USD',
        bids: [
          { price: 0.5195, amount: 10000, total: 5195 },
          { price: 0.5190, amount: 15000, total: 7785 },
          { price: 0.5185, amount: 8000, total: 4148 }
        ],
        asks: [
          { price: 0.5205, amount: 12000, total: 6246 },
          { price: 0.5210, amount: 9000, total: 4689 },
          { price: 0.5215, amount: 11000, total: 5736.5 }
        ],
        spread: 0.001,
        volume24h: 125000
      };
    case 'liquidity':
      return getDEXLiquidity();
    case 'stats':
      return getDEXStats();
    case 'pairs':
      return getTradingPairs();
    default:
      return { message: 'Dati mock DEX' };
  }
}

