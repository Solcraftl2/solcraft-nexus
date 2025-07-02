import { logger } from '../utils/logger.js';
import { withCors } from '../utils/cors.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase, getUserByEmail, insertUser } from '../config/supabaseClient.js';

async function registerUser(event, context) {
  try {
    // Validazione metodo HTTP
    if (event.httpMethod !== 'POST') {
      logger.warn('Invalid HTTP method for registration', { 
        method: event.httpMethod,
        path: event.path 
      });
      return {
        statusCode: 405,
        body: JSON.stringify({ 
          success: false, 
          error: 'Method not allowed' 
        })
      };
    }

    // Parse del body
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch (error) {
      logger.error('Invalid JSON in request body', { error: error.message });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Invalid JSON format'
        })
      };
    }

    const { firstName, lastName, email, password, acceptTerms, acceptPrivacy } = requestData;

    logger.info('User registration attempt', { 
      email: email?.toLowerCase(),
      hasFirstName: !!firstName,
      hasLastName: !!lastName,
      acceptTerms,
      acceptPrivacy
    });

    // Validazione input
    if (!firstName || !lastName || !email || !password) {
      logger.warn('Registration failed: missing required fields', { 
        missingFields: {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password
        }
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Tutti i campi sono obbligatori'
        })
      };
    }

    if (password.length < 8) {
      logger.warn('Registration failed: password too short', { 
        passwordLength: password.length 
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'La password deve essere di almeno 8 caratteri'
        })
      };
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Registration failed: invalid email format', { email });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Formato email non valido'
        })
      };
    }

    // Validazione accettazione termini
    if (!acceptTerms || !acceptPrivacy) {
      logger.warn('Registration failed: terms not accepted', { 
        acceptTerms, 
        acceptPrivacy 
      });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'È necessario accettare i termini di servizio e la privacy policy'
        })
      };
    }

    // Verifica se l'utente esiste già
    let existingUser;
    try {
      existingUser = await getUserByEmail(email);
    } catch (error) {
      logger.error('Database error during user check', { 
        error: error.message,
        email: email.toLowerCase()
      });
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Errore di connessione al database'
        })
      };
    }
    
    if (existingUser) {
      logger.warn('Registration failed: user already exists', { 
        email: email.toLowerCase() 
      });
      return {
        statusCode: 409,
        body: JSON.stringify({
          success: false,
          message: 'Un account con questa email esiste già'
        })
      };
    }

    // Hash della password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
      logger.debug('Password hashed successfully');
    } catch (error) {
      logger.error('Password hashing error', { error: error.message });
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Errore durante la creazione dell\'account'
        })
      };
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
      logger.info('User created successfully', { 
        userId: newUser.id,
        email: newUser.email 
      });
    } catch (error) {
      logger.error('Database error during user creation', { 
        error: error.message,
        email: email.toLowerCase()
      });
      
      // Gestione errori specifici
      if (error.message.includes('duplicate key')) {
        return {
          statusCode: 409,
          body: JSON.stringify({
            success: false,
            message: 'Un account con questa email esiste già'
          })
        };
      }
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Errore durante la creazione dell\'account'
        })
      };
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
      logger.debug('Initial portfolio created', { userId: newUser.id });
    } catch (error) {
      logger.error('Error creating initial portfolio', { 
        error: error.message,
        userId: newUser.id 
      });
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
          ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1',
          user_agent: event.headers['user-agent'],
          created_at: new Date().toISOString()
        });
      logger.debug('Registration activity logged', { userId: newUser.id });
    } catch (error) {
      logger.error('Error logging registration activity', { 
        error: error.message,
        userId: newUser.id 
      });
      // Non bloccare la registrazione per questo errore
    }

    logger.info('User registration completed successfully', { 
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
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
      })
    };

  } catch (error) {
    logger.error('Registration error', { 
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Errore interno del server durante la registrazione',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}

export const handler = withCors(registerUser);

