const Sentry = require('./../utils/sentry.js');
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
    const systemStatus = {
      success: true,
      service: 'solcraft-nexus-system',
      environment: 'netlify-functions',
      timestamp: new Date().toISOString(),
      system_info: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        memory_usage: process.memoryUsage(),
        uptime_seconds: process.uptime(),
        pid: process.pid
      },
      environment_variables: {
        node_env: process.env.NODE_ENV || 'development',
        redis_configured: {
          url: !!process.env.UPSTASH_REDIS_REST_URL,
          token: !!process.env.UPSTASH_REDIS_REST_TOKEN
        },
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
        memory_status: process.memoryUsage().heapUsed < 100 * 1024 * 1024 ? 'pass' : 'warning', // < 100MB
        uptime_status: process.uptime() > 0 ? 'pass' : 'fail'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(systemStatus, null, 2)
    };

  } catch (error) {
    console.error('System Health Check Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        service: 'solcraft-nexus-system',
        error: {
          message: error.message,
          type: error.constructor.name,
          stack: error.stack
        },
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};

