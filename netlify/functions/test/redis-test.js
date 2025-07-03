import { logger } from '../utils/logger.js';

const { parse } = require('querystring');

// Helper per compatibilità Vercel -> Netlify
function createReqRes(event) {
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? (event.headers['content-type']?.includes('application/json') ? JSON.parse(event.body) : parse(event.body)) : {},
    query: event.queryStringParameters || {},
    ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1'
  };
  
  const res = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: '',
    
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    json: function(data) {
      this.body = JSON.stringify(data);
      return this;
    },
    
    end: function(data) {
      if (data) this.body = data;
      return this;
    },
    
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    }
  };
  
  return { req, res };
}

import { Redis } from '@upstash/redis';

// Test connessione Redis con le credenziali fornite
async function testRedisConnection() {
  try {
    logger.info('🔄 Testing Redis connection...');
    
    // Configurazione Redis con credenziali Upstash
    const redis = new Redis({
      url: 'https://trusted-grackle-16855.upstash.io',
      token: 'AkHXAAIgcDHtRT0JFBE_i6iQG_9O9zIKlH3arFQzSZbEaotOjnQlcw'
    });
    
    // Test ping
    const pingResult = await redis.ping();
    logger.info('✅ Redis PING result:', pingResult);
    
    // Test set/get
    const testKey = 'solcraft_test_' + Date.now();
    const testValue = { message: 'SolCraft Nexus Redis Test', timestamp: new Date().toISOString() };
    
    await redis.set(testKey, JSON.stringify(testValue), { ex: 60 }); // 60 seconds TTL
    logger.info('✅ Redis SET successful:', testKey);
    
    const retrievedValue = await redis.get(testKey);
    logger.info('✅ Redis GET result:', JSON.parse(retrievedValue));
    
    // Test delete
    await redis.del(testKey);
    logger.info('✅ Redis DEL successful');
    
    // Test rate limiting functionality
    const rateLimitKey = 'rate_limit_test';
    const count1 = await redis.incr(rateLimitKey);
    const count2 = await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, 60);
    logger.info('✅ Redis rate limiting test:', { count1, count2 });
    
    // Cleanup
    await redis.del(rateLimitKey);
    
    logger.info('🎉 All Redis tests passed successfully!');
    
    return {
      status: 'success',
      ping: pingResult,
      connection: 'healthy',
      features: {
        set_get: 'working',
        expiration: 'working',
        rate_limiting: 'working'
      }
    };
    
  } catch (error) {
    logger.error('❌ Redis connection test failed:', error);
    return {
      status: 'error',
      error: error.message,
      connection: 'failed'
    };
  }
}

// Test per verificare configurazione
async function testRedisConfig() {
  logger.info('🔧 Testing Redis configuration...');
  
  const config = {
    url: 'https://trusted-grackle-16855.upstash.io',
    token: 'AkHXAAIgcDHtRT0JFBE_i6iQG_9O9zIKlH3arFQzSZbEaotOjnQlcw',
    redis_url: 'rediss://default:AUHXAAIjcDEwYTMzMjJiZjMyZjE0YmUzYTg5NzZkOTczMzRmY2JlN3AxMA@trusted-grackle-16855.upstash.io:6379'
  };
  
  logger.info('📋 Redis Configuration:');
  logger.info('- REST URL:', config.url);
  logger.info('- Token:', config.token.substring(0, 20) + '...');
  logger.info('- Redis URL:', config.redis_url.substring(0, 50) + '...');
  
  return config;
}

// Esecuzione test se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testRedisConfig();
  testRedisConnection()
    .then(result => {
      logger.info('Final result:', result);
      process.exit(result.status === 'success' ? 0 : 1);
    })
    .catch(error => {
      logger.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testRedisConnection, testRedisConfig };

