import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase, getUserByEmail } from '../config/supabaseClient.js';
import { withCors } from '../utils/cors.js';
import logger, { handleApiError, measurePerformance } from '../utils/logger.js';

/**
 * Funzione di login per SolCraft Nexus
 * Gestisce autenticazione utenti con email/password
 */
const loginHandler = async (event, context) => {
  const perf = measurePerformance('user_login');
  
  try {
    // Validazione metodo HTTP
    if (event.httpMethod !== 'POST') {
      logger.warn('Invalid HTTP method for login', { method: event.httpMethod });
      return {
        statusCode: 405,
        body: JSON.stringify({ 
          success: false, 
          error: 'Metodo non consentito' 
        })
      };
    }

    // Parsing del body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      logger.error('Invalid JSON in request body', error);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Formato richiesta non valido'
        })
      };
    }

    const { email, password } = body;

    // Validazione input
    if (!email || !password) {
      logger.warn('Missing credentials in login attempt', { 
        email: email ? 'provided' : 'missing',
        password: password ? 'provided' : 'missing'
      });
      
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Email e password sono obbligatori'
        })
      };
    }

    // Validazione formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Invalid email format in login attempt', { email });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Formato email non valido'
        })
      };
    }

    logger.info('Login attempt started', { email });

    // Cerca l'utente nel database
    let user;
    try {
      user = await getUserByEmail(email);
    } catch (error) {
      logger.error('Database error during user lookup', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Errore di connessione al database'
        })
      };
    }
    
    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: 'Credenziali non valide'
        })
      };
    }

    // Verifica la password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      logger.error('Password verification error', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Errore durante la verifica delle credenziali'
        })
      };
    }
    
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { 
        email, 
        userId: user.id 
      });
      
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: 'Credenziali non valide'
        })
      };
    }

    // Verifica se l'account è attivo
    if (user.status !== 'active') {
      logger.warn('Login attempt with inactive account', { 
        email, 
        userId: user.id, 
        status: user.status 
      });
      
      return {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          message: 'Account non attivo. Contatta il supporto.'
        })
      };
    }

    // Aggiorna statistiche di login
    try {
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          login_count: (user.login_count || 0) + 1
        })
        .eq('id', user.id);
    } catch (error) {
      logger.error('Error updating login statistics', error);
      // Non bloccare il login per questo errore
    }

    // Genera JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Errore di configurazione del server'
        })
      };
    }

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

    // Log audit del login
    logger.audit('login_success', user.id, {
      email: user.email,
      ip: event.headers['x-forwarded-for'] || 'unknown',
      userAgent: event.headers['user-agent'] || 'unknown'
    });

    // Registra attività utente
    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'login',
          description: 'User logged in successfully',
          ip_address: event.headers['x-forwarded-for'] || 'unknown',
          user_agent: event.headers['user-agent'] || 'unknown',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Error logging user activity', error);
      // Non bloccare il login per questo errore
    }

    const duration = perf.end({ userId: user.id });
    logger.info('Login completed successfully', { 
      email, 
      userId: user.id, 
      duration: `${duration}ms` 
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
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
      })
    };

  } catch (error) {
    perf.end();
    logger.error('Unexpected error in login function', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify(handleApiError(error, 'login'))
    };
  }
};

// Esporta la funzione con CORS wrapper
export const handler = withCors(loginHandler);

