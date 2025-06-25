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
      id: `github_${Date.now()}`,
      name: user?.name || 'GitHub User',
      email: user?.email || 'user@github.com',
      avatar: 'https://github.com/identicons/default.png',
      provider: 'github'
    }

    const token = Buffer.from(JSON.stringify({
      userId: mockUser.id,
      email: mockUser.email,
      provider: 'github',
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
    })).toString('base64')

    return res.status(200).json({
      success: true,
      message: 'Login GitHub completato!',
      user: mockUser,
      token: token
    })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

