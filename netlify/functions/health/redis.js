const { Redis } = require('@upstash/redis');

exports.handler = async (event, context) => {
  // Gestione CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gestione preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Configurazione Redis Upstash
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || 'https://trusted-grackle-16855.upstash.io',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || 'AkHXAAIgcDHtRT0JFBE_i6iQG_9O9zIKlH3arFQzSZbEaotOjnQlcw'
    });

    // Test connessione Redis
    const startTime = Date.now();
    const pingResult = await redis.ping();
    const responseTime = Date.now() - startTime;

    // Test operazioni CRUD
    const testKey = `health_check_${Date.now()}`;
    const testValue = 'netlify_test_value';
    
    await redis.set(testKey, testValue, { ex: 60 }); // TTL 60 secondi
    const getValue = await redis.get(testKey);
    await redis.del(testKey);

    const healthStatus = {
      success: true,
      status: 'healthy',
      service: 'redis-upstash',
      environment: 'netlify-functions',
      tests: {
        ping: {
          result: pingResult,
          response_time_ms: responseTime,
          status: pingResult === 'PONG' ? 'pass' : 'fail'
        },
        crud_operations: {
          set: 'pass',
          get: getValue === testValue ? 'pass' : 'fail',
          delete: 'pass',
          status: getValue === testValue ? 'pass' : 'fail'
        }
      },
      performance: {
        ping_latency_ms: responseTime,
        performance_grade: responseTime < 50 ? 'excellent' : responseTime < 100 ? 'good' : 'fair'
      },
      timestamp: new Date().toISOString(),
      uptime_check: true
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthStatus)
    };

  } catch (error) {
    console.error('Redis Health Check Error:', error);
    
    const errorResponse = {
      success: false,
      status: 'unhealthy',
      service: 'redis-upstash',
      environment: 'netlify-functions',
      error: {
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      },
      troubleshooting: {
        check_environment_variables: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
        verify_redis_service: 'https://console.upstash.com/',
        common_issues: [
          'Invalid Redis URL or token',
          'Network connectivity issues',
          'Redis service downtime'
        ]
      }
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};

