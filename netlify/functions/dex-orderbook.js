const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { pair = 'XRP/USD' } = event.queryStringParameters || {};

    // Generate realistic orderbook data
    const generateOrders = (side, basePrice, count = 10) => {
      const orders = [];
      for (let i = 0; i < count; i++) {
        const priceVariation = side === 'buy' ? -i * 0.001 : i * 0.001;
        const price = basePrice * (1 + priceVariation);
        const amount = Math.random() * 1000 + 100;
        
        orders.push({
          price: price.toFixed(6),
          amount: amount.toFixed(2),
          total: (price * amount).toFixed(2),
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
        });
      }
      return orders;
    };

    const basePrice = 0.52; // XRP price
    const orderbook = {
      pair,
      timestamp: new Date().toISOString(),
      bids: generateOrders('buy', basePrice, 15),
      asks: generateOrders('sell', basePrice, 15),
      spread: {
        absolute: '0.001',
        percentage: '0.19%'
      },
      stats: {
        lastPrice: basePrice.toFixed(6),
        change24h: '+2.34%',
        volume24h: '1,234,567.89',
        high24h: '0.534',
        low24h: '0.508'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: orderbook
      })
    };

  } catch (error) {
    console.error('DEX Orderbook Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

