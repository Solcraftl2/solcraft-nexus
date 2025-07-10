const express = require('express');
const router = express.Router();
const XRPLService = require('../services/XRPLService');
const RedisService = require('../services/RedisService');

/**
 * GET /api/wallet/balance/:address
 * Ottieni bilancio wallet con caching Redis
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Rate limiting check
    const rateLimitKey = `${req.ip}:wallet_balance`;
    const rateLimitOk = await RedisService.checkRateLimit(rateLimitKey, 60, 60); // 60 requests per minute
    
    if (!rateLimitOk) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Try again later.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check cache first
    const cachedBalance = await RedisService.getCachedWalletBalance(address);
    if (cachedBalance) {
      return res.json({
        success: true,
        data: {
          ...cachedBalance,
          cached: true
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Get fresh data from XRPL
    const accountInfo = await XRPLService.getAccountInfo(address);
    
    // Cache the result
    await RedisService.cacheWalletBalance(address, accountInfo, 30); // Cache for 30 seconds
    
    res.json({
      success: true,
      data: {
        ...accountInfo,
        cached: false
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore bilancio wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/wallet/transactions/:address
 * Ottieni transazioni wallet con caching
 */
router.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 20, marker } = req.query;
    
    // Rate limiting
    const rateLimitKey = `${req.ip}:wallet_transactions`;
    const rateLimitOk = await RedisService.checkRateLimit(rateLimitKey, 30, 60);
    
    if (!rateLimitOk) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Try again later.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Create cache key with parameters
    const cacheKey = `transactions:${address}:${limit}:${marker || 'none'}`;
    const cached = await RedisService.redis.get(cacheKey);
    
    if (cached) {
      const cachedData = JSON.parse(cached);
      return res.json({
        success: true,
        data: {
          ...cachedData,
          cached: true
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Get fresh data
    const transactions = await XRPLService.getAccountTransactions(address, { limit, marker });
    
    // Cache for 60 seconds
    await RedisService.redis.setex(cacheKey, 60, JSON.stringify(transactions));
    
    res.json({
      success: true,
      data: {
        ...transactions,
        cached: false
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore transazioni wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/wallet/session
 * Crea sessione utente
 */
router.post('/session', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address, signature e message sono richiesti',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verify signature (simplified - in production use proper verification)
    const sessionData = {
      walletAddress,
      loginTime: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    // Store session in Redis
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await RedisService.storeSession(sessionId, sessionData, 3600); // 1 hour
    
    // Track active wallet
    await RedisService.trackActiveWallet(walletAddress);
    
    res.json({
      success: true,
      data: {
        sessionId,
        walletAddress,
        expiresIn: 3600
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore creazione sessione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/wallet/session/:sessionId
 * Ottieni sessione utente
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const sessionData = await RedisService.getSession(sessionId);
    
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'Sessione non trovata o scaduta',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: sessionData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore recupero sessione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/wallet/session/:sessionId
 * Elimina sessione utente
 */
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await RedisService.deleteSession(sessionId);
    
    res.json({
      success: true,
      message: 'Sessione eliminata',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore eliminazione sessione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/wallet/active
 * Ottieni wallet attivi
 */
router.get('/active', async (req, res) => {
  try {
    const activeWallets = await RedisService.getActiveWallets();
    
    res.json({
      success: true,
      data: {
        count: activeWallets.length,
        wallets: activeWallets
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore wallet attivi:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

