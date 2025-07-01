import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use GET for health check.' 
    });
  }

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis environment variables not configured');
    }

    // Configurazione Redis con credenziali Upstash
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });

    const startTime = Date.now();
    
    // Test ping
    const pingResult = await redis.ping();
    const pingTime = Date.now() - startTime;
    
    // Test set/get per verificare funzionalità complete
    const testKey = `health_check_${Date.now()}`;
    const testValue = { 
      timestamp: new Date().toISOString(),
      test: 'health_check'
    };
    
    const setStartTime = Date.now();
    await redis.set(testKey, JSON.stringify(testValue), { ex: 30 });
    const setTime = Date.now() - setStartTime;
    
    const getStartTime = Date.now();
    const retrievedValue = await redis.get(testKey);
    const getTime = Date.now() - getStartTime;
    
    // Cleanup
    await redis.del(testKey);
    
    // Verifica che il valore sia stato recuperato correttamente
    const parsedValue = JSON.parse(retrievedValue);
    const isDataIntact = parsedValue.test === 'health_check';
    
    return res.status(200).json({
      status: 'healthy',
      redis: {
        connection: 'active',
        ping: pingResult,
        data_integrity: isDataIntact,
        performance: {
          ping_ms: pingTime,
          set_ms: setTime,
          get_ms: getTime,
          total_ms: Date.now() - startTime
        }
      },
      configuration: {
        url: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'missing',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'configured' : 'missing'
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('Redis health check failed:', error);
    
    return res.status(500).json({
      status: 'unhealthy',
      redis: {
        connection: 'failed',
        error: error.message
      },
      configuration: {
        url: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'missing',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'configured' : 'missing'
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
}

