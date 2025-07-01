// Supabase Configuration for SolCraft Nexus
// Integrazione XRPL + Database

const SUPABASE_CONFIG = {
  // Values are loaded from environment variables in production
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

export default SUPABASE_CONFIG

