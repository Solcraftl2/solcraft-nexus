// Vercel Serverless Function for Apple OAuth
module.exports = async (req, res) => {
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

      // Simulate Apple OAuth authentication
      // In production, this would integrate with Apple OAuth API
      const mockUser = {
        id: `apple_${Date.now()}`,
        name: user?.name || 'Apple User',
        email: user?.email || 'user@icloud.com',
        avatar: user?.avatar || 'https://ui-avatars.com/api/?name=Apple+User&background=000&color=fff',
        provider: 'apple',
        verifierId: `apple_${Math.random().toString(36).substr(2, 9)}`
      }

      // Generate JWT token (simplified for demo)
      const token = Buffer.from(JSON.stringify({
        userId: mockUser.id,
        email: mockUser.email,
        provider: 'apple',
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })).toString('base64')

      return res.status(200).json({
        success: true,
        message: 'Login Apple completato!',
        user: mockUser,
        token: token
      })
    }

    // Handle GET requests
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Apple OAuth API endpoint',
        provider: 'apple'
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })

  } catch (error) {
    console.error('Apple OAuth API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}

