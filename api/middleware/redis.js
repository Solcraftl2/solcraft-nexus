import redisService from '../config/redis.js';

// Middleware per inizializzazione Redis
export const initializeRedis = async (req, res, next) => {
  try {
    if (!redisService.isConnected) {
      await redisService.initialize();
    }
    req.redis = redisService;
    next();
  } catch (error) {
    console.error('Redis initialization failed:', error);
    // Continue without Redis if it fails
    req.redis = null;
    next();
  }
};

// Middleware per caching automatico delle risposte API
export const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyGenerator ? 
        keyGenerator(req) : 
        `api_cache:${req.originalUrl || req.url}:${JSON.stringify(req.query)}`;

      // Try to get from cache
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          ...cached,
          _cached: true,
          _cache_timestamp: cached._timestamp
        });
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache successful responses
        if (res.statusCode === 200) {
          const cacheData = {
            ...data,
            _timestamp: new Date().toISOString()
          };
          redisService.set(cacheKey, cacheData, ttl).catch(console.error);
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Middleware per rate limiting
export const rateLimitMiddleware = (options = {}) => {
  const {
    limit = 100,
    window = 3600,
    keyGenerator = (req) => req.ip || 'anonymous',
    message = 'Rate limit exceeded'
  } = options;

  return async (req, res, next) => {
    try {
      const identifier = keyGenerator(req);
      const allowed = await redisService.checkRateLimit(identifier, limit, window);
      
      if (!allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: message,
          limit: limit,
          window: window
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Allow request if rate limiting fails
      next();
    }
  };
};

// Middleware per gestione sessioni
export const sessionMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (sessionId) {
      const sessionData = await redisService.getUserSession(sessionId);
      if (sessionData) {
        req.session = sessionData;
        req.sessionId = sessionId;
      }
    }
    
    // Helper per salvare sessione
    req.saveSession = async (data) => {
      const sessionId = req.sessionId || generateSessionId();
      await redisService.setUserSession(sessionId, data);
      return sessionId;
    };
    
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next();
  }
};

// Helper per generare session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware per cache invalidation
export const invalidateCacheMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Override res.json to invalidate cache after successful operations
    const originalJson = res.json;
    res.json = function(data) {
      // Invalidate cache for successful write operations
      if (res.statusCode === 200 && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        patterns.forEach(pattern => {
          invalidateCachePattern(pattern, req).catch(console.error);
        });
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Helper per invalidare cache con pattern
async function invalidateCachePattern(pattern, req) {
  try {
    // Simple pattern matching - in production use more sophisticated approach
    const keys = await redisService.client?.keys(pattern) || [];
    for (const key of keys) {
      await redisService.del(key);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

// Middleware per health check Redis
export const redisHealthMiddleware = async (req, res, next) => {
  if (req.path === '/health/redis') {
    try {
      const health = await redisService.healthCheck();
      return res.status(200).json({
        redis: health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        redis: { status: 'error', error: error.message },
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
};

// Configurazioni predefinite per diversi tipi di API
export const apiCacheConfigs = {
  // Cache per dati statici (lunga durata)
  static: { ttl: 3600 * 24, keyGenerator: (req) => `static:${req.url}` },
  
  // Cache per prezzi (breve durata)
  prices: { ttl: 300, keyGenerator: (req) => `prices:${req.url}:${Date.now() - Date.now() % 300000}` },
  
  // Cache per portfolio (media durata)
  portfolio: { ttl: 600, keyGenerator: (req) => `portfolio:${req.params.address || req.query.address}` },
  
  // Cache per transazioni (lunga durata)
  transactions: { ttl: 3600, keyGenerator: (req) => `tx:${req.params.hash || req.query.hash}` }
};

// Rate limiting configurations
export const rateLimitConfigs = {
  // Standard API rate limiting
  standard: { limit: 100, window: 3600 },
  
  // Strict rate limiting per operazioni critiche
  strict: { limit: 10, window: 3600 },
  
  // Permissive per operazioni di lettura
  permissive: { limit: 1000, window: 3600 },
  
  // Per utenti autenticati
  authenticated: { 
    limit: 500, 
    window: 3600,
    keyGenerator: (req) => `user:${req.user?.id || req.ip}`
  }
};

export default {
  initializeRedis,
  cacheMiddleware,
  rateLimitMiddleware,
  sessionMiddleware,
  invalidateCacheMiddleware,
  redisHealthMiddleware,
  apiCacheConfigs,
  rateLimitConfigs
};

