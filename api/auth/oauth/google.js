export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const { provider, user } = req.body

    const mockUser = {
      id: `google_${Date.now()}`,
      name: user?.name || 'Google User',
      email: user?.email || 'user@gmail.com',
      avatar: 'https://lh3.googleusercontent.com/a/default-user',
      provider: 'google'
    }

    const token = Buffer.from(JSON.stringify({
      userId: mockUser.id,
      email: mockUser.email,
      provider: 'google',
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
    })).toString('base64')

    return res.status(200).json({
      success: true,
      message: 'Login Google completato!',
      user: mockUser,
      token: token
    })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

