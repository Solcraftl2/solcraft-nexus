import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET to retrieve tokens.'
    })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione richiesto'
      })
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development'

    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch {
      return res.status(401).json({ success: false, error: 'Token non valido' })
    }

    const { tokenId, symbol, limit = 50, offset = 0 } = req.query

    let query = supabase.from('tokens').select('*').eq('creator_id', decoded.userId)

    if (tokenId) {
      const { data, error } = await query.eq('id', tokenId).single()
      if (error) {
        console.error('Supabase fetch error:', error)
        return res.status(500).json({ success: false, error: 'Errore nel recupero del token' })
      }
      return res.status(200).json({ success: true, token: data })
    }

    if (symbol) query = query.eq('token_symbol', symbol)

    const start = parseInt(offset)
    const end = start + parseInt(limit) - 1
    const { data, error } = await query.range(start, end)

    if (error) {
      console.error('Supabase fetch error:', error)
      return res.status(500).json({ success: false, error: 'Errore nel recupero dei token' })
    }

    return res.status(200).json({
      success: true,
      tokens: data,
      pagination: { limit: parseInt(limit), offset: parseInt(offset) }
    })
  } catch (error) {
    console.error('Token list error:', error)
    return res.status(500).json({ success: false, error: 'Errore interno del server', message: error.message })
  }
}
