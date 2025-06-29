import { getXRPLClient, initializeXRPL, walletFromSeed, xrpToDrops } from '../config/xrpl.js';
import { insertOrder, insertTransaction, supabase } from '../config/supabaseClient.js';
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
          userAddress: decoded.address,
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
          error: 'Impossibile recuperare gli ordini',
          message: error.message
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
        orderType = 'limit', // 'market', 'limit', 'stop_loss', 'take_profit'
        timeInForce = 'GTC', // 'GTC' (Good Till Cancelled), 'IOC' (Immediate or Cancel), 'FOK' (Fill or Kill)
        stopPrice = null,
        expiration = null
      } = req.body;

      if (!type || !assetId || !tokenSymbol || !quantity || (!price && orderType !== 'market')) {
        return res.status(400).json({
          success: false,
          error: 'Parametri richiesti: type, assetId, tokenSymbol, quantity, price (per ordini limit)'
        });
      }

      try {
        const order = await createTradingOrder({
          userId: decoded.userId,
          userAddress: decoded.address,
          type: type,
          assetId: assetId,
          tokenSymbol: tokenSymbol,
          quantity: parseFloat(quantity),
          price: price ? parseFloat(price) : null,
          orderType: orderType,
          timeInForce: timeInForce,
          stopPrice: stopPrice ? parseFloat(stopPrice) : null,
          expiration: expiration
        });

        return res.status(201).json({
          success: true,
          message: 'Ordine creato con successo!',
          order: order
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
      const { orderId } = req.query;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'orderId richiesto'
        });
      }

      try {
        const cancelledOrder = await cancelTradingOrder({
          orderId: orderId,
          userId: decoded.userId
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

// Funzioni helper
async function getUserOrders({ userId, filters, pagination, sorting }) {
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.type !== 'all') {
    query = query.eq('order_type', filters.type);
  }

  if (filters.asset !== 'all') {
    query = query.eq('asset_id', filters.asset);
  }

  query = query
    .order(sorting.sortBy, { ascending: sorting.sortOrder === 'asc' })
    .range((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  // Summary su tutti gli ordini dell'utente
  const { data: allOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId);

  const summary = calculateOrdersSummary(allOrders || []);

  return {
    orders: data,
    total: count || 0,
    summary
  };
}


async function createTradingOrder({
  userId,
  userAddress,
  traderSeed,
  type,
  assetId,
  tokenSymbol,
  quantity,
  price,
  orderType,
  timeInForce,
  stopPrice,
  expiration
}) {
  await initializeXRPL();
  const client = getXRPLClient();
  const wallet = walletFromSeed(traderSeed);

  if (wallet.address !== userAddress) {
    throw new Error('Wallet address mismatch');
  }

  const totalValue = quantity * price;

  let takerGets;
  let takerPays;
  if (type === 'buy') {
    takerGets = xrpToDrops(totalValue.toString());
    takerPays = { currency: tokenSymbol, issuer: userAddress, value: quantity.toString() };
  } else {
    takerGets = { currency: tokenSymbol, issuer: userAddress, value: quantity.toString() };
    takerPays = xrpToDrops(totalValue.toString());
  }

  const tx = {
    TransactionType: 'OfferCreate',
    Account: wallet.address,
    TakerGets: takerGets,
    TakerPays: takerPays
  };

  if (expiration) {
    tx.Expiration = expiration;
  }

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const orderData = {
    user_id: userId,
    asset_id: assetId,
    order_type: type,
    tokens: quantity,
    price_per_token: price,
    total_amount: totalValue,
    status: 'pending',
    xrpl_sequence: prepared.Sequence,
    transaction_hash: result.result.hash,
    created_at: new Date().toISOString()
  };

  const savedOrder = await insertOrder(orderData);

  await insertTransaction({
    user_id: userId,
    asset_id: assetId,
    transaction_type: type,
    tokens: quantity,
    price_per_token: price,
    total_amount: totalValue,
    status: 'pending',
    transaction_hash: result.result.hash,
    created_at: new Date().toISOString()
  });

  return savedOrder;
}

async function updateTradingOrder({ orderId, userId, updates }) {
  const { data, error } = await supabase
    .from('orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function cancelTradingOrder({ orderId, userId, traderSeed }) {
  const order = await getOrderById(orderId, userId);

  if (!order) {
    throw new Error('Ordine non trovato');
  }

  await initializeXRPL();
  const client = getXRPLClient();
  const wallet = walletFromSeed(traderSeed);

  const tx = {
    TransactionType: 'OfferCancel',
    Account: wallet.address,
    OfferSequence: order.xrpl_sequence
  };

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await insertTransaction({
    user_id: userId,
    asset_id: order.asset_id,
    transaction_type: order.order_type,
    tokens: order.tokens,
    price_per_token: order.price_per_token,
    total_amount: order.total_amount,
    status: 'cancelled',
    transaction_hash: result.result.hash,
    created_at: new Date().toISOString()
  });

  return data;
}

async function getOrderById(orderId, userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

function calculateOrdersSummary(orders) {
  const summary = {
    total: orders.length,
    open: 0,
    filled: 0,
    cancelled: 0,
    partially_filled: 0,
    totalVolume: 0,
    avgOrderSize: 0,
    successRate: 0
  };

  orders.forEach(order => {
    summary[order.status]++;
    summary.totalVolume += parseFloat(order.total_amount || 0);
  });

  summary.avgOrderSize = summary.totalVolume / orders.length || 0;
  summary.successRate = ((summary.filled + summary.partially_filled) / orders.length * 100) || 0;
  
  return summary;
}


