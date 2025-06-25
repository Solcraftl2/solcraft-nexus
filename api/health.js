export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  return res.status(200).json({
    success: true,
    message: 'SolCraft Nexus API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      'Google OAuth': '/api/auth/oauth/google',
      'GitHub OAuth': '/api/auth/oauth/github',
      'Wallet Auth': '/api/auth/wallet'
    }
  })
}

