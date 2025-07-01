import jwt from 'jsonwebtoken'

export function requireAuth(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token di autenticazione richiesto' })
    return null
  }
  const token = authHeader.substring(7)
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
  try {
    const decoded = jwt.verify(token, jwtSecret)
    return decoded
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token non valido' })
    return null
  }
}
