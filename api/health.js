// Vercel Serverless Function for Health Check
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const healthData = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'production',
      services: {
        api: 'online',
        database: 'simulated',
        authentication: 'online',
        wallet: 'online'
      },
      endpoints: {
        '/api/health': 'GET - Health check',
        '/api/auth/oauth/google': 'POST - Google OAuth',
        '/api/auth/oauth/github': 'POST - GitHub OAuth',
        '/api/auth/wallet': 'POST - Wallet Authentication'
      }
    }

    return res.status(200).json(healthData)

  } catch (error) {
    console.error('Health check error:', error)
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    })
  }
}

