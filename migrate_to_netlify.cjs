const fs = require('fs');
const path = require('path');

// Funzione per convertire API Vercel a Netlify Functions
function convertToNetlifyFunction(content, filePath) {
  // Sostituisce export default con exports.handler
  let converted = content.replace(
    /export default async function handler\(req, res\)/g,
    'exports.handler = async (event, context)'
  );
  
  // Aggiunge helper per compatibilità req/res
  const netlifyWrapper = `
const { parse } = require('querystring');

// Helper per compatibilità Vercel -> Netlify
function createReqRes(event) {
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

`;
  
  // Aggiunge wrapper e modifica la funzione handler
  converted = netlifyWrapper + converted.replace(
    'exports.handler = async (event, context)',
    `exports.handler = async (event, context) => {
  const { req, res } = createReqRes(event);
  
  try {
    await originalHandler(req, res);
    
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: res.headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function originalHandler(req, res)`
  );
  
  return converted;
}

// Migra tutte le API
function migrateAPIs() {
  const apiDir = './api';
  const netlifyDir = './netlify/functions';
  
  function processDirectory(dir, targetDir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const newTargetDir = path.join(targetDir, item);
        if (!fs.existsSync(newTargetDir)) {
          fs.mkdirSync(newTargetDir, { recursive: true });
        }
        processDirectory(fullPath, newTargetDir);
      } else if (item.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const converted = convertToNetlifyFunction(content, fullPath);
        
        // Mantiene la struttura delle directory
        const relativePath = path.relative(apiDir, fullPath);
        const targetPath = path.join(netlifyDir, relativePath);
        const targetDirPath = path.dirname(targetPath);
        
        if (!fs.existsSync(targetDirPath)) {
          fs.mkdirSync(targetDirPath, { recursive: true });
        }
        
        fs.writeFileSync(targetPath, converted);
        console.log('Migrated: ' + fullPath + ' -> ' + targetPath);
      }
    });
  }
  
  processDirectory(apiDir, netlifyDir);
  console.log('Migration completed!');
}

migrateAPIs();

