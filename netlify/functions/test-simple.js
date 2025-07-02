import { withCors } from './utils/cors.js';
import logger from './utils/logger.js';

/**
 * Funzione di test semplice per SolCraft Nexus
 * Verifica il funzionamento delle Netlify Functions
 */
const testHandler = async (event, context) => {
  try {
    logger.info('Test API called', { 
      method: event.httpMethod, 
      path: event.path 
    });

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
          supabase_configured: !!process.env.SUPABASE_URL,
          jwt_configured: !!process.env.JWT_SECRET,
          node_env: process.env.NODE_ENV || 'development'
        }
      }
    };

    logger.info('Test API response generated', { 
      success: true, 
      environment: response.environment 
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    logger.error('Test API error', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Esporta con CORS wrapper
export const handler = withCors(testHandler);

