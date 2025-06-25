export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    const { address, type } = req.body

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      })
    }

    const mockUser = {
      id: `wallet_${Date.now()}`,
      name: `${type || 'Wallet'} User`,
      address: address,
      provider: 'wallet',
      walletType: type || 'MetaMask'
    }

    const token = Buffer.from(JSON.stringify({
      userId: mockUser.id,
      address: mockUser.address,
      provider: 'wallet',
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
    })).toString('base64')

    return res.status(200).json({
      success: true,
      message: 'Wallet connesso con successo!',
      user: mockUser,
      token: token
    })
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}

