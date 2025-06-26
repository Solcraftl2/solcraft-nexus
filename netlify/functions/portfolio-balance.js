const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // Gestione CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verifica autenticazione
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token mancante' }),
      };
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Simula il caricamento del balance dal database
      // In produzione, qui faresti query a Supabase per ottenere i dati reali
      const portfolioBalance = {
        totalBalance: 0, // Inizialmente vuoto per nuovi utenti
        totalAssets: 0,
        monthlyReturn: 0,
        securityScore: 95,
        lastUpdated: new Date().toISOString(),
        currency: 'EUR',
        breakdown: {
          realEstate: 0,
          commodities: 0,
          equity: 0,
          crypto: 0
        }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(portfolioBalance),
      };

    } catch (jwtError) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token non valido' }),
      };
    }

  } catch (error) {
    console.error('Errore portfolio balance:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Errore interno del server',
        message: 'Errore durante il caricamento del portfolio'
      }),
    };
  }
};

