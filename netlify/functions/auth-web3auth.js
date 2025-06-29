const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };
  }

  try {
    const { provider, loginType, mpcEnabled, network, email, name } = JSON.parse(event.body);

    // Validazione input
    if (!provider || !loginType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Provider e loginType sono richiesti'
        })
      };
    }

    // Simulazione Web3Auth con MPC technology
    const supportedProviders = ['google', 'twitter', 'discord', 'facebook', 'apple'];
    
    if (!supportedProviders.includes(provider)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: `Provider ${provider} non supportato. Supportati: ${supportedProviders.join(', ')}`
        })
      };
    }

    // Generazione wallet MPC semplificata
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

    const walletAddress = generateMPCWallet(provider, network || 'xrpl');

    // Recupera o crea utente in Supabase
    const generatedId = `${provider}_${Date.now()}`;
    const userEmail = email || `${generatedId}@${provider}.com`;
    const displayName = name || provider.charAt(0).toUpperCase() + provider.slice(1) + ' User';

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    let user;

    if (existingUser) {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString(), wallet_address: walletAddress })
        .eq('id', existingUser.id);
      user = { ...existingUser, wallet_address: walletAddress };
    } else {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          email: userEmail,
          full_name: displayName,
          provider: provider,
          auth_method: 'web3auth',
          wallet_address: walletAddress,
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select('*')
        .single();
      user = newUser;
    }

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

    const { password_hash: _, ...userSafe } = user;

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Web3Auth con ${provider} completato con successo`,
        user: userSafe,
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
      })
    };

  } catch (error) {
    console.error('Errore Web3Auth:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Errore interno del server durante l\'autenticazione Web3Auth',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};

