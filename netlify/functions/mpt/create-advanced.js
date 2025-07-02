import { logger } from '../utils/logger.js';

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

import { Client, Wallet } from 'xrpl'

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
    logger.error('Function error:', error);
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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  const client = new Client('wss://s1.ripple.com')
  
  try {
    await client.connect()
    
    const { 
      issuerSeed,
      metadata,
      maximumAmount,
      transferFee = 0,
      flags = 0,
      assetScale = 0
    } = req.body
    
    if (!issuerSeed || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Issuer seed and metadata are required'
      })
    }
    
    const issuerWallet = Wallet.fromSeed(issuerSeed)
    
    // Prepare MPT metadata
    const metadataString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    const metadataHex = Buffer.from(metadataString).toString('hex').toUpperCase()
    
    // Prepare MPT Creation Transaction
    const mptCreate = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: issuerWallet.address,
      MPTokenMetadata: metadataHex
    }
    
    // Add optional fields
    if (maximumAmount) {
      mptCreate.MaximumAmount = maximumAmount.toString()
    }
    
    if (transferFee > 0) {
      mptCreate.TransferFee = transferFee
    }
    
    if (flags > 0) {
      mptCreate.Flags = flags
    }
    
    if (assetScale > 0) {
      mptCreate.AssetScale = assetScale
    }
    
    // Auto-fill and submit transaction
    const prepared = await client.autofill(mptCreate)
    const signed = issuerWallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    
    // Extract MPT ID from transaction result
    let mptId = null
    if (result.result.meta && result.result.meta.CreatedNode) {
      const createdNodes = Array.isArray(result.result.meta.CreatedNode) 
        ? result.result.meta.CreatedNode 
        : [result.result.meta.CreatedNode]
      
      for (const node of createdNodes) {
        if (node.NewFields && node.NewFields.MPTokenID) {
          mptId = node.NewFields.MPTokenID
          break
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        hash: result.result.hash,
        mpt_id: mptId,
        issuer: issuerWallet.address,
        metadata: metadataString,
        maximum_amount: maximumAmount,
        transfer_fee: transferFee,
        flags: flags,
        asset_scale: assetScale,
        transaction: result.result,
        ledger_index: result.result.ledger_index,
        validated: result.result.validated
      }
    })
    
  } catch (error) {
    logger.error('MPT creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Multi-Purpose Token'
    })
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}

