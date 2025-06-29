const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

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

    // Verifica se l'utente esiste già in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
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

    // Crea l'utente nel database Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
      .select('*')
      .single();

    if (insertError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: insertError.message }),
      };
    }

    // Genera JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        fullName: `${firstName} ${lastName}`
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const { password_hash: _, ...userWithoutPassword } = newUser;

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

