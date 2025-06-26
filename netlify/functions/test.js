// Netlify Function format
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'SolCraft Nexus API Test funziona perfettamente su Netlify!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      platform: 'Netlify Functions',
      status: 'All systems operational'
    })
  }
}

