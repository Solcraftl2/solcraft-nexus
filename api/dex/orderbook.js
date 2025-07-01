import { applySecurityHeaders } from '../../utils/securityHeaders.js';
import { Client, Wallet } from 'xrpl'

export default async function handler(req, res) {
  applySecurityHeaders(res);
  // Enable CORS
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const client = new Client('wss://s1.ripple.com')
  
  try {
    await client.connect()
    
    if (req.method === 'GET') {
      // Get order book
      const { 
        takerGets, 
        takerPays, 
        limit = 20,
        taker 
      } = req.query
      
      if (!takerGets || !takerPays) {
        return res.status(400).json({
          success: false,
          error: 'takerGets and takerPays are required'
        })
      }
      
      const takerGetsObj = JSON.parse(takerGets)
      const takerPaysObj = JSON.parse(takerPays)
      
      // Get order book offers
      const orderBook = await client.request({
        command: 'book_offers',
        taker_gets: takerGetsObj,
        taker_pays: takerPaysObj,
        limit: parseInt(limit),
        taker: taker || undefined
      })
      
      // Calculate market depth and statistics
      const offers = orderBook.result.offers || []
      let totalVolume = 0
      let weightedPrice = 0
      let totalAmount = 0
      
      offers.forEach(offer => {
        const amount = typeof offer.TakerGets === 'string' 
          ? parseInt(offer.TakerGets) / 1000000 
          : parseFloat(offer.TakerGets.value)
        const price = typeof offer.TakerPays === 'string'
          ? parseInt(offer.TakerPays) / 1000000
          : parseFloat(offer.TakerPays.value)
        
        totalVolume += price
        totalAmount += amount
        weightedPrice += price * amount
      })
      
      const avgPrice = totalAmount > 0 ? weightedPrice / totalAmount : 0
      
      // Get reverse order book for spread calculation
      const reverseOrderBook = await client.request({
        command: 'book_offers',
        taker_gets: takerPaysObj,
        taker_pays: takerGetsObj,
        limit: 1
      })
      
      const bestBid = offers.length > 0 ? offers[0] : null
      const bestAsk = reverseOrderBook.result.offers.length > 0 ? reverseOrderBook.result.offers[0] : null
      
      let spread = 0
      if (bestBid && bestAsk) {
        const bidPrice = typeof bestBid.TakerPays === 'string'
          ? parseInt(bestBid.TakerPays) / 1000000
          : parseFloat(bestBid.TakerPays.value)
        const askPrice = typeof bestAsk.TakerGets === 'string'
          ? parseInt(bestAsk.TakerGets) / 1000000
          : parseFloat(bestAsk.TakerGets.value)
        spread = askPrice - bidPrice
      }
      
      res.status(200).json({
        success: true,
        data: {
          offers: offers,
          market_stats: {
            total_offers: offers.length,
            total_volume: totalVolume,
            average_price: avgPrice,
            best_bid: bestBid,
            best_ask: bestAsk,
            spread: spread,
            market_depth: {
              bids: offers.length,
              asks: reverseOrderBook.result.offers.length
            }
          },
          taker_gets: takerGetsObj,
          taker_pays: takerPaysObj,
          ledger_index: orderBook.result.ledger_index,
          validated: orderBook.result.validated
        }
      })
      
    } else if (req.method === 'POST') {
      // Create offer
      const {
        traderSeed,
        takerGets,
        takerPays,
        expiration,
        offerSequence,
        flags = 0
      } = req.body
      
      if (!traderSeed || !takerGets || !takerPays) {
        return res.status(400).json({
          success: false,
          error: 'Trader seed, takerGets, and takerPays are required'
        })
      }
      
      const traderWallet = Wallet.fromSeed(traderSeed)
      
      // Verify trader has sufficient balance
      const traderInfo = await client.request({
        command: 'account_info',
        account: traderWallet.address,
        ledger_index: 'validated'
      })
      
      // Prepare offer transaction
      const offer = {
        TransactionType: 'OfferCreate',
        Account: traderWallet.address,
        TakerGets: takerGets,
        TakerPays: takerPays,
        Flags: flags
      }
      
      // Add optional fields
      if (expiration) {
        offer.Expiration = expiration
      }
      
      if (offerSequence) {
        offer.OfferSequence = offerSequence
      }
      
      // Auto-fill and submit transaction
      const prepared = await client.autofill(offer)
      const signed = traderWallet.sign(prepared)
      const result = await client.submitAndWait(signed.tx_blob)
      
      // Extract offer sequence from result
      let createdOfferSequence = null
      if (result.result.meta && result.result.meta.CreatedNode) {
        const createdNodes = Array.isArray(result.result.meta.CreatedNode) 
          ? result.result.meta.CreatedNode 
          : [result.result.meta.CreatedNode]
        
        for (const node of createdNodes) {
          if (node.LedgerEntryType === 'Offer' && node.NewFields) {
            createdOfferSequence = node.NewFields.Sequence
            break
          }
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          hash: result.result.hash,
          trader: traderWallet.address,
          taker_gets: takerGets,
          taker_pays: takerPays,
          offer_sequence: createdOfferSequence,
          expiration: expiration,
          flags: flags,
          transaction: result.result,
          ledger_index: result.result.ledger_index,
          validated: result.result.validated
        }
      })
    }
    
  } catch (error) {
    console.error('DEX operation error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute DEX operation'
    })
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}

