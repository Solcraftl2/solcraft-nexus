import { getXRPLClient, initializeXRPL, walletFromSeed, xrpToDrops } from '../config/xrpl.js';
import { insertOrder, updateOrder, insertTradeHistory, supabase } from '../config/supabaseClient.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Autenticazione richiesta per tutte le operazioni
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token di autenticazione richiesto'
    });
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  
  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token non valido'
    });
  }

  try {
    // GET - Lista ordini utente
    if (req.method === 'GET') {
      const {
        status = 'all', // all, open, filled, cancelled, expired
        type = 'all', // all, buy, sell
        asset = 'all',
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      try {
        const orders = await getUserOrders({
          userId: decoded.userId,
          filters: {
            status,
            type,
            asset
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
          },
          sorting: {
            sortBy,
            sortOrder
          }
        });

        return res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          orders: orders.orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: orders.total,
            pages: Math.ceil(orders.total / parseInt(limit))
          },
          summary: orders.summary,
          metadata: {
            lastUpdated: new Date().toISOString(),
            refreshInterval: 10
          }
        });

      } catch (error) {
        console.error('Orders fetch error:', error);
        return res.status(500).json({
          success: false,
          error: 'Impossibile recuperare gli ordini'
        });
      }
    }

    // POST - Crea nuovo ordine
    if (req.method === 'POST') {
      const {
        type, // 'buy' or 'sell'
        assetId,
        tokenSymbol,
        quantity,
        price,
        traderSeed,
        takerGets,
        takerPays,
        orderType = 'limit',
        timeInForce = 'GTC',
        stopPrice = null,
        expiration = null
      } = req.body;

      if (!type || !assetId || !tokenSymbol || !quantity || !traderSeed || !takerGets || !takerPays) {
        return res.status(400).json({
          success: false,
          error: 'Parametri richiesti: type, assetId, tokenSymbol, quantity, traderSeed, takerGets, takerPays'
        });
      }

      try {
        const order = await createTradingOrder({
          userId: decoded.userId,
          type: type,
          assetId: assetId,
          tokenSymbol: tokenSymbol,
          quantity: parseFloat(quantity),
          price: price ? parseFloat(price) : null,
          traderSeed: traderSeed,
          takerGets: takerGets,
          takerPays: takerPays,
          orderType: orderType,
          timeInForce: timeInForce,
          stopPrice: stopPrice ? parseFloat(stopPrice) : null,
          expiration: expiration
        });

        return res.status(201).json({
          success: true,
          message: 'Ordine creato con successo!',
          order: order,
          estimatedExecution: order.estimatedExecution,
          fees: order.fees
        });

      } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la creazione dell\'ordine',
          message: error.message
        });
      }
    }

    // PUT - Modifica ordine esistente
    if (req.method === 'PUT') {
      const { orderId } = req.query;
      const {
        quantity,
        price,
        stopPrice
      } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'orderId richiesto'
        });
      }

      try {
        const updatedOrder = await updateTradingOrder({
          orderId: orderId,
          userId: decoded.userId,
          updates: {
            quantity: quantity ? parseFloat(quantity) : null,
            price: price ? parseFloat(price) : null,
            stopPrice: stopPrice ? parseFloat(stopPrice) : null
          }
        });

        return res.status(200).json({
          success: true,
          message: 'Ordine aggiornato con successo!',
          order: updatedOrder
        });

      } catch (error) {
        console.error('Order update error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante l\'aggiornamento dell\'ordine',
          message: error.message
        });
      }
    }

    // DELETE - Cancella ordine
    if (req.method === 'DELETE') {
      const { orderId, offerSequence, traderSeed } = req.query;

      if (!orderId || !offerSequence || !traderSeed) {
        return res.status(400).json({
          success: false,
          error: 'orderId, offerSequence e traderSeed richiesti'
        });
      }

      try {
        const cancelledOrder = await cancelTradingOrder({
          orderId: orderId,
          userId: decoded.userId,
          offerSequence: parseInt(offerSequence),
          traderSeed: traderSeed
        });

        return res.status(200).json({
          success: true,
          message: 'Ordine cancellato con successo!',
          order: cancelledOrder
        });

      } catch (error) {
        console.error('Order cancellation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la cancellazione dell\'ordine',
          message: error.message
        });
      }
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Trading API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}


