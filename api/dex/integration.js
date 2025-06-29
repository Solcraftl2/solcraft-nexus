/* eslint-env node */
/* global process */
import {
  getXRPLClient,
  initializeXRPL,
  walletFromSeed,
} from '../config/xrpl.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Autenticazione richiesta per operazioni POST
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione richiesto'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
    
    try {
      jwt.verify(token, jwtSecret);
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }
  }

  try {
    // Ensure XRPL connection
    await initializeXRPL();

    // GET - Informazioni DEX e order book
    if (req.method === 'GET') {
      const {
        action = 'orderbook', // orderbook, liquidity, stats, pairs
        baseCurrency = 'XRP',
        quoteCurrency = 'USD',
        depth = 20
      } = req.query;

      try {
        let dexData;

        switch (action) {
          case 'orderbook':
            dexData = await getDEXOrderBook(baseCurrency, quoteCurrency, depth);
            break;
          case 'liquidity':
            dexData = await getDEXLiquidity();
            break;
          case 'stats':
            dexData = await getDEXStats();
            break;
          case 'pairs':
            dexData = await getTradingPairs();
            break;
          default:
            throw new Error('Azione non supportata');
        }

        return res.status(200).json({
          success: true,
          data: dexData,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore DEX GET:', error);
        
        // Fallback a dati mock per sviluppo
        const mockData = getMockDEXData(req.query.action);
        return res.status(200).json({
          success: true,
          data: mockData,
          mock: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // POST - Operazioni DEX (place order, cancel order)
    if (req.method === 'POST') {
      const { action, ...orderData } = req.body;

      try {
        let result;

        switch (action) {
          case 'place_order':
            result = await placeDEXOrder(orderData);
            break;
          case 'cancel_order':
            result = await cancelDEXOrder(orderData);
            break;
          case 'modify_order':
            result = await modifyDEXOrder(orderData);
            break;
          default:
            throw new Error('Azione non supportata');
        }

        return res.status(200).json({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Errore DEX POST:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Metodo non supportato'
    });

  } catch (error) {
    console.error('Errore generale DEX:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      timestamp: new Date().toISOString()
    });
  }
}

// Funzioni helper per DEX XRPL
async function getDEXOrderBook(baseCurrency, quoteCurrency, depth) {
  try {
    const client = await getXRPLClient();
    
    // Richiesta order book da XRPL DEX
    const orderBookRequest = {
      command: 'book_offers',
      taker_gets: {
        currency: baseCurrency === 'XRP' ? 'XRP' : baseCurrency,
        issuer: baseCurrency === 'XRP' ? undefined : 'rTokenIssuerAddress'
      },
      taker_pays: {
        currency: quoteCurrency === 'XRP' ? 'XRP' : quoteCurrency,
        issuer: quoteCurrency === 'XRP' ? undefined : 'rTokenIssuerAddress'
      },
      limit: depth
    };

    const response = await client.request(orderBookRequest);
    
    return {
      pair: `${baseCurrency}/${quoteCurrency}`,
      bids: response.result.offers.map(offer => ({
        price: parseFloat(offer.quality),
        amount: parseFloat(offer.TakerGets.value || offer.TakerGets) / 1000000,
        total: parseFloat(offer.TakerPays.value || offer.TakerPays) / 1000000,
        account: offer.Account
      })),
      asks: [], // Richiesta separata per asks
      timestamp: new Date().toISOString(),
      spread: 0.001,
      volume24h: 125000
    };

  } catch (error) {
    console.error('Errore order book XRPL:', error);
    throw error;
  }
}

async function getDEXLiquidity(baseCurrency = 'XRP', quoteCurrency = 'USD') {
  try {
    const client = await getXRPLClient();

    const request = {
      command: 'amm_info',
      asset: baseCurrency === 'XRP' ? { currency: 'XRP' } : { currency: baseCurrency, issuer: 'rTokenIssuerAddress' },
      asset2: quoteCurrency === 'XRP' ? { currency: 'XRP' } : { currency: quoteCurrency, issuer: 'rTokenIssuerAddress' },
    };

    const response = await client.request(request);
    return response.result;
  } catch (error) {
    console.error('Errore liquidity XRPL:', error);
    throw error;
  }
}

async function getDEXStats() {
  return {
    volume24h: 3850000,
    volume7d: 28700000,
    volume30d: 125000000,
    trades24h: 15420,
    trades7d: 98500,
    trades30d: 425000,
    activeTraders24h: 2840,
    activeTraders7d: 12500,
    activeTraders30d: 45200,
    totalValueLocked: 15750000,
    topPairs: [
      { pair: 'XRP/USD', volume24h: 2100000, change24h: 5.2 },
      { pair: 'RLUSD/XRP', volume24h: 980000, change24h: -2.1 },
      { pair: 'SOLO/XRP', volume24h: 450000, change24h: 12.8 },
      { pair: 'CSC/XRP', volume24h: 320000, change24h: 8.5 }
    ],
    priceImpact: {
      low: 0.1,
      medium: 0.5,
      high: 2.0
    },
    fees: {
      maker: 0.1,
      taker: 0.15,
      total24h: 15400
    }
  };
}

async function getTradingPairs() {
  return {
    pairs: [
      {
        symbol: 'XRP/USD',
        baseAsset: 'XRP',
        quoteAsset: 'USD',
        price: 0.52,
        change24h: 5.2,
        volume24h: 2100000,
        high24h: 0.54,
        low24h: 0.49,
        liquidity: 8500000,
        active: true
      },
      {
        symbol: 'RLUSD/XRP',
        baseAsset: 'RLUSD',
        quoteAsset: 'XRP',
        price: 1.92,
        change24h: -2.1,
        volume24h: 980000,
        high24h: 1.98,
        low24h: 1.89,
        liquidity: 4200000,
        active: true
      },
      {
        symbol: 'SOLO/XRP',
        baseAsset: 'SOLO',
        quoteAsset: 'XRP',
        price: 0.28,
        change24h: 12.8,
        volume24h: 450000,
        high24h: 0.31,
        low24h: 0.25,
        liquidity: 1850000,
        active: true
      },
      {
        symbol: 'CSC/XRP',
        baseAsset: 'CSC',
        quoteAsset: 'XRP',
        price: 0.0045,
        change24h: 8.5,
        volume24h: 320000,
        high24h: 0.0048,
        low24h: 0.0041,
        liquidity: 1200000,
        active: true
      }
    ],
    totalPairs: 24,
    activePairs: 18,
    newPairs24h: 2
  };
}

async function placeDEXOrder(orderData) {
  try {
    const { traderSeed, takerGets, takerPays, flags = 0, expiration, offerSequence } = orderData;

    if (!traderSeed || !takerGets || !takerPays) {
      throw new Error('Missing required order fields');
    }

    const client = await getXRPLClient();
    const wallet = walletFromSeed(traderSeed);

    const tx = {
      TransactionType: 'OfferCreate',
      Account: wallet.address,
      TakerGets: takerGets,
      TakerPays: takerPays,
      Flags: flags,
    };
    if (expiration) tx.Expiration = expiration;
    if (offerSequence) tx.OfferSequence = offerSequence;

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.engine_result !== 'tesSUCCESS') {
      throw new Error(result.result.engine_result_message || 'Transaction failed');
    }

    return {
      hash: result.result.hash,
      ledger_index: result.result.ledger_index,
      validated: result.result.validated,
    };
  } catch (error) {
    console.error('Order placement failed:', error);
    return { success: false, error: error.message };
  }
}

async function cancelDEXOrder(orderData) {
  try {
    const { traderSeed, offerSequence } = orderData;
    if (!traderSeed || offerSequence === undefined) {
      throw new Error('Missing cancel parameters');
    }

    const client = await getXRPLClient();
    const wallet = walletFromSeed(traderSeed);

    const tx = {
      TransactionType: 'OfferCancel',
      Account: wallet.address,
      OfferSequence: offerSequence,
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.engine_result !== 'tesSUCCESS') {
      throw new Error(result.result.engine_result_message || 'Cancel failed');
    }

    return {
      hash: result.result.hash,
      ledger_index: result.result.ledger_index,
      validated: result.result.validated,
    };
  } catch (error) {
    console.error('Order cancel failed:', error);
    return { success: false, error: error.message };
  }
}

async function modifyDEXOrder(orderData) {
  try {
    const { traderSeed, offerSequence, takerGets, takerPays } = orderData;
    if (!traderSeed || offerSequence === undefined || !takerGets || !takerPays) {
      throw new Error('Missing modify parameters');
    }

    // cancel existing offer then place a new one
    await cancelDEXOrder({ traderSeed, offerSequence });
    const result = await placeDEXOrder({ traderSeed, takerGets, takerPays });
    return result;
  } catch (error) {
    console.error('Order modify failed:', error);
    return { success: false, error: error.message };
  }
}

function getMockDEXData(action) {
  switch (action) {
    case 'orderbook':
      return {
        pair: 'XRP/USD',
        bids: [
          { price: 0.5195, amount: 10000, total: 5195 },
          { price: 0.5190, amount: 15000, total: 7785 },
          { price: 0.5185, amount: 8000, total: 4148 }
        ],
        asks: [
          { price: 0.5205, amount: 12000, total: 6246 },
          { price: 0.5210, amount: 9000, total: 4689 },
          { price: 0.5215, amount: 11000, total: 5736.5 }
        ],
        spread: 0.001,
        volume24h: 125000
      };
    case 'liquidity':
      return getDEXLiquidity();
    case 'stats':
      return getDEXStats();
    case 'pairs':
      return getTradingPairs();
    default:
      return { message: 'Dati mock DEX' };
  }
}

