import { logger } from '../utils/logger.js';
import { getXRPLClient, initializeXRPL } from '../config/xrpl.js';
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
        logger.error('Orders fetch error:', error);
        
        // Fallback con dati mock
        const mockOrders = generateMockOrders(decoded.userId);
        
        return res.status(200).json({
          success: true,
          ...mockOrders,
          note: 'Dati simulati - Trading non disponibile'
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
          order: order,
          estimatedExecution: order.estimatedExecution,
          fees: order.fees
        });

      } catch (error) {
        logger.error('Order creation error:', error);
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
        logger.error('Order update error:', error);
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
        logger.error('Order cancellation error:', error);
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
    logger.error('Trading API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}

// Funzioni helper
async function getUserOrders({ userId, userAddress, filters, pagination, sorting }) {
  // Simula recupero ordini utente da XRPL DEX
  const allOrders = await getAllUserOrders(userId);
  
  // Applica filtri
  let filteredOrders = allOrders;
  
  if (filters.status !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === filters.status);
  }
  
  if (filters.type !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.type === filters.type);
  }
  
  if (filters.asset !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.assetId === filters.asset);
  }
  
  // Ordinamento
  filteredOrders.sort((a, b) => {
    let aValue = a[sorting.sortBy];
    let bValue = b[sorting.sortBy];
    
    if (sorting.sortBy === 'created_at' || sorting.sortBy === 'updated_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sorting.sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1;
    } else {
      return aValue > bValue ? 1 : -1;
    }
  });
  
  // Paginazione
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  
  // Summary
  const summary = calculateOrdersSummary(allOrders);
  
  return {
    orders: paginatedOrders,
    total: filteredOrders.length,
    summary: summary
  };
}

async function getAllUserOrders(userId) {
  // Simula ordini utente completi
  return [
    {
      id: 'order_001',
      userId: userId,
      type: 'buy',
      assetId: 'PROP001',
      tokenSymbol: 'MHTN.OFFICE',
      assetName: 'Manhattan Office Building',
      quantity: 10,
      price: 2600.00,
      totalValue: 26000.00,
      filled: 0,
      remaining: 10,
      orderType: 'limit',
      timeInForce: 'GTC',
      status: 'open',
      created_at: '2024-02-20T10:30:00Z',
      updated_at: '2024-02-20T10:30:00Z',
      fees: {
        trading: 26.00,
        network: 0.001,
        total: 26.001
      },
      estimatedExecution: '2024-02-20T11:00:00Z'
    },
    {
      id: 'order_002',
      userId: userId,
      type: 'sell',
      assetId: 'GOLD001',
      tokenSymbol: 'GOLD.RESERVE',
      assetName: 'Physical Gold Reserve',
      quantity: 50,
      price: 95.00,
      totalValue: 4750.00,
      filled: 50,
      remaining: 0,
      orderType: 'limit',
      timeInForce: 'GTC',
      status: 'filled',
      created_at: '2024-02-19T14:15:00Z',
      updated_at: '2024-02-19T14:45:00Z',
      filled_at: '2024-02-19T14:45:00Z',
      fees: {
        trading: 4.75,
        network: 0.001,
        total: 4.751
      },
      execution: {
        avgPrice: 95.00,
        fills: [
          {
            quantity: 25,
            price: 94.95,
            timestamp: '2024-02-19T14:42:00Z'
          },
          {
            quantity: 25,
            price: 95.05,
            timestamp: '2024-02-19T14:45:00Z'
          }
        ]
      }
    },
    {
      id: 'order_003',
      userId: userId,
      type: 'buy',
      assetId: 'SOLAR001',
      tokenSymbol: 'TX.SOLAR',
      assetName: 'Texas Solar Farm',
      quantity: 20,
      price: 750.00,
      totalValue: 15000.00,
      filled: 12,
      remaining: 8,
      orderType: 'limit',
      timeInForce: 'GTC',
      status: 'partially_filled',
      created_at: '2024-02-18T09:20:00Z',
      updated_at: '2024-02-19T16:30:00Z',
      fees: {
        trading: 15.00,
        network: 0.001,
        total: 15.001
      },
      execution: {
        avgPrice: 748.50,
        fills: [
          {
            quantity: 12,
            price: 748.50,
            timestamp: '2024-02-19T16:30:00Z'
          }
        ]
      }
    }
  ];
}

