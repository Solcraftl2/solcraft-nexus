import {
  initializeXRPL,
  disconnectXRPL,
  walletFromSeed,
  sendXRPPayment,
  getAccountBalance
} from '../config/xrpl.js'
import { ethers } from 'ethers'
import { requireAuth } from '../middleware/auth.js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      const decoded = requireAuth(req, res)
      if (!decoded) {
        return
      }

      const { 
        toAddress, 
        amount, 
        currency, 
        memo, 
        priority = 'normal'
      } = req.body

      // Validate required fields
      if (!toAddress || !amount || !currency) {
        return res.status(400).json({
          success: false,
          error: 'Indirizzo destinatario, importo e valuta sono richiesti'
        })
      }

      // Validate amount
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Importo non valido'
        })
      }

      // Validate address format
      let isValidAddress = false
      let networkType = 'unknown'

      if (currency.toUpperCase() === 'XRP') {
        // XRP address validation
        if (toAddress.startsWith('r') && toAddress.length >= 25 && toAddress.length <= 34) {
          isValidAddress = /^r[1-9A-HJ-NP-Za-km-z]{25,33}$/.test(toAddress)
          networkType = 'xrp'
        }
      } else if (currency.toUpperCase() === 'ETH' || currency.startsWith('0x')) {
        // Ethereum address validation
        if (toAddress.startsWith('0x') && toAddress.length === 42) {
          isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(toAddress)
          networkType = 'ethereum'
        }
      }

      if (!isValidAddress) {
        return res.status(400).json({
          success: false,
          error: 'Formato indirizzo destinatario non valido'
        })
      }

      // Calculate fees based on priority and network
      let estimatedFee = 0
      let estimatedTime = '2-5 minuti'

      if (networkType === 'xrp') {
        switch (priority) {
          case 'low':
            estimatedFee = 0.00001
            estimatedTime = '5-10 minuti'
            break
          case 'normal':
            estimatedFee = 0.00012
            estimatedTime = '2-5 minuti'
            break
          case 'high':
            estimatedFee = 0.0002
            estimatedTime = '1-2 minuti'
            break
        }
      } else if (networkType === 'ethereum') {
        switch (priority) {
          case 'low':
            estimatedFee = 0.001
            estimatedTime = '10-15 minuti'
            break
          case 'normal':
            estimatedFee = 0.003
            estimatedTime = '3-5 minuti'
            break
          case 'high':
            estimatedFee = 0.008
            estimatedTime = '1-2 minuti'
            break
        }
      }

      let txHash = ''
      if (networkType === 'xrp') {
        await initializeXRPL()
        const seed = process.env.XRPL_WALLET_SEED
        if (!seed) {
          throw new Error('XRPL server wallet not configured')
        }
        const wallet = walletFromSeed(seed)
        const balance = await getAccountBalance(wallet.address)
        if (parseFloat(balance.xrp) < numAmount) {
          await disconnectXRPL()
          return res.status(400).json({
            success: false,
            error: 'Saldo insufficiente'
          })
        }
        const result = await sendXRPPayment(wallet, toAddress, numAmount, memo)
        await disconnectXRPL()
        if (!result.success) {
          throw new Error(result.error)
        }
        txHash = result.hash
      } else if (networkType === 'ethereum') {
        const providerUrl = process.env.ETH_PROVIDER_URL
        const ethKey = process.env.ETH_PRIVATE_KEY
        if (!providerUrl || !ethKey) {
          throw new Error('Ethereum wallet not configured')
        }
        const provider = new ethers.JsonRpcProvider(providerUrl)
        const wallet = new ethers.Wallet(ethKey, provider)
        const balance = await provider.getBalance(wallet.address)
        if (balance < ethers.parseEther(numAmount.toString())) {
          return res.status(400).json({
            success: false,
            error: 'Saldo ETH insufficiente'
          })
        }
        const tx = await wallet.sendTransaction({
          to: toAddress,
          value: ethers.parseEther(numAmount.toString()),
          data: memo ? ethers.hexlify(ethers.toUtf8Bytes(memo)) : undefined
        })
        await tx.wait()
        txHash = tx.hash
      } else {
        return res.status(400).json({ success: false, error: 'Currency not supported' })
      }

      console.log('Transaction sent', { to: toAddress, amount: numAmount, currency, txHash })

      return res.status(200).json({
        success: true,
        message: 'Transazione inviata con successo!',
        data: {
          transactionHash: txHash,
          network: networkType
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Send crypto error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server durante l\'invio'
      })
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use POST to send crypto.' 
  })
}

