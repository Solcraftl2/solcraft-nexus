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

import { Client } from 'xrpl'

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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const client = new Client('wss://s1.ripple.com')
  
  try {
    await client.connect()
    
    const { account } = req.query
    
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Account address is required'
      })
    }
    
    // Get account info
    const accountInfo = await client.request({
      command: 'account_info',
      account: account,
      ledger_index: 'validated'
    })
    
    // Get account objects (including MPTs)
    const accountObjects = await client.request({
      command: 'account_objects',
      account: account,
      ledger_index: 'validated'
    })
    
    // Get trust lines
    const accountLines = await client.request({
      command: 'account_lines',
      account: account,
      ledger_index: 'validated'
    })
    
    // Process account flags
    const flags = accountInfo.result.account_data.Flags || 0
    const accountFlags = {
      defaultRipple: !!(flags & 0x00800000),
      depositAuth: !!(flags & 0x01000000),
      disableMasterKey: !!(flags & 0x00100000),
      disallowIncomingCheck: !!(flags & 0x08000000),
      disallowIncomingNFTokenOffer: !!(flags & 0x04000000),
      disallowIncomingPayChan: !!(flags & 0x10000000),
      disallowIncomingTrustline: !!(flags & 0x20000000),
      disallowIncomingXRP: !!(flags & 0x00080000),
      globalFreeze: !!(flags & 0x00400000),
      noFreeze: !!(flags & 0x00200000),
      passwordSpent: !!(flags & 0x00010000),
      requireAuthorization: !!(flags & 0x00040000),
      requireDestinationTag: !!(flags & 0x00020000)
    }
    
    // Calculate portfolio
    const portfolio = {
      xrp: {
        balance: accountInfo.result.account_data.Balance,
        balance_formatted: (parseInt(accountInfo.result.account_data.Balance) / 1000000).toFixed(6),
        reserve: accountInfo.result.account_data.OwnerCount * 2000000 + 10000000,
        available: Math.max(0, parseInt(accountInfo.result.account_data.Balance) - (accountInfo.result.account_data.OwnerCount * 2000000 + 10000000))
      },
      tokens: accountLines.result.lines.map(line => ({
        currency: line.currency,
        issuer: line.account,
        balance: line.balance,
        limit: line.limit,
        quality_in: line.quality_in,
        quality_out: line.quality_out,
        no_ripple: line.no_ripple,
        freeze: line.freeze
      })),
      mpts: accountObjects.result.account_objects
        .filter(obj => obj.LedgerEntryType === 'MPToken')
        .map(obj => ({
          mpt_id: obj.MPTokenID,
          balance: obj.MPTAmount,
          metadata: obj.MPTokenMetadata ? Buffer.from(obj.MPTokenMetadata, 'hex').toString() : null,
          flags: obj.Flags
        })),
      nfts: accountObjects.result.account_objects
        .filter(obj => obj.LedgerEntryType === 'NFTokenPage')
        .reduce((acc, page) => {
          if (page.NFTokens) {
            acc.push(...page.NFTokens.map(nft => ({
              nft_id: nft.NFTokenID,
              uri: nft.URI ? Buffer.from(nft.URI, 'hex').toString() : null,
              flags: nft.Flags
            })))
          }
          return acc
        }, [])
    }
    
    res.status(200).json({
      success: true,
      data: {
        account_data: accountInfo.result.account_data,
        account_flags: accountFlags,
        portfolio: portfolio,
        ledger_index: accountInfo.result.ledger_index,
        validated: accountInfo.result.validated
      }
    })
    
  } catch (error) {
    console.error('Account info error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account information'
    })
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}

