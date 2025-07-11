import { logger } from '../utils/logger.js';

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

import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase per API Backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Validazione variabili di ambiente richieste
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
}

// Client Supabase per operazioni backend
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility functions per operazioni comuni
export const handleSupabaseError = (error, operation) => {
  logger.error(`Supabase error in ${operation}:`, error);
  return {
    success: false,
    error: error.message || 'Database operation failed',
    details: error.details || null
  };
};

export const validateSupabaseResponse = (data, error, operation) => {
  if (error) {
    throw new Error(`${operation} failed: ${error.message}`);
  }
  return data;
};

// Funzioni helper per tabelle specifiche
export const insertUser = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();
  
  return validateSupabaseResponse(data, error, 'Insert user');
};

export const getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    throw new Error(`Get user by email failed: ${error.message}`);
  }
  
  return data;
};

export const insertAsset = async (assetData) => {
  const { data, error } = await supabase
    .from('assets')
    .insert(assetData)
    .select()
    .single();
  
  return validateSupabaseResponse(data, error, 'Insert asset');
};

export const insertToken = async (tokenData) => {
  const { data, error } = await supabase
    .from('tokens')
    .insert(tokenData)
    .select()
    .single();
  
  return validateSupabaseResponse(data, error, 'Insert token');
};

export const insertTransaction = async (transactionData) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();
  
  return validateSupabaseResponse(data, error, 'Insert transaction');
};

export const getUserPortfolio = async (userId) => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      assets(name, symbol, token_price, asset_categories(name, icon))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return validateSupabaseResponse(data, error, 'Get user portfolio');
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  
  return validateSupabaseResponse(data, error, 'Update user profile');
};

export default supabase;

