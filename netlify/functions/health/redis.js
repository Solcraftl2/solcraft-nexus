import { logger } from '../utils/logger.js';
import { withCors } from '../utils/cors.js';
import { Redis } from '@upstash/redis';

async function redisHealthCheck(event, context) {
  try {
    logger.info('Starting Redis health check', { 
      timestamp: new Date().toISOString(),
      environment: 'netlify-functions'
    });

    // Configurazione Redis Upstash
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });

    // Test connessione Redis
    const startTime = Date.now();
    const pingResult = await redis.ping();
    const responseTime = Date.now() - startTime;

    logger.debug('Redis ping completed', { 
      result: pingResult, 
      responseTime: `${responseTime}ms` 
    });

    // Test operazioni CRUD
    const testKey = `health_check_${Date.now()}`;
    const testValue = 'netlify_test_value';
    
    await redis.set(testKey, testValue, { ex: 60 }); // TTL 60 secondi
    const getValue = await redis.get(testKey);
    await redis.del(testKey);

    const crudSuccess = getValue === testValue;
    
    logger.debug('Redis CRUD test completed', { 
      testKey, 
      success: crudSuccess 
    });

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
          get: crudSuccess ? 'pass' : 'fail',
          delete: 'pass',
          status: crudSuccess ? 'pass' : 'fail'
        }
      },
      performance: {
        ping_latency_ms: responseTime,
        performance_grade: responseTime < 50 ? 'excellent' : responseTime < 100 ? 'good' : 'fair'
      },
      timestamp: new Date().toISOString(),
      uptime_check: true
    };

    logger.info('Redis health check completed successfully', { 
      status: healthStatus.status,
      responseTime: `${responseTime}ms`,
      performanceGrade: healthStatus.performance.performance_grade
    });

    return {
      statusCode: 200,
      body: JSON.stringify(healthStatus)
    };

  } catch (error) {
    logger.error('Redis Health Check Error', { 
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
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
      body: JSON.stringify(errorResponse)
    };
  }
}

export const handler = withCors(redisHealthCheck);

