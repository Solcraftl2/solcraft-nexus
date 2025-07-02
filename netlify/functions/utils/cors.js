/**
 * Configurazione CORS sicura per SolCraft Nexus
 * Sostituisce la configurazione permissiva con controlli specifici
 */

// Domini autorizzati per CORS
const getAllowedOrigins = () => {
  const production = [
    'https://solcraft-nexus-production.netlify.app',
    'https://solcraft-nexus.netlify.app'
  ];

  const development = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8888',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];

  // Aggiungi domini custom da environment variables
  const customOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : [];

  if (process.env.NODE_ENV === 'production') {
    return [...production, ...customOrigins];
  } else {
    return [...production, ...development, ...customOrigins];
  }
};

/**
 * Genera headers CORS sicuri basati sull'origin della richiesta
 * @param {Object} event - Evento Netlify Functions
 * @returns {Object} Headers CORS configurati
 */
export const getCorsHeaders = (event) => {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = event.headers.origin || event.headers.Origin;
  
  // Determina l'origin da utilizzare
  let corsOrigin = null;
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    corsOrigin = requestOrigin;
  } else if (process.env.NODE_ENV === 'development') {
    // In development, permetti localhost anche se non esattamente nella lista
    if (requestOrigin && (
      requestOrigin.startsWith('http://localhost:') ||
      requestOrigin.startsWith('http://127.0.0.1:')
    )) {
      corsOrigin = requestOrigin;
    }
  }
  
  // Se nessun origin valido, usa il primo della lista (fallback sicuro)
  if (!corsOrigin) {
    corsOrigin = allowedOrigins[0];
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 ore
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
};

/**
 * Gestisce richieste preflight OPTIONS
 * @param {Object} event - Evento Netlify Functions
 * @returns {Object} Risposta per preflight
 */
export const handlePreflight = (event) => {
  return {
    statusCode: 200,
    headers: getCorsHeaders(event),
    body: ''
  };
};

/**
 * Wrapper per funzioni API con CORS automatico
 * @param {Function} handler - Handler della funzione API
 * @returns {Function} Handler wrappato con CORS
 */
export const withCors = (handler) => {
  return async (event, context) => {
    // Gestione preflight
    if (event.httpMethod === 'OPTIONS') {
      return handlePreflight(event);
    }

    try {
      // Esegui l'handler originale
      const result = await handler(event, context);
      
      // Aggiungi headers CORS alla risposta
      const corsHeaders = getCorsHeaders(event);
      
      return {
        ...result,
        headers: {
          ...corsHeaders,
          ...result.headers
        }
      };
    } catch (error) {
      // Gestione errori con CORS
      const corsHeaders = getCorsHeaders(event);
      
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: process.env.NODE_ENV === 'production' 
            ? 'Errore interno del server'
            : error.message
        })
      };
    }
  };
};

/**
 * Valida se un origin è autorizzato
 * @param {string} origin - Origin da validare
 * @returns {boolean} True se autorizzato
 */
export const isOriginAllowed = (origin) => {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

/**
 * Log delle richieste CORS per debugging
 * @param {Object} event - Evento Netlify Functions
 * @param {boolean} allowed - Se la richiesta è stata autorizzata
 */
export const logCorsRequest = (event, allowed) => {
  if (process.env.NODE_ENV !== 'production' && process.env.LOG_CORS === 'true') {
    console.log(`[CORS] ${event.httpMethod} ${event.path}`, {
      origin: event.headers.origin,
      allowed,
      userAgent: event.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }
};

export default {
  getCorsHeaders,
  handlePreflight,
  withCors,
  isOriginAllowed,
  logCorsRequest
};

