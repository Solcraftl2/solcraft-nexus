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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
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

    const { tokenName, symbol, totalSupply, assetType, metadata } = JSON.parse(event.body);

    // Validate required fields
    if (!tokenName || !symbol || !totalSupply || !assetType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Simulate MPT creation on XRPL
    const mptData = {
      id: `MPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tokenName,
      symbol,
      totalSupply: parseInt(totalSupply),
      assetType,
      metadata: metadata || {},
      creator: decoded.email,
      createdAt: new Date().toISOString(),
      status: 'active',
      xrplTxHash: `TX_${Math.random().toString(36).substr(2, 16).toUpperCase()}`,
      issuerAddress: `r${Math.random().toString(36).substr(2, 25)}`,
      currentSupply: parseInt(totalSupply),
      holders: 1,
      marketCap: parseInt(totalSupply) * (Math.random() * 100 + 1), // Random price
      volume24h: Math.random() * 10000,
      priceUSD: Math.random() * 100 + 1
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'MPT created successfully',
        data: mptData
      })
    };

  } catch (error) {
    console.error('MPT Creation Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

