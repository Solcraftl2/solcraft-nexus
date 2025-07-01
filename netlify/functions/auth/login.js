import { createReqRes } from '../config/requestWrapper.js';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
import { supabase, getUserByEmail, handleSupabaseError } from '../config/supabaseClient.js';

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
    console.error('Function error:', error);
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
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e password sono obbligatori'
      });
    }

    // Cerca l'utente nel database Supabase
    let user;
    try {
      user = await getUserByEmail(email);
    } catch (error) {
      console.error('Database error during login:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore di connessione al database'
      });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Verifica la password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('Password verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore durante la verifica delle credenziali'
      });
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Verifica se l'account è attivo
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account non attivo. Contatta il supporto.'
      });
    }

    // Aggiorna last_login
    try {
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          login_count: (user.login_count || 0) + 1
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last login:', error);
      // Non bloccare il login per questo errore
    }

    // Genera JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'solcraft-nexus-secret-key-2025';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role || 'user',
        walletAddress: user.wallet_address
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const { password_hash, ...userWithoutPassword } = user;

    // Registra il login per audit
    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'login',
          description: 'User logged in successfully',
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'],
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Non bloccare il login per questo errore
    }

    return res.status(200).json({
      success: true,
      message: 'Login completato con successo',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role || 'user',
        walletAddress: user.wallet_address,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        lastLogin: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

