/**
 * Sistema di logging strutturato per SolCraft Nexus
 * Sostituisce console.log con logging controllato per ambiente
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const getCurrentLogLevel = () => {
  const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
  return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.INFO;
};

const formatMessage = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    environment: process.env.NODE_ENV || 'development',
    function: process.env.AWS_LAMBDA_FUNCTION_NAME || 'local'
  };

  if (data) {
    logEntry.data = data;
  }

  return logEntry;
};

const logger = {
  error: (message, error = null) => {
    const logEntry = formatMessage('ERROR', message, error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null);
    
    console.error(JSON.stringify(logEntry));
  },

  warn: (message, data = null) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.WARN) {
      const logEntry = formatMessage('WARN', message, data);
      console.warn(JSON.stringify(logEntry));
    }
  },

  info: (message, data = null) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.INFO) {
      const logEntry = formatMessage('INFO', message, data);
      
      // In produzione, usa console.log per info
      if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify(logEntry));
      } else {
        console.log(`[INFO] ${message}`, data || '');
      }
    }
  },

  debug: (message, data = null) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.DEBUG && process.env.NODE_ENV !== 'production') {
      const logEntry = formatMessage('DEBUG', message, data);
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },

  // Metodo per logging di audit/security
  audit: (action, userId, details = null) => {
    const auditEntry = formatMessage('AUDIT', `User action: ${action}`, {
      userId,
      action,
      details,
      ip: process.env.CLIENT_IP || 'unknown',
      userAgent: process.env.USER_AGENT || 'unknown'
    });
    
    console.log(JSON.stringify(auditEntry));
  },

  // Metodo per performance monitoring
  performance: (operation, duration, details = null) => {
    if (getCurrentLogLevel() >= LOG_LEVELS.INFO) {
      const perfEntry = formatMessage('PERFORMANCE', `Operation: ${operation}`, {
        operation,
        duration: `${duration}ms`,
        details
      });
      
      console.log(JSON.stringify(perfEntry));
    }
  }
};

export { logger };
export default logger;

// Helper per misurare performance
export const measurePerformance = (operation) => {
  const start = Date.now();
  
  return {
    end: (details = null) => {
      const duration = Date.now() - start;
      logger.performance(operation, duration, details);
      return duration;
    }
  };
};

// Helper per error handling strutturato
export const handleApiError = (error, context, userId = null) => {
  const errorId = Date.now().toString(36);
  
  logger.error(`[${errorId}] ${context}`, {
    errorId,
    context,
    userId,
    message: error.message,
    stack: error.stack
  });

  return {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Si è verificato un errore interno'
      : error.message,
    errorId: process.env.NODE_ENV === 'production' ? errorId : undefined
  };
};

