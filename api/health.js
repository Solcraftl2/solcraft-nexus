// Netlify Function format
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'SolCraft Nexus API is healthy on Netlify!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      platform: 'Netlify Functions',
      endpoints: {
        'Google OAuth': '/api/auth/oauth/google',
        'GitHub OAuth': '/api/auth/oauth/github',
        'Wallet Auth': '/api/auth/wallet',
        'Account Info': '/api/account/info',
        'MPT Create': '/api/mpt/create',
        'Portfolio': '/api/portfolio/balance'
      }
    })
  }
}

