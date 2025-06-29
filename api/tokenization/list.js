import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    let query = supabase.from('tokens').select('*')
    const { id, issuer } = req.query
    if (id) {
      query = query.eq('id', id)
    }
    if (issuer) {
      query = query.eq('issuer', issuer)
    }

    const { data, error } = await query

    if (error) {
      console.error('Token fetch error:', error)
      return res.status(500).json({ success: false, error: 'Errore recupero token', details: error.message })
    }

    return res.status(200).json({ success: true, tokens: data })
  } catch (error) {
    console.error('Token list API error:', error)
    return res.status(500).json({ success: false, error: 'Errore interno del server', message: error.message })
  }
}
