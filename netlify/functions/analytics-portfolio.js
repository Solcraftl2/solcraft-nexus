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

    const { timeframe = '30d' } = event.queryStringParameters || {};

    // Generate realistic portfolio analytics
    const generatePerformanceData = (days) => {
      const data = [];
      const baseValue = 125000;
      let currentValue = baseValue;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate realistic portfolio fluctuations
        const change = (Math.random() - 0.5) * 0.02; // ±1% daily change
        currentValue *= (1 + change);
        
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(currentValue),
          change: change * 100,
          volume: Math.random() * 50000 + 10000
        });
      }
      return data;
    };

    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const performanceData = generatePerformanceData(days);
    const currentValue = performanceData[performanceData.length - 1].value;
    const initialValue = performanceData[0].value;
    const totalReturn = ((currentValue - initialValue) / initialValue) * 100;

    const analytics = {
      user: decoded.email,
      timeframe,
      summary: {
        totalValue: currentValue,
        totalReturn: totalReturn.toFixed(2) + '%',
        totalReturnUSD: (currentValue - initialValue).toFixed(2),
        bestPerformingAsset: 'REAL_ESTATE_MILAN',
        worstPerformingAsset: 'GOLD_BARS_LBMA',
        sharpeRatio: (Math.random() * 2 + 0.5).toFixed(2),
        volatility: (Math.random() * 15 + 5).toFixed(2) + '%',
        maxDrawdown: '-' + (Math.random() * 8 + 2).toFixed(2) + '%'
      },
      performance: performanceData,
      assetAllocation: [
        { asset: 'Real Estate', percentage: 45, value: currentValue * 0.45, change: '+3.2%' },
        { asset: 'Commodities', percentage: 25, value: currentValue * 0.25, change: '+1.8%' },
        { asset: 'Art & Collectibles', percentage: 20, value: currentValue * 0.20, change: '+5.1%' },
        { asset: 'Cash & Equivalents', percentage: 10, value: currentValue * 0.10, change: '+0.1%' }
      ],
      riskMetrics: {
        portfolioBeta: (Math.random() * 0.5 + 0.7).toFixed(2),
        valueAtRisk: '-' + (Math.random() * 5 + 2).toFixed(2) + '%',
        expectedShortfall: '-' + (Math.random() * 8 + 4).toFixed(2) + '%',
        correlationMatrix: {
          'Real Estate': { 'Commodities': 0.23, 'Art': 0.15, 'Cash': -0.05 },
          'Commodities': { 'Art': 0.31, 'Cash': -0.12 },
          'Art': { 'Cash': 0.02 }
        }
      },
      rebalancingRecommendations: [
        {
          action: 'Reduce Real Estate exposure',
          reason: 'Overweight by 5% vs target allocation',
          impact: 'Reduce risk concentration'
        },
        {
          action: 'Increase Art allocation',
          reason: 'Strong performance trend',
          impact: 'Enhance diversification'
        }
      ]
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: analytics
      })
    };

  } catch (error) {
    console.error('Portfolio Analytics Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

