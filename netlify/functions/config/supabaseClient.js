import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase per Solcraft Nexus
const supabaseUrl = 'https://dtzlkcqddjaoubrjnzjw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDkzMTU0OCwiZXhwIjoyMDY2NTA3NTQ4fQ.tZg8eN3D6Jiy_L6u70DdQzdMA5CM8ix6VYcktnYYi7w';

// Client Supabase con service role per operazioni backend
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client Supabase pubblico per frontend
export const supabaseClient = createClient(
  supabaseUrl, 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzE1NDgsImV4cCI6MjA2NjUwNzU0OH0.eYJhbGc1OjJIUzI1NiIsInR5cCI6IkpXVCJ9'
);

// Utility per gestire errori di connessione
export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);
  
  if (error.message?.includes('paused') || error.message?.includes('inactive')) {
    return {
      success: false,
      error: 'Database temporaneamente non disponibile. Il progetto Supabase è in pausa. Riattivazione richiesta.',
      code: 'PROJECT_PAUSED',
      retry: true
    };
  }
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      success: false,
      error: 'Errore di connessione al database. Riprova tra qualche istante.',
      code: 'NETWORK_ERROR',
      retry: true
    };
  }
  
  return {
    success: false,
    error: error.message || 'Errore database sconosciuto',
    code: 'UNKNOWN_ERROR',
    retry: false
  };
};

// Test connessione database
export const testConnection = async () => {
  try {
    const { data, error } = await supabaseClient
      .from('portfolios')
      .select('count')
      .limit(1);
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return {
      success: true,
      message: 'Connessione Supabase attiva',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export default supabaseClient;

