const Sentry = require('./utils/sentry.js');
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
    const response = {
      success: true,
      message: 'SolCraft Nexus API - Netlify Functions Working!',
      environment: 'netlify-functions',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      headers_received: Object.keys(event.headers || {}),
      query_params: event.queryStringParameters || {},
      system_info: {
        node_version: process.version,
        platform: process.platform,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime()
      },
      netlify_context: {
        function_name: context.functionName,
        function_version: context.functionVersion,
        request_id: context.awsRequestId,
        remaining_time: context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 'N/A'
      },
      api_status: {
        redis_available: !!process.env.UPSTASH_REDIS_REST_URL,
        environment_vars: {
          redis_url_configured: !!process.env.UPSTASH_REDIS_REST_URL,
          redis_token_configured: !!process.env.UPSTASH_REDIS_REST_TOKEN,
          node_env: process.env.NODE_ENV || 'development'
        }
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('Test Simple API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

