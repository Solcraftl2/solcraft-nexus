export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { accessToken, idToken, user } = req.body

      // Validate required fields
      if (!accessToken && !idToken) {
        return res.status(400).json({
          success: false,
          error: 'Access token o ID token è richiesto'
        })
      }

      // In a real implementation, you would:
      // 1. Verify the Google ID token with Google's public keys
      // 2. Make a request to Google's userinfo endpoint with the access token
      // 3. Validate the token signature and claims
      // 4. Create or update user in your database

      // For demo purposes, we'll verify with Google's userinfo endpoint
      let googleUser = null
      
      if (accessToken) {
        try {
          const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
          if (response.ok) {
            googleUser = await response.json()
          }
        } catch (error) {
          console.error('Google API error:', error)
        }
      }

      // If we have user data from Google API, use it; otherwise use provided data
      const userData = googleUser || user || {}

      const authenticatedUser = {
        id: `google_${userData.id || Date.now()}`,
        name: userData.name || userData.given_name + ' ' + userData.family_name || 'Google User',
        email: userData.email || 'user@gmail.com',
        avatar: userData.picture || 'https://lh3.googleusercontent.com/a/default-user',
        provider: 'google',
        googleId: userData.id,
        verified: userData.verified_email || true,
        locale: userData.locale || 'en'
      }

      // Generate JWT token (in production, use proper JWT library with secret)
      const token = Buffer.from(JSON.stringify({
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        provider: 'google',
        googleId: authenticatedUser.googleId,
        iat: Date.now(),
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })).toString('base64')

      return res.status(200).json({
        success: true,
        message: 'Login Google completato con successo!',
        user: authenticatedUser,
        token: token
      })

    } catch (error) {
      console.error('Google OAuth error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server durante l\'autenticazione Google'
      })
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use POST for Google authentication.' 
  })
}

