const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');

// Import routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const tokenRoutes = require('./routes/tokens');
const transactionRoutes = require('./routes/transactions');
const xrplRoutes = require('./routes/xrpl');

// Import services
const XRPLService = require('./services/XRPLService');
const DatabaseService = require('./services/DatabaseService');
const RedisService = require('./services/RedisService');

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    xrpl_connected: XRPLService.isConnected(),
    database_connected: DatabaseService.isConnected(),
    redis_connected: RedisService.isConnected()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/xrpl', xrplRoutes);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to SolCraft Nexus XRPL Backend',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message received:', data);

      switch (data.type) {
        case 'subscribe_wallet':
          // Subscribe to wallet updates
          if (data.address) {
            ws.walletAddress = data.address;
            console.log(`Subscribed to wallet updates: ${data.address}`);
          }
          break;

        case 'subscribe_ledger':
          // Subscribe to ledger updates
          ws.subscribedToLedger = true;
          console.log('Subscribed to ledger updates');
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// XRPL Event Broadcasting
XRPLService.on('ledgerClosed', (ledger) => {
  // Broadcast ledger updates to subscribed clients
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && client.subscribedToLedger) {
      client.send(JSON.stringify({
        type: 'ledger_update',
        data: {
          ledger_index: ledger.ledger_index,
          txn_count: ledger.txn_count,
          close_time: ledger.close_time
        },
        timestamp: new Date().toISOString()
      }));
    }
  });
});

XRPLService.on('transaction', (transaction) => {
  // Broadcast transaction updates to relevant wallet subscribers
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && client.walletAddress) {
      const tx = transaction.transaction;
      if (tx.Account === client.walletAddress || tx.Destination === client.walletAddress) {
        client.send(JSON.stringify({
          type: 'transaction_update',
          data: transaction,
          timestamp: new Date().toISOString()
        }));
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      timestamp: new Date().toISOString()
    }
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting SolCraft Nexus XRPL Backend...');

    // Initialize Redis connection
    try {
      await RedisService.connect();
      console.log('✅ Redis connected');
    } catch (error) {
      console.log('⚠️  Redis not available - caching disabled');
    }

    // Initialize database connection
    const dbResult = await DatabaseService.initialize();
    if (dbResult.success) {
      console.log('✅ Database connected');
    } else {
      console.log('⚠️  Database not configured - limited functionality');
    }

    // Initialize XRPL connection
    await XRPLService.connect(process.env.XRPL_NETWORK || 'testnet');
    console.log('✅ XRPL connected');

    // Start server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server ready`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Close WebSocket server
  wss.close();
  
  // Disconnect from Redis
  await RedisService.disconnect();
  
  // Disconnect from XRPL
  await XRPLService.disconnect();
  
  // Close database connection
  await DatabaseService.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  // Close WebSocket server
  wss.close();
  
  // Disconnect from Redis
  await RedisService.disconnect();
  
  // Disconnect from XRPL
  await XRPLService.disconnect();
  
  // Close database connection
  await DatabaseService.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, server, wss };

