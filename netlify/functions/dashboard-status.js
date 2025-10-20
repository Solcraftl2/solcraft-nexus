const fetch = global.fetch;

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'http://localhost:8888';
    const res = await fetch(`${baseUrl}/dashboard`);
    const ok = res.ok;
    return {
      statusCode: ok ? 200 : res.status,
      headers,
      body: JSON.stringify({
        success: ok,
        message: ok ? '/dashboard loaded successfully' : `Failed to load /dashboard: ${res.status}`,
        status: res.status
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
