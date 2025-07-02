import { logger } from '../../netlify/functions/utils/logger.js';
import { Client, Wallet } from 'xrpl'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  const client = new Client('wss://s1.ripple.com')
  
  try {
    await client.connect()
    
    const {
      senderSeed,
      destination,
      mptId,
      amount,
      destinationTag,
      memo
    } = req.body
    
    if (!senderSeed || !destination || !mptId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Sender seed, destination, MPT ID, and amount are required'
      })
    }
    
    const senderWallet = Wallet.fromSeed(senderSeed)
    
    // Verify sender has sufficient MPT balance
    const senderObjects = await client.request({
      command: 'account_objects',
      account: senderWallet.address,
      ledger_index: 'validated'
    })
    
    const mptObject = senderObjects.result.account_objects.find(
      obj => obj.LedgerEntryType === 'MPToken' && obj.MPTokenID === mptId
    )
    
    if (!mptObject) {
      return res.status(400).json({
        success: false,
        error: 'Sender does not hold this MPT'
      })
    }
    
    if (parseInt(mptObject.MPTAmount) < parseInt(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient MPT balance'
      })
    }
    
    // Check if destination requires authorization
    const destInfo = await client.request({
      command: 'account_info',
      account: destination,
      ledger_index: 'validated'
    })
    
    const destFlags = destInfo.result.account_data.Flags || 0
    const requiresAuth = !!(destFlags & 0x01000000) // DepositAuth flag
    
    if (requiresAuth) {
      // In a real implementation, you would check if the sender is authorized
      logger.info('Destination requires authorization - implement authorization check');
    }
    
    // Prepare Payment Transaction for MPT
    const payment = {
      TransactionType: 'Payment',
      Account: senderWallet.address,
      Destination: destination,
      Amount: {
        currency: mptId,
        value: amount.toString(),
        issuer: senderWallet.address
      }
    }
    
    // Add optional fields
    if (destinationTag) {
      payment.DestinationTag = parseInt(destinationTag)
    }
    
    if (memo) {
      payment.Memos = [{
        Memo: {
          MemoType: Buffer.from('MPT Transfer').toString('hex').toUpperCase(),
          MemoData: Buffer.from(memo).toString('hex').toUpperCase()
        }
      }]
    }
    
    // Auto-fill and submit transaction
    const prepared = await client.autofill(payment)
    const signed = senderWallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    
    // Calculate transfer fee if applicable
    let transferFee = 0
    if (result.result.meta && result.result.meta.AffectedNodes) {
      // Extract transfer fee from transaction metadata
      // This would require parsing the metadata to find fee collection
    }
    
    res.status(200).json({
      success: true,
      data: {
        hash: result.result.hash,
        sender: senderWallet.address,
        destination: destination,
        mpt_id: mptId,
        amount: amount,
        transfer_fee: transferFee,
        destination_tag: destinationTag,
        memo: memo,
        transaction: result.result,
        ledger_index: result.result.ledger_index,
        validated: result.result.validated
      }
    })
    
  } catch (error) {
    logger.error('MPT transfer error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to transfer Multi-Purpose Token'
    })
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}

