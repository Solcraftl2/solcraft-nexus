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
    const { firstName, lastName, email, password } = JSON.parse(event.body);

    // Validazione input
    if (!firstName || !lastName || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Tutti i campi sono obbligatori'
        }),
      };
    }

    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'La password deve essere di almeno 8 caratteri'
        }),
      };
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Formato email non valido'
        }),
      };
    }

    // Simula la verifica se l'utente esiste già
    // In produzione, qui faresti una query a Supabase per verificare se l'email esiste
    const existingEmails = ['admin@solcraft.com', 'demo@solcraft.com'];
    
    if (existingEmails.includes(email.toLowerCase())) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Un account con questa email esiste già'
        }),
      };
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simula la creazione dell'utente nel database
    // In produzione, qui faresti un INSERT in Supabase
    const newUser = {
      id: Date.now(), // In produzione sarebbe generato dal database
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    // Genera JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Registrazione completata con successo',
        token: token,
        user: userWithoutPassword
      }),
    };

  } catch (error) {
    console.error('Errore registrazione:', error);
    
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

