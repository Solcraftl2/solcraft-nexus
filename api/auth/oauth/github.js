// Vercel Serverless Function for GitHub OAuth
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
    if (req.method === 'POST') {
      const { provider, user, timestamp } = req.body

      // Simulate GitHub OAuth authentication
      // In production, this would integrate with GitHub OAuth API
      const mockUser = {
        id: `github_${Date.now()}`,
        name: user?.name || 'GitHub User',
        email: user?.email || 'user@github.com',
        avatar: user?.avatar || 'https://avatars.githubusercontent.com/u/default',
        provider: 'github',
        verifierId: `github_${Math.random().toString(36).substr(2, 9)}`
      }

      // Generate JWT token (simplified for demo)
      const token = Buffer.from(JSON.stringify({
        userId: mockUser.id,
        email: mockUser.email,
        provider: 'github',
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })).toString('base64')

      return res.status(200).json({
        success: true,
        message: 'Login GitHub completato!',
        user: mockUser,
        token: token
      })
    }

    // Handle GET requests
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'GitHub OAuth API endpoint',
        provider: 'github'
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })

  } catch (error) {
    console.error('GitHub OAuth API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}

