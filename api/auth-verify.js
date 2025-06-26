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
    // Estrai il token dall'header Authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token mancante o formato non valido' }),
      };
    }

    const token = authHeader.substring(7); // Rimuovi "Bearer "
    
    // Verifica il token JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Simula il recupero dei dati utente dal database
      // In produzione, qui faresti una query al database Supabase
      const userData = {
        id: decoded.userId,
        email: decoded.email,
        firstName: decoded.firstName || 'Utente',
        lastName: decoded.lastName || '',
        isVerified: true,
        createdAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: userData,
          message: 'Token valido'
        }),
      };

    } catch (jwtError) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Token non valido o scaduto',
          details: jwtError.message 
        }),
      };
    }

  } catch (error) {
    console.error('Errore verifica autenticazione:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Errore interno del server',
        message: 'Errore durante la verifica dell\'autenticazione'
      }),
    };
  }
};

