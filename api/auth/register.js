const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
import { supabase, getUserByEmail, insertUser, handleSupabaseError } from '../config/supabaseClient.js';

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
    const { firstName, lastName, email, password, acceptTerms, acceptPrivacy } = req.body;

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

    // Validazione accettazione termini
    if (!acceptTerms || !acceptPrivacy) {
      return res.status(400).json({
        success: false,
        message: 'È necessario accettare i termini di servizio e la privacy policy'
      });
    }

    // Verifica se l'utente esiste già
    let existingUser;
    try {
      existingUser = await getUserByEmail(email);
    } catch (error) {
      console.error('Database error during user check:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore di connessione al database'
      });
    }
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un account con questa email esiste già'
      });
    }

    // Hash della password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
      console.error('Password hashing error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore durante la creazione dell\'account'
      });
    }

    // Creazione dell'utente nel database Supabase
    const userData = {
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      role: 'user',
      status: 'active',
      is_verified: false,
      accept_terms: acceptTerms,
      accept_privacy: acceptPrivacy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let newUser;
    try {
      newUser = await insertUser(userData);
    } catch (error) {
      console.error('Database error during user creation:', error);
      
      // Gestione errori specifici
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          message: 'Un account con questa email esiste già'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Errore durante la creazione dell\'account'
      });
    }

    // Genera JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Crea portfolio iniziale per l'utente
    try {
      await supabase
        .from('portfolios')
        .insert({
          user_id: newUser.id,
          name: 'Portfolio Principale',
          description: 'Portfolio di investimenti principale',
          total_value: 0,
          currency: 'USD',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating initial portfolio:', error);
      // Non bloccare la registrazione per questo errore
    }

    // Registra l'attività di registrazione
    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: newUser.id,
          activity_type: 'registration',
          description: 'User registered successfully',
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'],
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging registration activity:', error);
      // Non bloccare la registrazione per questo errore
    }

    // Rimuovi la password dalla risposta
    const { password_hash, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo',
      token: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        isVerified: newUser.is_verified,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server durante la registrazione',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

