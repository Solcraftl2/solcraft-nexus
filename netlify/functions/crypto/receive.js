import { createReqRes } from '../config/requestWrapper.js';
exports.handler = async (event, context) => {
  const { req, res } = createReqRes(event);
  
  try {
    await originalHandler(req, res);
    
    return {
      statusCode: res.statusCode,
      headers: res.headers,
      body: res.body
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: res.headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function originalHandler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'POST') {
    try {
      // Get user from authorization header
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Token di autorizzazione richiesto'
        })
      }

      const { 
        currency, 
        amount, 
        memo,
        label,
        expiry // Optional expiry time in minutes
      } = req.body

      // Validate required fields
      if (!currency) {
        return res.status(400).json({
          success: false,
          error: 'Valuta è richiesta'
        })
      }

      const currencyUpper = currency.toUpperCase()
      let networkType = 'unknown'
      let generatedAddress = ''
      let qrCodeData = ''

      // Generate address based on currency
      if (currencyUpper === 'XRP') {
        networkType = 'xrp'
        // In production, you would generate a new XRP address or use user's existing address
        generatedAddress = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH' // Example XRP address
        
        // Create XRP payment URI for QR code
        qrCodeData = `https://xrpl.org/send?to=${generatedAddress}`
        if (amount) qrCodeData += `&amount=${amount}`
        if (memo) qrCodeData += `&dt=${memo}`
        
      } else if (currencyUpper === 'ETH') {
        networkType = 'ethereum'
        // In production, you would generate a new Ethereum address or use user's existing address
        generatedAddress = '0x742d35Cc6634C0532925a3b8D4B9C7CB1e15A5E1' // Example ETH address
        
        // Create Ethereum payment URI for QR code
        qrCodeData = `ethereum:${generatedAddress}`
        if (amount) qrCodeData += `?value=${parseFloat(amount) * 1e18}` // Convert to wei
        
      } else {
        return res.status(400).json({
          success: false,
          error: 'Valuta non supportata. Supportate: XRP, ETH'
        })
      }

      // Calculate expiry time
      const expiryTime = expiry ? 
        new Date(Date.now() + (expiry * 60 * 1000)).toISOString() : 
        new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // Default 24 hours

      // Generate payment request ID
      const paymentRequestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const paymentRequest = {
        id: paymentRequestId,
        type: 'receive',
        status: 'active',
        currency: currencyUpper,
        network: networkType,
        address: generatedAddress,
        amount: amount ? parseFloat(amount) : null,
        memo: memo || '',
        label: label || `Pagamento ${currencyUpper}`,
        qrCode: qrCodeData,
        createdAt: new Date().toISOString(),
        expiresAt: expiryTime,
        received: 0,
        transactions: [],
        isCompleted: false
      }

      // In a real implementation, you would:
      // 1. Store the payment request in database
      // 2. Set up monitoring for incoming transactions to this address
      // 3. Generate actual QR code image
      // 4. Set up webhooks for payment notifications

      return res.status(200).json({
        success: true,
        message: 'Indirizzo di ricezione generato con successo!',
        data: {
          paymentRequest: paymentRequest,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`,
          instructions: {
            [currencyUpper]: {
              address: generatedAddress,
              network: networkType,
              memo: memo ? `Includi memo: ${memo}` : 'Memo opzionale',
              minimumAmount: networkType === 'xrp' ? '0.000001 XRP' : '0.000001 ETH'
            }
          },
          monitoring: {
            checkUrl: `/api/crypto/payment-status/${paymentRequestId}`,
            webhookUrl: `/api/crypto/payment-webhook/${paymentRequestId}`,
            pollInterval: 30 // seconds
          }
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Receive crypto error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server durante la generazione dell\'indirizzo'
      })
    }
  }

  if (req.method === 'GET') {
    try {
      // Get user from authorization header
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Token di autorizzazione richiesto'
        })
      }

      // Return user's existing addresses
      const userAddresses = {
        xrp: {
          address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
          balance: '1,250.75 XRP',
          network: 'xrp',
          active: true
        },
        ethereum: {
          address: '0x742d35Cc6634C0532925a3b8D4B9C7CB1e15A5E1',
          balance: '0.0 ETH',
          network: 'ethereum',
          active: true
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          addresses: userAddresses,
          supportedCurrencies: ['XRP', 'ETH'],
          defaultCurrency: 'XRP'
        },
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Get addresses error:', error)
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      })
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed. Use POST to generate receive address or GET to retrieve existing addresses.' 
  })
}

