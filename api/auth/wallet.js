// Vercel Serverless Function for Wallet Authentication
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'POST') {
      const { address, type, chainId } = req.body

      // Validate wallet address
      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address is required'
        })
      }

      // Validate address format (basic validation)
      const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(address)
      const isValidXRPAddress = /^r[a-zA-Z0-9]{24,34}$/.test(address)
      
      if (!isValidEthAddress && !isValidXRPAddress) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address format'
        })
      }

      // Create user data from wallet
      const userData = {
        id: `wallet_${address.slice(0, 10)}`,
        name: `${type || 'Wallet'} ${address.slice(0, 6)}...${address.slice(-4)}`,
        email: `${address.slice(0, 10)}@wallet.local`,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        address: address,
        authMethod: 'wallet',
        walletType: type || 'Unknown',
        chainId: chainId
      }

      // Generate JWT token (simplified for demo)
      const token = Buffer.from(JSON.stringify({
        userId: userData.id,
        address: address,
        walletType: type,
        chainId: chainId,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })).toString('base64')

      return res.status(200).json({
        success: true,
        message: 'Wallet autenticato con successo!',
        user: userData,
        token: token
      })
    }

    // Handle GET requests
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Wallet Authentication API endpoint',
        supportedWallets: ['MetaMask', 'Web3Auth', 'XRPL', 'WalletConnect']
      })
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })

  } catch (error) {
    console.error('Wallet authentication API error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}

