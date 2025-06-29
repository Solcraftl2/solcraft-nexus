// Supabase Configuration for SolCraft Nexus
// Integrazione XRPL + Database

const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
}

export default SUPABASE_CONFIG

