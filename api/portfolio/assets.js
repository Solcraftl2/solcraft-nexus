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
      
      // Per nuovi utenti, restituisce array vuoto
      // In produzione, qui faresti query a Supabase per ottenere gli asset reali
      const assets = [];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(assets),
      };

    } catch (jwtError) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token non valido' }),
      };
    }

  } catch (error) {
    console.error('Errore portfolio assets:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Errore interno del server',
        message: 'Errore durante il caricamento degli asset'
      }),
    };
  }
};

