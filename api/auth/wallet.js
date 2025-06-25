export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const { address, signature, message, type, chainId, publicKey } = req.body

      if (!address) {
        return res.status(400).json({
          success: false,
          error: 'Indirizzo wallet è richiesto'
        })
      }

      // Validate wallet address format
      let isValidAddress = false
      let walletType = type || 'unknown'

      // Ethereum/MetaMask address validation
      if (address.startsWith('0x') && address.length === 42) {
        isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address)
        walletType = 'ethereum'
      }
      // XRP Ledger address validation  
      else if (address.startsWith('r') && address.length >= 25 && address.length <= 34) {
        // Basic XRP address format validation
        isValidAddress = /^r[1-9A-HJ-NP-Za-km-z]{25,33}$/.test(address)
        walletType = 'xrp'
      }

      if (!isValidAddress) {
        return res.status(400).json({
          success: false,
          error: 'Formato indirizzo wallet non valido'
        })
      }

      // In a real implementation, you would:
      // 1. Verify the signature against the message and address
      // 2. Check if the signature was created by the private key of the address
      // 3. Validate the message format and timestamp
      // 4. Create or update user in your database
      // 5. Get wallet balance and transaction history

      let walletData = {
        address: address,
        type: walletType,
        chainId: chainId,
        balance: '0',
        balanceUSD: 0,
        verified: false
      }

      // If signature is provided, verify it (simplified validation)
      if (signature && message) {
        try {
          // In production, you would use proper signature verification libraries
          // For Ethereum: ethers.js or web3.js to verify signature
          // For XRP: xrpl library to verify signature
          
          // For demo purposes, we'll assume signature is valid if provided
          walletData.verified = true
          walletData.signedMessage = message
          walletData.signature = signature
        } catch (error) {
          console.error('Signature verification error:', error)
          walletData.verified = false
        }
      }

      // Try to get wallet balance (in production, use real blockchain APIs)
      try {
        if (walletType === 'ethereum') {
          // For Ethereum, you would use Infura, Alchemy, or similar
          // const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
          // const balance = await provider.getBalance(address)
          walletData.balance = '0.0 ETH'
          walletData.balanceUSD = 0.0
        } else if (walletType === 'xrp') {
          // For XRP, you would use XRPL client
          // const client = new xrpl.Client(XRPL_SERVER)
          // const response = await client.request({command: 'account_info', account: address})
          walletData.balance = '0.0 XRP'
          walletData.balanceUSD = 0.0
        }
      } catch (error) {
        console.error('Balance fetch error:', error)
        // Continue without balance data
      }

      const authenticatedUser = {
        id: `wallet_${Date.now()}`,
        name: `${walletType.toUpperCase()} User`,
        address: address,
        provider: 'wallet',
        walletType: walletType,
        chainId: chainId,
        verified: walletData.verified,
        balance: walletData.balance,
        balanceUSD: walletData.balanceUSD,
        connectedAt: new Date().toISOString()
      }

      // Generate JWT token (in production, use proper JWT library with secret)
      const token = Buffer.from(JSON.stringify({
        userId: authenticatedUser.id,
        address: authenticatedUser.address,
        provider: 'wallet',
        walletType: walletType,
        chainId: chainId,
        verified: walletData.verified,
        iat: Date.now(),
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      })).toString('base64')

      return res.status(200).json({
        success: true,
        message: `Wallet ${walletType.toUpperCase()} connesso con successo!`,
        user: authenticatedUser,
        token: token,
        walletInfo: {
          type: walletType,
          address: address,
          balance: walletData.balance,
          balanceUSD: walletData.balanceUSD,
          verified: walletData.verified,
          chainId: chainId
        }
      })

    } catch (error) {
      console.error('Wallet connection error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server durante la connessione wallet'
      })
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use POST for wallet connection.' 
  })
}

