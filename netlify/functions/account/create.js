const Sentry = require('./../utils/sentry.js');

const { parse } = require('querystring');

// Helper per compatibilità Vercel -> Netlify
function createReqRes(event) {
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? (event.headers['content-type']?.includes('application/json') ? JSON.parse(event.body) : parse(event.body)) : {},
    query: event.queryStringParameters || {},
    ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || '127.0.0.1'
  };
  
  const res = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: '',
    
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    json: function(data) {
      this.body = JSON.stringify(data);
      return this;
    },
    
    end: function(data) {
      if (data) this.body = data;
      return this;
    },
    
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    }
  };
  
  return { req, res };
}

import { getXRPLClient, initializeXRPL, walletFromSeed } from '../config/xrpl.js';
import { Wallet } from 'xrpl';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST for account creation.' 
    })
  }

  try {
    // Verifica autenticazione
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

    const {
      accountType = 'standard', // standard, issuing, operational
      purpose = 'general', // general, tokenization, trading
      initialFunding = false,
      masterKeyDisable = false,
      requireDestinationTag = false,
      defaultRipple = false,
      emailHash,
      domain
    } = req.body;

    // Genera nuovo wallet XRPL
    const newWallet = Wallet.generate();
    
    const accountData = {
      address: newWallet.address,
      publicKey: newWallet.publicKey,
      // Non salvare mai la private key in produzione!
      privateKey: process.env.NODE_ENV === 'development' ? newWallet.privateKey : '[PROTECTED]',
      seed: process.env.NODE_ENV === 'development' ? newWallet.seed : '[PROTECTED]',
      accountType: accountType,
      purpose: purpose,
      createdAt: new Date().toISOString(),
      createdBy: decoded.userId,
      status: 'created', // created, funded, configured, active
      network: process.env.XRPL_NETWORK || 'testnet'
    };

    // Configurazioni account specifiche
    const accountSettings = {
      masterKeyDisable: masterKeyDisable,
      requireDestinationTag: requireDestinationTag,
      defaultRipple: defaultRipple,
      emailHash: emailHash,
      domain: domain,
      flags: {
        requireAuth: false,
        requireDest: requireDestinationTag,
        disallowXRP: false,
        disableMaster: masterKeyDisable,
        noFreeze: false,
        globalFreeze: false
      }
    };

    // Se richiesto funding iniziale (solo testnet)
    let fundingResult = null;
    if (initialFunding && process.env.XRPL_NETWORK === 'testnet') {
      try {
        await initializeXRPL();
        const client = getXRPLClient();
        
        // Usa il faucet testnet per funding iniziale
        const fundResponse = await client.fundWallet(newWallet);
        if (fundResponse) {
          fundingResult = {
            success: true,
            balance: fundResponse.balance,
            txHash: fundResponse.hash || 'faucet-funding'
          };
          accountData.status = 'funded';
        }
      } catch (error) {
        console.error('Funding error:', error);
        fundingResult = {
          success: false,
          error: error.message
        };
      }
    }

    // Simula configurazione account (in produzione faresti transazioni reali)
    const configurationSteps = [];
    
    if (accountType === 'issuing') {
      configurationSteps.push({
        step: 'configure_issuing',
        description: 'Configurazione account per emissione token',
        status: 'pending',
        requiredTx: 'AccountSet'
      });
    }

    if (requireDestinationTag) {
      configurationSteps.push({
        step: 'require_destination_tag',
        description: 'Attivazione richiesta destination tag',
        status: 'pending',
        requiredTx: 'AccountSet'
      });
    }

    if (emailHash) {
      configurationSteps.push({
        step: 'set_email_hash',
        description: 'Impostazione hash email',
        status: 'pending',
        requiredTx: 'AccountSet'
      });
    }

    // Genera chiavi di sicurezza aggiuntive per account professionali
    const securityKeys = {};
    if (accountType === 'issuing' || accountType === 'operational') {
      securityKeys.regularKey = Wallet.generate().address;
      securityKeys.signerList = [
        { account: Wallet.generate().address, weight: 1 },
        { account: Wallet.generate().address, weight: 1 }
      ];
      securityKeys.quorum = 2;
    }

    const response = {
      success: true,
      message: 'Account XRPL creato con successo!',
      account: {
        ...accountData,
        settings: accountSettings,
        security: securityKeys,
        configurationSteps: configurationSteps
      },
      funding: fundingResult,
      nextSteps: [
        initialFunding ? 'Account finanziato automaticamente' : 'Finanzia l\'account con almeno 10 XRP',
        'Configura le impostazioni di sicurezza',
        accountType === 'issuing' ? 'Imposta le configurazioni per emissione token' : null,
        'Attiva l\'account per l\'uso in produzione'
      ].filter(Boolean),
      warnings: [
        'Salva in modo sicuro seed e private key',
        'Non condividere mai le chiavi private',
        process.env.NODE_ENV === 'development' ? 'Ambiente di sviluppo - chiavi visibili' : 'Ambiente produzione - chiavi protette'
      ]
    };

    // In produzione, salveresti questi dati in un database sicuro
    console.log('New XRPL account created:', {
      address: accountData.address,
      type: accountType,
      purpose: purpose,
      user: decoded.userId
    });

    return res.status(201).json(response);

  } catch (error) {
    console.error('Account creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server durante la creazione account',
      message: error.message
    });
  }
}

