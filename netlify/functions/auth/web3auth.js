import { logger } from '../utils/logger.js';

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

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';

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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { provider, loginType, mpcEnabled, network } = req.body;

    // Validazione input
    if (!provider || !loginType) {
      return res.status(400).json({
        success: false,
        message: 'Provider e loginType sono richiesti'
      });
    }

    // Simulazione Web3Auth con MPC technology
    const supportedProviders = ['google', 'twitter', 'discord', 'facebook', 'apple'];
    
    if (!supportedProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: `Provider ${provider} non supportato. Supportati: ${supportedProviders.join(', ')}`
      });
    }

    // Simulazione generazione wallet MPC
    const generateMPCWallet = (provider, network) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      
      if (network === 'xrpl') {
        // Genera indirizzo XRPL simulato
        return `rMPC${provider.toUpperCase()}${timestamp.toString().slice(-6)}${random.slice(0, 6)}`;
      } else {
        // Genera indirizzo Ethereum simulato
        return `0xMPC${timestamp.toString(16)}${random}`.slice(0, 42);
      }
    };

    // Genera wallet MPC
    const walletAddress = generateMPCWallet(provider, network || 'xrpl');
    
    // Simulazione dati utente da provider social
    const mockUserData = {
      google: {
        id: `google_${Date.now()}`,
        email: 'user@gmail.com',
        name: 'Google User',
        picture: 'https://via.placeholder.com/150'
      },
      twitter: {
        id: `twitter_${Date.now()}`,
        username: 'twitter_user',
        name: 'Twitter User',
        picture: 'https://via.placeholder.com/150'
      },
      discord: {
        id: `discord_${Date.now()}`,
        username: 'discord_user',
        name: 'Discord User',
        picture: 'https://via.placeholder.com/150'
      }
    };

    const userData = mockUserData[provider] || {
      id: `${provider}_${Date.now()}`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`
    };

    // Crea utente Web3Auth
    const user = {
      id: userData.id,
      email: userData.email || `${userData.username || userData.id}@${provider}.com`,
      name: userData.name,
      picture: userData.picture,
      provider: provider,
      authMethod: 'web3auth',
      walletAddress: walletAddress,
      mpcEnabled: mpcEnabled,
      network: network || 'xrpl',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Genera JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        walletAddress: walletAddress,
        authMethod: 'web3auth',
        provider: provider
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Simulazione balance wallet (per demo)
    const mockBalance = {
      xrp: (Math.random() * 1000).toFixed(2),
      usd: (Math.random() * 5000).toFixed(2),
      tokens: [
        {
          currency: 'USD',
          issuer: 'rUSDIssuer123456789',
          balance: (Math.random() * 10000).toFixed(2)
        },
        {
          currency: 'EUR',
          issuer: 'rEURIssuer123456789', 
          balance: (Math.random() * 8000).toFixed(2)
        }
      ]
    };

    return res.status(200).json({
      success: true,
      message: `Web3Auth con ${provider} completato con successo`,
      user: user,
      token: token,
      walletAddress: walletAddress,
      balance: mockBalance,
      mpcInfo: {
        enabled: mpcEnabled,
        threshold: '2/3',
        keyShares: 3,
        description: 'Wallet protetto da tecnologia MPC distribuita'
      },
      features: {
        passwordless: true,
        socialLogin: true,
        selfCustodial: true,
        crossPlatform: true,
        recovery: 'Social recovery disponibile'
      }
    });

  } catch (error) {
    logger.error('Errore Web3Auth:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server durante l\'autenticazione Web3Auth',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