// Helper functions
async function getUserOrders({ userId, filters, pagination, sorting }) {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit - 1;

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (filters.status !== 'all') query.eq('status', filters.status);
  if (filters.type !== 'all') query.eq('order_type', filters.type);
  if (filters.asset !== 'all') query.eq('asset_id', filters.asset);

  if (sorting.sortBy) {
    query = query.order(sorting.sortBy, { ascending: sorting.sortOrder === 'asc' });
  }

  query = query.range(start, end);

  const { data, error, count } = await query;
  if (error) throw error;

  const summary = calculateOrdersSummary(data);

  return { orders: data, total: count || data.length, summary };
}

async function createTradingOrder({ userId, type, assetId, tokenSymbol, quantity, price, traderSeed, takerGets, takerPays, expiration }) {
  await initializeXRPL();
  const client = getXRPLClient();
  const wallet = walletFromSeed(traderSeed);

  const offer = {
    TransactionType: 'OfferCreate',
    Account: wallet.address,
    TakerGets: takerGets,
    TakerPays: takerPays
  };

  if (expiration) offer.Expiration = expiration;

  const prepared = await client.autofill(offer);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const orderData = {
    user_id: userId,
    asset_id: assetId,
    order_type: type,
    tokens: quantity,
    price_per_token: price,
    total_amount: quantity * price,
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: expiration ? new Date(expiration).toISOString() : null
  };

  const savedOrder = await insertOrder(orderData);

  await insertTradeHistory({
    user_id: userId,
    asset_id: assetId,
    transaction_type: type,
    tokens: quantity,
    price_per_token: price,
    total_amount: quantity * price,
    status: 'pending',
    transaction_hash: result.result.hash,
    created_at: new Date().toISOString()
  });

  return { ...savedOrder, transaction: result.result };
}

async function updateTradingOrder({ orderId, userId, updates }) {
  const order = await getOrderById(orderId, userId);
  if (!order) throw new Error('Ordine non trovato');

  const saved = await updateOrder(orderId, updates);
  return saved;
}

async function cancelTradingOrder({ orderId, userId, offerSequence, traderSeed }) {
  await initializeXRPL();
  const client = getXRPLClient();
  const wallet = walletFromSeed(traderSeed);

  const cancelTx = {
    TransactionType: 'OfferCancel',
    Account: wallet.address,
    OfferSequence: offerSequence
  };

  const prepared = await client.autofill(cancelTx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const cancelled = await updateOrder(orderId, { status: 'cancelled' });

  await insertTradeHistory({
    user_id: userId,
    asset_id: cancelled.asset_id,
    transaction_type: 'cancel',
    tokens: cancelled.tokens,
    price_per_token: cancelled.price_per_token,
    total_amount: cancelled.total_amount,
    status: 'cancelled',
    transaction_hash: result.result.hash,
    created_at: new Date().toISOString()
  });

  return cancelled;
}

async function getOrderById(orderId, userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

function calculateOrdersSummary(orders) {
  const summary = {
    total: orders.length,
    open: orders.filter(o => o.status === 'pending' || o.status === 'open').length,
    filled: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    partially_filled: orders.filter(o => o.status === 'partial').length,
    totalVolume: orders.reduce((a, o) => a + parseFloat(o.total_amount || 0), 0),
    avgOrderSize: 0,
    successRate: 0,
    totalFees: 0
  };

  summary.avgOrderSize = summary.totalVolume / (summary.total || 1);
  if (summary.total > 0) {
    summary.successRate = ((summary.filled + summary.partially_filled) / summary.total) * 100;
  }

  return summary;
}
