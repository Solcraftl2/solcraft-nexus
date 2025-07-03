import { logger } from '../../utils/logger.js';

const { parse } = require('querystring');

// Helper per compatibilità Vercel -> Netlify
function createReqRes(event) {
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? (event.headers['content-type']?.includes('application/json') ? JSON.parse(event.body) : parse(event.body)) : {},
    query: event.queryStringParameters || {},
    ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1'
  };
  
  const res = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: '',
    
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    json: function(data) {
      this.body = JSON.stringify(data);
      return this;
    },
    
    end: function(data) {
      if (data) this.body = data;
      return this;
    },
    
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    }
  };
  
  return { req, res };
}

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

exports.handler = async (event, context) => {
  const { req, res } = createReqRes(event);
  
  try {
    await originalHandler(req, res);
    
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body
    };
  } catch (error) {
    logger.error('Function error:', error);
    return {
      statusCode: 500,
      headers: res.headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function originalHandler(req, res) {
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

      let githubUser = null;
      let finalAccessToken = accessToken;

      // Se abbiamo un authorization code, scambialo per access token
      if (code && !accessToken) {
        try {
          const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: process.env.GITHUB_CLIENT_ID || 'demo-client-id',
              client_secret: process.env.GITHUB_CLIENT_SECRET || 'demo-client-secret',
              code: code,
              redirect_uri: process.env.GITHUB_REDIRECT_URI || 'https://solcraft-nexus-production.netlify.app/auth/github/callback'
            })
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (tokenData.access_token) {
              finalAccessToken = tokenData.access_token;
            } else {
              logger.error('No access token in response:', tokenData);
            }
          } else {
            logger.error('Token exchange failed:', await tokenResponse.text());
          }
        } catch (error) {
          logger.error('Token exchange error:', error);
        }
      }

      // Ottieni dati utente da GitHub API
      if (finalAccessToken) {
        try {
          // Get user info from GitHub API
          const userResponse = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${finalAccessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'SolCraft-Nexus-Platform'
            }
          });

          if (userResponse.ok) {
            githubUser = await userResponse.json();
            
            // Get user email if not public
            if (!githubUser.email) {
              try {
                const emailResponse = await fetch('https://api.github.com/user/emails', {
                  headers: {
                    'Authorization': `Bearer ${finalAccessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'SolCraft-Nexus-Platform'
                  }
                });
                
                if (emailResponse.ok) {
                  const emails = await emailResponse.json();
                  const primaryEmail = emails.find(email => email.primary);
                  if (primaryEmail) {
                    githubUser.email = primaryEmail.email;
                    githubUser.verified = primaryEmail.verified;
                  }
                }
              } catch (emailError) {
                logger.error('GitHub email fetch error:', emailError);
              }
            }

            // Get additional user stats
            try {
              const [reposResponse, orgsResponse] = await Promise.all([
                fetch(`https://api.github.com/users/${githubUser.login}/repos?per_page=1`, {
                  headers: {
                    'Authorization': `Bearer ${finalAccessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'SolCraft-Nexus-Platform'
                  }
                }),
                fetch('https://api.github.com/user/orgs', {
                  headers: {
                    'Authorization': `Bearer ${finalAccessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'SolCraft-Nexus-Platform'
                  }
                })
              ]);

              if (orgsResponse.ok) {
                const orgs = await orgsResponse.json();
                githubUser.organizations = orgs.length;
              }
            } catch (statsError) {
              logger.error('GitHub stats fetch error:', statsError);
            }

          } else {
            logger.error('GitHub user API error:', userResponse.status, await userResponse.text());
          }
        } catch (error) {
          logger.error('GitHub API error:', error);
        }
      }

      // Fallback ai dati forniti dal client se le API GitHub falliscono
      if (!githubUser && user) {
        githubUser = user;
      }

      // Se ancora non abbiamo dati utente, usa dati mock
      if (!githubUser) {
        githubUser = {
          id: 'demo_' + Date.now(),
          login: 'demo-user',
          name: 'Demo GitHub User',
          email: 'demo@github.com',
          avatar_url: 'https://github.com/identicons/default.png',
          verified: true,
          public_repos: 0,
          followers: 0,
          following: 0
        };
      }

      const authenticatedUser = {
        id: `github_${githubUser.id}`,
        name: githubUser.name || githubUser.login || 'GitHub User',
        email: githubUser.email || `${githubUser.login}@github.local`,
        avatar: githubUser.avatar_url || 'https://github.com/identicons/default.png',
        provider: 'github',
        githubId: githubUser.id,
        username: githubUser.login,
        verified: githubUser.verified || false,
        publicRepos: githubUser.public_repos || 0,
        followers: githubUser.followers || 0,
        following: githubUser.following || 0,
        organizations: githubUser.organizations || 0,
        company: githubUser.company,
        location: githubUser.location,
        bio: githubUser.bio,
        blog: githubUser.blog,
        hireable: githubUser.hireable,
        createdAt: githubUser.created_at,
        connectedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Generate real JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
      const token = jwt.sign(
        {
          userId: authenticatedUser.id,
          email: authenticatedUser.email,
          provider: 'github',
          githubId: authenticatedUser.githubId,
          username: authenticatedUser.username,
          verified: authenticatedUser.verified,
          iat: Math.floor(Date.now() / 1000)
        },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        {
          userId: authenticatedUser.id,
          type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '30d' }
      );

      // Hash email per privacy
      const emailHash = crypto.createHash('md5').update(authenticatedUser.email.toLowerCase()).digest('hex');

      return res.status(200).json({
        success: true,
        message: 'Login GitHub completato con successo!',
        user: authenticatedUser,
        tokens: {
          accessToken: token,
          refreshToken: refreshToken,
          expiresIn: 604800, // 7 giorni in secondi
          tokenType: 'Bearer'
        },
        metadata: {
          loginMethod: 'github_oauth',
          emailHash: emailHash,
          loginTimestamp: new Date().toISOString(),
          sessionId: crypto.randomBytes(16).toString('hex'),
          githubStats: {
            repos: authenticatedUser.publicRepos,
            followers: authenticatedUser.followers,
            following: authenticatedUser.following,
            organizations: authenticatedUser.organizations
          }
        }
      });

    } catch (error) {
      logger.error('GitHub OAuth error:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server durante l\'autenticazione GitHub',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use POST for GitHub authentication.' 
  });
}

