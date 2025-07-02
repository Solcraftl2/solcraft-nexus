import { logger } from '../utils/logger.js';
import { withCors } from '../utils/cors.js';

async function systemHealthCheck(event, context) {
  try {
    logger.info('Starting system health check', { 
      timestamp: new Date().toISOString(),
      functionName: context.functionName,
      requestId: context.awsRequestId
    });

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const systemStatus = {
      success: true,
      service: 'solcraft-nexus-system',
      environment: 'netlify-functions',
      timestamp: new Date().toISOString(),
      system_info: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        memory_usage: memoryUsage,
        uptime_seconds: uptime,
        pid: process.pid
      },
      environment_variables: {
        node_env: process.env.NODE_ENV || 'development',
        supabase_configured: {
          url: !!process.env.SUPABASE_URL,
          service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          anon_key: !!process.env.SUPABASE_ANON_KEY
        },
        redis_configured: {
          url: !!process.env.UPSTASH_REDIS_REST_URL,
          token: !!process.env.UPSTASH_REDIS_REST_TOKEN
        },
        jwt_configured: !!process.env.JWT_SECRET,
        netlify_context: {
          deploy_id: process.env.DEPLOY_ID || 'local',
          context: process.env.CONTEXT || 'dev',
          branch: process.env.BRANCH || 'main',
          commit_ref: process.env.COMMIT_REF || 'unknown'
        }
      },
      netlify_function_info: {
        function_name: context.functionName,
        function_version: context.functionVersion,
        request_id: context.awsRequestId,
        remaining_time_ms: context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 'N/A',
        memory_limit_mb: context.memoryLimitInMB || 'N/A'
      },
      request_info: {
        method: event.httpMethod,
        path: event.path,
        query_params: event.queryStringParameters || {},
        headers_count: Object.keys(event.headers || {}).length,
        user_agent: event.headers ? event.headers['user-agent'] : 'N/A'
      },
      health_checks: {
        basic_functionality: 'pass',
        environment_setup: 'pass',
        memory_status: memoryUsage.heapUsed < 100 * 1024 * 1024 ? 'pass' : 'warning', // < 100MB
        uptime_status: uptime > 0 ? 'pass' : 'fail',
        environment_variables: {
          supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'pass' : 'fail',
          redis: !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN ? 'pass' : 'fail',
          jwt: !!process.env.JWT_SECRET ? 'pass' : 'fail'
        }
      }
    };

    logger.info('System health check completed successfully', { 
      memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      uptimeSeconds: uptime,
      environmentChecks: systemStatus.health_checks.environment_variables
    });

    return {
      statusCode: 200,
      body: JSON.stringify(systemStatus, null, 2)
    };

  } catch (error) {
    logger.error('System Health Check Error', { 
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        service: 'solcraft-nexus-system',
        error: {
          message: error.message,
          type: error.constructor.name,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
}

export const handler = withCors(systemHealthCheck);

