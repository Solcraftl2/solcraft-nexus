// Vercel Serverless Function for Google OAuth
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

      // Simulate Google OAuth authentication
      // In production, this would integrate with Google OAuth API
      const mockUser = {
        id: `google_${Date.now()}`,
        name: user?.name || 'Google User',
        email: user?.email || 'user@gmail.com',
        avatar: user?.avatar || 'https://lh3.googleusercontent.com/a/default-user',
        provider: 'google',
        verifierId: `google_${Math.random().toString(36).substr(2, 9)}`
      }

      // Generate JWT token (simplified for demo)
      const token = Buffer.from(JSON.stringify({
        userId: mockUser.id,
        email: mockUser.email,
        provider: 'google',
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })).toString('base64')

      return res.status(200).json({
        success: true,
        message: 'Login Google completato!',
        user: mockUser,
        token: token
      })
    }

    // Handle GET requests
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Google OAuth API endpoint',
        provider: 'google'
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })

  } catch (error) {
    console.error('Google OAuth API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}