async function createTradingOrder({
  userId,
  userAddress,
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
  // Simula creazione ordine su XRPL DEX
  const orderId = 'order_' + Date.now();
  
  // Calcola fees
  const totalValue = price ? quantity * price : 0;
  const tradingFee = totalValue * 0.001; // 0.1%
  const networkFee = 0.001; // XRP network fee
  
  const order = {
    id: orderId,
    userId: userId,
    userAddress: userAddress,
    type: type,
    assetId: assetId,
    tokenSymbol: tokenSymbol,
    quantity: quantity,
    price: price,
    totalValue: totalValue,
    filled: 0,
    remaining: quantity,
    orderType: orderType,
    timeInForce: timeInForce,
    stopPrice: stopPrice,
    expiration: expiration,
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fees: {
      trading: tradingFee,
      network: networkFee,
      total: tradingFee + networkFee
    },
    estimatedExecution: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minuti
    xrplTxHash: null // Sarà popolato quando l'ordine viene eseguito
  };
  
  // Simula validazione bilancio
  if (type === 'buy') {
    const requiredBalance = totalValue + order.fees.total;
    // Qui si verificherebbe il bilancio XRP dell'utente
  } else {
    // Qui si verificherebbe il bilancio del token da vendere
  }
  
  return order;
}

async function updateTradingOrder({ orderId, userId, updates }) {
  // Simula aggiornamento ordine
  const order = await getOrderById(orderId, userId);
  
  if (!order) {
    throw new Error('Ordine non trovato');
  }
  
  if (order.status !== 'open' && order.status !== 'partially_filled') {
    throw new Error('Impossibile modificare ordine non aperto');
  }
  
  // Applica aggiornamenti
  const updatedOrder = {
    ...order,
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  // Ricalcola fees se necessario
  if (updates.quantity || updates.price) {
    const totalValue = updatedOrder.price * updatedOrder.quantity;
    updatedOrder.totalValue = totalValue;
    updatedOrder.fees.trading = totalValue * 0.001;
    updatedOrder.fees.total = updatedOrder.fees.trading + updatedOrder.fees.network;
  }
  
  return updatedOrder;
}

async function cancelTradingOrder({ orderId, userId }) {
  // Simula cancellazione ordine
  const order = await getOrderById(orderId, userId);
  
  if (!order) {
    throw new Error('Ordine non trovato');
  }
  
  if (order.status !== 'open' && order.status !== 'partially_filled') {
    throw new Error('Impossibile cancellare ordine non aperto');
  }
  
  const cancelledOrder = {
    ...order,
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return cancelledOrder;
}

async function getOrderById(orderId, userId) {
  // Simula recupero ordine per ID
  const allOrders = await getAllUserOrders(userId);
  return allOrders.find(order => order.id === orderId);
}

function calculateOrdersSummary(orders) {
  const summary = {
    total: orders.length,
    open: 0,
    filled: 0,
    cancelled: 0,
    partially_filled: 0,
    totalVolume: 0,
    totalFees: 0,
    avgOrderSize: 0,
    successRate: 0
  };
  
  orders.forEach(order => {
    summary[order.status]++;
    summary.totalVolume += order.totalValue;
    summary.totalFees += order.fees.total;
  });
  
  summary.avgOrderSize = summary.totalVolume / orders.length || 0;
  summary.successRate = ((summary.filled + summary.partially_filled) / orders.length * 100) || 0;
  
  return summary;
}

function generateMockOrders(userId) {
  const mockOrders = [
    {
      id: 'order_001',
      type: 'buy',
      assetId: 'PROP001',
      tokenSymbol: 'MHTN.OFFICE',
      quantity: 10,
      price: 2600.00,
      status: 'open',
      created_at: '2024-02-20T10:30:00Z'
    },
    {
      id: 'order_002',
      type: 'sell',
      assetId: 'GOLD001',
      tokenSymbol: 'GOLD.RESERVE',
      quantity: 50,
      price: 95.00,
      status: 'filled',
      created_at: '2024-02-19T14:15:00Z'
    }
  ];
  
  return {
    orders: mockOrders,
    total: mockOrders.length,
    pagination: { page: 1, limit: 20, pages: 1 },
    summary: {
      total: 2,
      open: 1,
      filled: 1,
      totalVolume: 30750.00
    }
  };
}

