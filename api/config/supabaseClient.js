import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase per API Backend
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

// Client Supabase per operazioni backend
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility functions per operazioni comuni
export const handleSupabaseError = (error, operation) => {
  console.error(`Supabase error in ${operation}:`, error);
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

