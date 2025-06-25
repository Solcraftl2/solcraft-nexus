export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { accessToken, code, user } = req.body

      // Validate required fields
      if (!accessToken && !code) {
        return res.status(400).json({
          success: false,
          error: 'Access token o authorization code è richiesto'
        })
      }

      // In a real implementation, you would:
      // 1. If code is provided, exchange it for access token with GitHub
      // 2. Use access token to get user info from GitHub API
      // 3. Validate the token and user data
      // 4. Create or update user in your database

      let githubUser = null
      
      if (accessToken) {
        try {
          // Get user info from GitHub API
          const userResponse = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'SolCraft-Nexus'
            }
          })

          if (userResponse.ok) {
            githubUser = await userResponse.json()
            
            // Get user email if not public
            if (!githubUser.email) {
              const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'SolCraft-Nexus'
                }
              })
              
              if (emailResponse.ok) {
                const emails = await emailResponse.json()
                const primaryEmail = emails.find(email => email.primary)
                if (primaryEmail) {
                  githubUser.email = primaryEmail.email
                  githubUser.verified = primaryEmail.verified
                }
              }
            }
          }
        } catch (error) {
          console.error('GitHub API error:', error)
        }
      }

      // If we have user data from GitHub API, use it; otherwise use provided data
      const userData = githubUser || user || {}

      const authenticatedUser = {
        id: `github_${userData.id || Date.now()}`,
        name: userData.name || userData.login || 'GitHub User',
        email: userData.email || 'user@github.com',
        avatar: userData.avatar_url || 'https://github.com/identicons/default.png',
        provider: 'github',
        githubId: userData.id,
        username: userData.login,
        verified: userData.verified || false,
        publicRepos: userData.public_repos || 0,
        followers: userData.followers || 0,
        following: userData.following || 0,
        company: userData.company,
        location: userData.location,
        bio: userData.bio,
        blog: userData.blog,
        createdAt: userData.created_at
      }

      // Generate JWT token (in production, use proper JWT library with secret)
      const token = Buffer.from(JSON.stringify({
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        provider: 'github',
        githubId: authenticatedUser.githubId,
        username: authenticatedUser.username,
        iat: Date.now(),
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })).toString('base64')

      return res.status(200).json({
        success: true,
        message: 'Login GitHub completato con successo!',
        user: authenticatedUser,
        token: token
      })

    } catch (error) {
      console.error('GitHub OAuth error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server durante l\'autenticazione GitHub'
      })
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use POST for GitHub authentication.' 
  })
}

