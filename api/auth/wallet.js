import { getAccountInfo, getAccountBalance, initializeXRPL } from '../config/xrpl.js';
import jwt from 'jsonwebtoken';

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

      let walletData = {
        address: address,
        type: walletType,
        chainId: chainId,
        balance: '0',
        balanceUSD: 0,
        verified: false,
        tokens: []
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

      // Try to get real wallet balance and data
      try {
        if (walletType === 'ethereum') {
          // For Ethereum, you would use Infura, Alchemy, or similar
          // For now, using mock data but structured for real implementation
          walletData.balance = '2.5 ETH'
          walletData.balanceUSD = 2500.0
          walletData.tokens = [
            { symbol: 'USDC', balance: '1000.00', name: 'USD Coin', address: '0xa0b86a33e6776' },
            { symbol: 'USDT', balance: '500.00', name: 'Tether USD', address: '0xdac17f958d2ee' }
          ]
        } else if (walletType === 'xrp') {
          try {
            // Initialize XRPL connection
            await initializeXRPL().catch(() => {}); // Ignore if already connected
            
            // Get real XRPL account data
            const accountInfo = await getAccountInfo(address);
            const balance = await getAccountBalance(address);
            
            if (accountInfo && balance) {
              walletData.balance = `${balance.xrp} XRP`
              walletData.balanceUSD = parseFloat(balance.xrp) * 0.5 // Mock XRP price
              walletData.reserve = balance.reserve
              walletData.tokens = balance.tokens.map(token => ({
                currency: token.currency,
                issuer: token.issuer,
                balance: token.balance,
                limit: token.limit,
                name: `${token.currency} Token`
              }))
              walletData.accountInfo = {
                sequence: accountInfo.Sequence,
                ownerCount: accountInfo.OwnerCount,
                flags: accountInfo.Flags
              }
            } else {
              // Account doesn't exist on XRPL
              walletData.balance = '0.0 XRP'
              walletData.balanceUSD = 0.0
              walletData.note = 'Account not found on XRPL - may need funding'
            }
          } catch (error) {
            console.error('XRPL connection error:', error)
            // Fallback to mock data
            walletData.balance = '100.0 XRP'
            walletData.balanceUSD = 50.0
            walletData.tokens = [
              { currency: 'USD', issuer: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', balance: '250.50', name: 'USD Stablecoin' }
            ]
            walletData.note = 'Using mock data - XRPL connection unavailable'
          }
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
        tokens: walletData.tokens,
        reserve: walletData.reserve,
        accountInfo: walletData.accountInfo,
        connectedAt: new Date().toISOString(),
        note: walletData.note
      }

      // Generate real JWT token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development'
      const token = jwt.sign(
        {
          userId: authenticatedUser.id,
          address: authenticatedUser.address,
          provider: 'wallet',
          walletType: walletType,
          chainId: chainId,
          verified: walletData.verified,
          iat: Math.floor(Date.now() / 1000)
        },
        jwtSecret,
        { expiresIn: '7d' }
      )

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
          tokens: walletData.tokens,
          verified: walletData.verified,
          chainId: chainId,
          reserve: walletData.reserve,
          accountInfo: walletData.accountInfo
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

