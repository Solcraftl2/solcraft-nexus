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

  try {
    // Verify JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'solcraft-secret-key');

    if (event.httpMethod === 'GET') {
      // Get user's trading orders
      const orders = [
        {
          id: 'ORD_001',
          type: 'buy',
          asset: 'REAL_ESTATE_MILAN',
          amount: 50000,
          price: 125.50,
          status: 'filled',
          createdAt: '2025-06-25T10:30:00Z',
          filledAt: '2025-06-25T10:31:15Z',
          fees: 125.50
        },
        {
          id: 'ORD_002',
          type: 'sell',
          asset: 'GOLD_BARS_LBMA',
          amount: 25000,
          price: 2340.75,
          status: 'pending',
          createdAt: '2025-06-26T09:15:00Z',
          filledAt: null,
          fees: 0
        },
        {
          id: 'ORD_003',
          type: 'buy',
          asset: 'ART_PICASSO_BLUE',
          amount: 100000,
          price: 850.25,
          status: 'partial',
          createdAt: '2025-06-26T11:20:00Z',
          filledAt: null,
          fees: 425.13,
          filledAmount: 50000
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            orders,
            summary: {
              totalOrders: orders.length,
              pendingOrders: orders.filter(o => o.status === 'pending').length,
              filledOrders: orders.filter(o => o.status === 'filled').length,
              totalVolume: orders.reduce((sum, o) => sum + o.amount, 0),
              totalFees: orders.reduce((sum, o) => sum + o.fees, 0)
            }
          }
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Create new trading order
      const { type, asset, amount, price, orderType = 'market' } = JSON.parse(event.body);

      if (!type || !asset || !amount) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const fees = amount * 0.0025; // 0.25% fee
      
      const order = {
        id: orderId,
        type,
        asset,
        amount: parseFloat(amount),
        price: price ? parseFloat(price) : null,
        orderType,
        status: orderType === 'market' ? 'filled' : 'pending',
        createdAt: new Date().toISOString(),
        filledAt: orderType === 'market' ? new Date().toISOString() : null,
        fees: orderType === 'market' ? fees : 0,
        user: decoded.email,
        xrplTxHash: `TX_${Math.random().toString(36).substr(2, 16).toUpperCase()}`
      };

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Order created successfully',
          data: order
        })
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Cancel order
      const orderId = event.queryStringParameters?.orderId;
      
      if (!orderId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Order ID required' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Order cancelled successfully',
          data: { orderId, status: 'cancelled' }
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Trading Orders Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

