const { parse } = require('querystring');

// Helper per compatibilità Vercel -> Netlify
export function createReqRes(event) {
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
