const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    // Validazione input
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Email e password sono obbligatori'
        }),
      };
    }

    // Simula la verifica dell'utente nel database
    // In produzione, qui faresti una query a Supabase per verificare le credenziali
    const mockUsers = [
      {
        id: 1,
        email: 'admin@solcraft.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'SolCraft',
        isVerified: true
      },
      {
        id: 2,
        email: 'demo@solcraft.com',
        password: await bcrypt.hash('demo123', 10),
        firstName: 'Demo',
        lastName: 'User',
        isVerified: true
      }
    ];

    // Trova l'utente
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Credenziali non valide'
        }),
      };
    }

    // Verifica la password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Credenziali non valide'
        }),
      };
    }

    // Genera JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Login completato con successo',
        token: token,
        user: userWithoutPassword
      }),
    };

  } catch (error) {
    console.error('Errore login:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Errore interno del server'
      }),
    };
  }
};

