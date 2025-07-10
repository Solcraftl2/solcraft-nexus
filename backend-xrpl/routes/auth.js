const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const DatabaseService = require('../services/DatabaseService');
const XRPLService = require('../services/XRPLService');

/**
 * POST /api/auth/wallet-login
 * Login con wallet XRPL
 */
router.post('/wallet-login', async (req, res) => {
  try {
    const { address, signature, message } = req.body;
    
    if (!address || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Address, signature e message sono richiesti',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verifica che l'indirizzo sia valido
    if (!XRPLService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    // TODO: Implementare verifica firma (richiede libreria crypto aggiuntiva)
    // Per ora accettiamo il login se l'indirizzo è valido
    
    // Cerca o crea utente
    let user = await DatabaseService.getUser(address);
    if (!user) {
      user = await DatabaseService.saveUser({
        walletAddress: address,
        email: null,
        username: `user_${address.slice(-8)}`
      });
    }
    
    // Genera JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        walletAddress: address,
        type: 'wallet'
      },
      process.env.JWT_SECRET || 'solcraft-nexus-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          username: user.username,
          email: user.email,
          createdAt: user.created_at
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore wallet login:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/auth/register
 * Registrazione utente
 */
router.post('/register', async (req, res) => {
  try {
    const { walletAddress, email, username } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address è richiesto',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!XRPLService.isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Indirizzo wallet non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verifica se l'utente esiste già
    const existingUser = await DatabaseService.getUser(walletAddress);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Utente già registrato con questo wallet',
        timestamp: new Date().toISOString()
      });
    }
    
    // Crea nuovo utente
    const user = await DatabaseService.saveUser({
      walletAddress,
      email,
      username: username || `user_${walletAddress.slice(-8)}`
    });
    
    // Genera JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        walletAddress: user.wallet_address,
        type: 'wallet'
      },
      process.env.JWT_SECRET || 'solcraft-nexus-secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          username: user.username,
          email: user.email,
          createdAt: user.created_at
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/auth/me
 * Ottieni informazioni utente corrente
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await DatabaseService.getUser(req.user.walletAddress);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore get user:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/auth/profile
 * Aggiorna profilo utente
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun dato da aggiornare',
        timestamp: new Date().toISOString()
      });
    }
    
    const user = await DatabaseService.updateUser(req.user.walletAddress, updateData);
    
    res.json({
      success: true,
      data: {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        email: user.email,
        updatedAt: user.updated_at
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore aggiornamento profilo:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/auth/refresh
 * Rinnova token JWT
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Genera nuovo token
    const token = jwt.sign(
      { 
        userId: req.user.userId,
        walletAddress: req.user.walletAddress,
        type: 'wallet'
      },
      process.env.JWT_SECRET || 'solcraft-nexus-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: { token },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Errore refresh token:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Middleware di autenticazione
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token di accesso richiesto',
      timestamp: new Date().toISOString()
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'solcraft-nexus-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token non valido',
        timestamp: new Date().toISOString()
      });
    }
    
    req.user = user;
    next();
  });
}

module.exports = router;

