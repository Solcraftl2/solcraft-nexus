// Netlify Function - Google OAuth
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    if (event.httpMethod === 'GET') {
      // Redirect to Google OAuth
      const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
        `response_type=code&` +
        `scope=openid email profile`

      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': googleAuthUrl
        },
        body: ''
      }
    }

    if (event.httpMethod === 'POST') {
      const { code } = JSON.parse(event.body)
      
      // Exchange code for token (simplified for demo)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Google OAuth authentication successful',
          user: {
            id: 'demo_user_123',
            email: 'user@example.com',
            name: 'Demo User'
          },
          token: 'demo_jwt_token_' + Date.now()
        })
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}

