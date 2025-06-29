import { Client, Wallet } from 'xrpl'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const issuerSeed = process.env.ISSUER_SECRET
  if (!issuerSeed) {
    return res.status(500).json({ success: false, error: 'Issuer secret not configured' })
  }

  const { transaction } = req.body
  if (!transaction) {
    return res.status(400).json({ success: false, error: 'Transaction is required' })
  }

  const client = new Client(process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233')

  try {
    await client.connect()

    const wallet = Wallet.fromSeed(issuerSeed)
    const tx = { Account: wallet.address, ...transaction }
    const prepared = await client.autofill(tx)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    return res.status(200).json({ success: true, result: result.result })
  } catch (error) {
    console.error('Signing error:', error)
    return res.status(500).json({ success: false, error: error.message })
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}
