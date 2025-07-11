import { logger } from '../utils/logger.js';
import { Redis } from '@upstash/redis';
import { createClient } from 'redis';

// Configurazione Redis per caching e sessioni
class RedisService {
  constructor() {
    this.client = null;
    this.upstashClient = null;
    this.isConnected = false;
  }

  // Inizializzazione Redis
  async initialize() {
    try {
      // Configurazione Upstash Redis (per produzione)
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        this.upstashClient = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        
        // Test connessione Upstash
        await this.upstashClient.ping();
        this.isConnected = true;
        logger.info('✅ Upstash Redis connected successfully');
        return;
      }

      // Fallback a Redis locale per sviluppo
      if (process.env.REDIS_URL) {
        this.client = createClient({
          url: process.env.REDIS_URL,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              return new Error('Redis server connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        this.client.on('error', (err) => {
          logger.error('Redis Client Error:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          logger.info('✅ Redis connected successfully');
          this.isConnected = true;
        });

        await this.client.connect();
      } else {
        logger.warn('⚠️ No Redis configuration found, using in-memory cache');
        this.isConnected = false;
      }
    } catch (error) {
      logger.error('❌ Redis initialization failed:', error);
      this.isConnected = false;
    }
  }

  // Operazioni Cache
  async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (this.upstashClient) {
        if (ttl) {
          await this.upstashClient.setex(key, ttl, serializedValue);
        } else {
          await this.upstashClient.set(key, serializedValue);
        }
      } else if (this.client && this.isConnected) {
        if (ttl) {
          await this.client.setEx(key, ttl, serializedValue);
        } else {
          await this.client.set(key, serializedValue);
        }
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      let value;
      
      if (this.upstashClient) {
        value = await this.upstashClient.get(key);
      } else if (this.client && this.isConnected) {
        value = await this.client.get(key);
      }
      
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      if (this.upstashClient) {
        await this.upstashClient.del(key);
      } else if (this.client && this.isConnected) {
        await this.client.del(key);
      }
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (this.upstashClient) {
        return await this.upstashClient.exists(key);
      } else if (this.client && this.isConnected) {
        return await this.client.exists(key);
      }
      return false;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // Operazioni specifiche per SolCraft Nexus
  
  // Cache prezzi token
  async cacheTokenPrice(tokenSymbol, price, ttl = 300) {
    const key = `token_price:${tokenSymbol}`;
    return await this.set(key, { price, timestamp: Date.now() }, ttl);
  }

  async getTokenPrice(tokenSymbol) {
    const key = `token_price:${tokenSymbol}`;
    return await this.get(key);
  }

  // Cache dati portfolio
  async cachePortfolio(userAddress, portfolioData, ttl = 600) {
    const key = `portfolio:${userAddress}`;
    return await this.set(key, portfolioData, ttl);
  }

  async getPortfolio(userAddress) {
    const key = `portfolio:${userAddress}`;
    return await this.get(key);
  }

  // Cache transazioni XRPL
  async cacheTransaction(txHash, txData, ttl = 3600) {
    const key = `tx:${txHash}`;
    return await this.set(key, txData, ttl);
  }

  async getTransaction(txHash) {
    const key = `tx:${txHash}`;
    return await this.get(key);
  }

  // Gestione sessioni utente
  async setUserSession(sessionId, userData, ttl = 86400) {
    const key = `session:${sessionId}`;
    return await this.set(key, userData, ttl);
  }

  async getUserSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async deleteUserSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  // Rate limiting
  async checkRateLimit(identifier, limit = 100, window = 3600) {
    const key = `rate_limit:${identifier}`;
    
    try {
      if (this.upstashClient) {
        const count = await this.upstashClient.incr(key);
        if (count === 1) {
          await this.upstashClient.expire(key, window);
        }
        return count <= limit;
      } else if (this.client && this.isConnected) {
        const count = await this.client.incr(key);
        if (count === 1) {
          await this.client.expire(key, window);
        }
        return count <= limit;
      }
      return true; // Allow if Redis not available
    } catch (error) {
      logger.error('Rate limit check error:', error);
      return true; // Allow on error
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (this.upstashClient) {
        await this.upstashClient.ping();
        return { status: 'healthy', type: 'upstash' };
      } else if (this.client && this.isConnected) {
        await this.client.ping();
        return { status: 'healthy', type: 'local' };
      }
      return { status: 'disconnected', type: 'none' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Cleanup
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
      }
      this.isConnected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Redis disconnect error:', error);
    }
  }
}

// Singleton instance
const redisService = new RedisService();

export default redisService;

// Helper functions per le API
export const withCache = (ttl = 3600) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache result
      await redisService.set(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
};

// Rate limiting middleware
export const rateLimitMiddleware = (limit = 100, window = 3600) => {
  return async (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const allowed = await redisService.checkRateLimit(identifier, limit, window);
    
    if (!allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${limit} per ${window} seconds`
      });
    }
    
    next();
  };
};

