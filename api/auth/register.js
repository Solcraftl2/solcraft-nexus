const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  // Gestione CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, password } = req.body;

    // Validazione input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi sono obbligatori'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La password deve essere di almeno 8 caratteri'
      });
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato email non valido'
      });
    }

    // Simula la verifica se l'utente esiste già
    // In produzione, qui faresti una query a Supabase per verificare se l'email esiste
    const existingEmails = ['admin@solcraft.com', 'demo@solcraft.com'];
    
    if (existingEmails.includes(email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        message: 'Un account con questa email esiste già'
      });
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

    return res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo',
      token: token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Errore registrazione:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
}

