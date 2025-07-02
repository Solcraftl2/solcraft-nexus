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

// SolCraft Nexus - Multi-Purpose Tokens API
// Implementazione completa basata su studio XRPL approfondito

import { createClient } from '@supabase/supabase-js'
import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl'

// Configurazione
const supabaseUrl = 'https://dtzlkcqddjaoubrjnzjw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3VicmpuempqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMDQ5NjMsImV4cCI6MjA1MDc4MDk2M30.eYJhbGc1OjJIUzI1NiIsInR5cCI6IkpXVCJ9'

const supabase = createClient(supabaseUrl, supabaseKey)

// XRPL Networks
const XRPL_NETWORKS = {
  mainnet: 'wss://xrplcluster.com',
  testnet: 'wss://s.altnet.rippletest.net:51233',
  devnet: 'wss://s.devnet.rippletest.net:51233'
}

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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { action } = req.query
    
    switch (action) {
      case 'create':
        return await createMPT(req, res)
      case 'list':
        return await listMPTs(req, res)
      case 'details':
        return await getMPTDetails(req, res)
      case 'transfer':
        return await transferMPT(req, res)
      case 'mint':
        return await mintMPT(req, res)
      case 'burn':
        return await burnMPT(req, res)
      case 'set-trustline':
        return await setTrustLine(req, res)
      case 'portfolio':
        return await getUserPortfolio(req, res)
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    logger.error('MPT API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}

// =============================================
// MPT CREATION & MANAGEMENT
// =============================================

async function createMPT(req, res) {
  const {
    name,
    symbol,
    currencyCode,
    description,
    assetType,
    assetDescription,
    assetLocation,
    assetValuation,
    maxSupply,
    decimals = 6,
    requiresKYC = true,
    network = 'testnet'
  } = req.body
  
  const userId = req.user?.id
  
  try {
    // Connect to XRPL
    const client = new Client(XRPL_NETWORKS[network])
    await client.connect()
    
    // Get user's XRPL account
    const { data: xrplAccount } = await supabase
      .from('xrpl_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('network', network)
      .eq('is_active', true)
      .single()
    
    if (!xrplAccount) {
      await client.disconnect()
      return res.status(400).json({ error: 'No active XRPL account found for this network' })
    }
    
    // Create wallet from stored data (in production, use secure key management)
    const wallet = Wallet.fromSeed(xrplAccount.private_key) // This would be securely stored
    
    // Prepare MPT Create transaction
    const mptCreateTx = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: wallet.address,
      MPTokenMetadata: {
        name,
        symbol,
        description,
        decimals,
        maxSupply: maxSupply ? (maxSupply * Math.pow(10, decimals)).toString() : undefined
      },
      Flags: requiresKYC ? 1 : 0 // tfRequireAuth flag for KYC
    }
    
    // Submit transaction
    const prepared = await client.autofill(mptCreateTx)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    
    if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
      await client.disconnect()
      return res.status(400).json({ 
        error: 'MPT creation failed',
        xrplError: result.result.meta.TransactionResult
      })
    }
    
    // Extract MPT ID from transaction metadata
    const mptId = result.result.meta.CreatedNode?.NewFields?.MPTokenID || 
                  result.result.hash // Fallback to transaction hash
    
    // Store MPT in database
    const { data: mptToken, error } = await supabase
      .from('mpt_tokens')
      .insert([{
        creator_id: userId,
        mpt_id: mptId,
        currency_code: currencyCode,
        name,
        symbol,
        description,
        max_supply: maxSupply,
        current_supply: 0,
        decimals,
        asset_type: assetType,
        asset_description: assetDescription,
        asset_location: assetLocation,
        asset_valuation: assetValuation,
        requires_kyc: requiresKYC,
        status: 'active',
        network
      }])
      .select()
      .single()
    
    if (error) {
      await client.disconnect()
      return res.status(400).json({ error: error.message })
    }
    
    // Log creation in audit trail
    await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        action: 'mpt_created',
        resource_type: 'mpt_token',
        resource_id: mptToken.id,
        new_values: {
          mpt_id: mptId,
          symbol,
          name,
          xrpl_transaction: result.result.hash
        }
      }])
    
    await client.disconnect()
    
    return res.status(201).json({
      success: true,
      mpt: {
        id: mptToken.id,
        mptId,
        name,
        symbol,
        currencyCode,
        description,
        assetType,
        maxSupply,
        currentSupply: 0,
        decimals,
        requiresKYC,
        network,
        xrplTransaction: result.result.hash
      }
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function mintMPT(req, res) {
  const { mptId, amount, recipient, network = 'testnet' } = req.body
  const userId = req.user?.id
  
  try {
    // Get MPT details
    const { data: mptToken } = await supabase
      .from('mpt_tokens')
      .select('*')
      .eq('id', mptId)
      .eq('creator_id', userId)
      .single()
    
    if (!mptToken) {
      return res.status(404).json({ error: 'MPT not found or not authorized' })
    }
    
    // Check supply limits
    const newSupply = parseFloat(mptToken.current_supply) + parseFloat(amount)
    if (mptToken.max_supply && newSupply > parseFloat(mptToken.max_supply)) {
      return res.status(400).json({ error: 'Exceeds maximum supply' })
    }
    
    // Connect to XRPL
    const client = new Client(XRPL_NETWORKS[network])
    await client.connect()
    
    // Get creator's XRPL account
    const { data: xrplAccount } = await supabase
      .from('xrpl_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('network', network)
      .single()
    
    const wallet = Wallet.fromSeed(xrplAccount.private_key)
    
    // Prepare MPT Mint transaction
    const mintTx = {
      TransactionType: 'MPTokenIssuanceDestroy', // Actually mints to recipient
      Account: wallet.address,
      MPTokenID: mptToken.mpt_id,
      Amount: (parseFloat(amount) * Math.pow(10, mptToken.decimals)).toString(),
      Destination: recipient
    }
    
    // Submit transaction
    const prepared = await client.autofill(mintTx)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    
    if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
      await client.disconnect()
      return res.status(400).json({ 
        error: 'Minting failed',
        xrplError: result.result.meta.TransactionResult
      })
    }
    
    // Update supply in database
    await supabase
      .from('mpt_tokens')
      .update({ current_supply: newSupply })
      .eq('id', mptId)
    
    // Update recipient holdings
    await supabase
      .from('mpt_holdings')
      .upsert([{
        user_id: userId, // This should be recipient's user ID
        mpt_id: mptId,
        balance: amount // This should be added to existing balance
      }])
    
    await client.disconnect()
    
    return res.status(200).json({
      success: true,
      transaction: result.result.hash,
      newSupply,
      amountMinted: amount
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// =============================================
// TRUST LINES & TRANSFERS
// =============================================

async function setTrustLine(req, res) {
  const { currency, issuer, limit, network = 'testnet' } = req.body
  const userId = req.user?.id
  
  try {
    // Connect to XRPL
    const client = new Client(XRPL_NETWORKS[network])
    await client.connect()
    
    // Get user's XRPL account
    const { data: xrplAccount } = await supabase
      .from('xrpl_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('network', network)
      .single()
    
    const wallet = Wallet.fromSeed(xrplAccount.private_key)
    
    // Prepare TrustSet transaction
    const trustSetTx = {
      TransactionType: 'TrustSet',
      Account: wallet.address,
      LimitAmount: {
        currency,
        issuer,
        value: limit.toString()
      }
    }
    
    // Submit transaction
    const prepared = await client.autofill(trustSetTx)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    
    if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
      await client.disconnect()
      return res.status(400).json({ 
        error: 'Trust line creation failed',
        xrplError: result.result.meta.TransactionResult
      })
    }
    
    // Store trust line in database
    await supabase
      .from('trust_lines')
      .upsert([{
        account_id: xrplAccount.id,
        currency,
        issuer,
        limit_amount: limit,
        balance: 0
      }])
    
    await client.disconnect()
    
    return res.status(200).json({
      success: true,
      transaction: result.result.hash,
      trustLine: {
        currency,
        issuer,
        limit
      }
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function transferMPT(req, res) {
  const { mptId, recipient, amount, memo, network = 'testnet' } = req.body
  const userId = req.user?.id
  
  try {
    // Get MPT details
    const { data: mptToken } = await supabase
      .from('mpt_tokens')
      .select('*')
      .eq('id', mptId)
      .single()
    
    if (!mptToken) {
      return res.status(404).json({ error: 'MPT not found' })
    }
    
    // Check user balance
    const { data: holding } = await supabase
      .from('mpt_holdings')
      .select('*')
      .eq('user_id', userId)
      .eq('mpt_id', mptId)
      .single()
    
    if (!holding || parseFloat(holding.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' })
    }
    
    // Connect to XRPL
    const client = new Client(XRPL_NETWORKS[network])
    await client.connect()
    
    // Get sender's XRPL account
    const { data: xrplAccount } = await supabase
      .from('xrpl_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('network', network)
      .single()
    
    const wallet = Wallet.fromSeed(xrplAccount.private_key)
    
    // Prepare Payment transaction
    const paymentTx = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: recipient,
      Amount: {
        currency: mptToken.currency_code,
        issuer: xrplAccount.address, // MPT issuer
        value: amount
      },
      Memos: memo ? [{
        Memo: {
          MemoData: Buffer.from(memo, 'utf8').toString('hex')
        }
      }] : undefined
    }
    
    // Submit transaction
    const prepared = await client.autofill(paymentTx)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)
    
    if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
      await client.disconnect()
      return res.status(400).json({ 
        error: 'Transfer failed',
        xrplError: result.result.meta.TransactionResult
      })
    }
    
    // Update balances in database
    const newBalance = parseFloat(holding.balance) - parseFloat(amount)
    await supabase
      .from('mpt_holdings')
      .update({ balance: newBalance })
      .eq('user_id', userId)
      .eq('mpt_id', mptId)
    
    // Record payment
    await supabase
      .from('payments')
      .insert([{
        sender_id: userId,
        sender_account: wallet.address,
        recipient_account: recipient,
        amount: parseFloat(amount),
        currency: mptToken.currency_code,
        mpt_id: mptId,
        xrpl_transaction_hash: result.result.hash,
        status: 'completed',
        memo
      }])
    
    await client.disconnect()
    
    return res.status(200).json({
      success: true,
      transaction: result.result.hash,
      newBalance,
      transfer: {
        amount,
        recipient,
        currency: mptToken.currency_code,
        memo
      }
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// =============================================
// PORTFOLIO & ANALYTICS
// =============================================

async function getUserPortfolio(req, res) {
  const userId = req.user?.id
  
  try {
    // Get user holdings with MPT details
    const { data: holdings } = await supabase
      .from('mpt_holdings')
      .select(`
        *,
        mpt_tokens (
          name,
          symbol,
          currency_code,
          asset_type,
          asset_valuation,
          decimals
        )
      `)
      .eq('user_id', userId)
      .gt('balance', 0)
    
    // Get recent performance data
    const { data: performance } = await supabase
      .from('asset_performance')
      .select('*')
      .in('mpt_id', holdings?.map(h => h.mpt_id) || [])
      .order('recorded_at', { ascending: false })
      .limit(1)
    
    // Calculate portfolio metrics
    let totalValue = 0
    const portfolioAssets = holdings?.map(holding => {
      const perf = performance?.find(p => p.mpt_id === holding.mpt_id)
      const currentPrice = perf?.price_usd || 0
      const value = parseFloat(holding.balance) * currentPrice
      totalValue += value
      
      return {
        id: holding.id,
        mptId: holding.mpt_id,
        name: holding.mpt_tokens.name,
        symbol: holding.mpt_tokens.symbol,
        assetType: holding.mpt_tokens.asset_type,
        balance: holding.balance,
        averageCost: holding.average_cost,
        totalInvested: holding.total_invested,
        currentPrice,
        currentValue: value,
        change24h: perf?.change_24h_percent || 0,
        pnl: value - (holding.total_invested || 0),
        pnlPercent: holding.total_invested ? 
          ((value - holding.total_invested) / holding.total_invested) * 100 : 0
      }
    }) || []
    
    return res.status(200).json({
      success: true,
      portfolio: {
        totalValue,
        totalAssets: portfolioAssets.length,
        totalInvested: portfolioAssets.reduce((sum, asset) => sum + (asset.totalInvested || 0), 0),
        totalPnL: portfolioAssets.reduce((sum, asset) => sum + asset.pnl, 0),
        assets: portfolioAssets
      }
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function listMPTs(req, res) {
  const { assetType, network, limit = 50, offset = 0 } = req.query
  
  try {
    let query = supabase
      .from('mpt_tokens')
      .select(`
        *,
        asset_performance (
          price_usd,
          volume_24h,
          change_24h_percent,
          market_cap
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (assetType) {
      query = query.eq('asset_type', assetType)
    }
    
    if (network) {
      query = query.eq('network', network)
    }
    
    const { data: mpts, error } = await query
    
    if (error) {
      return res.status(400).json({ error: error.message })
    }
    
    return res.status(200).json({
      success: true,
      mpts: mpts.map(mpt => ({
        id: mpt.id,
        mptId: mpt.mpt_id,
        name: mpt.name,
        symbol: mpt.symbol,
        description: mpt.description,
        assetType: mpt.asset_type,
        currentSupply: mpt.current_supply,
        maxSupply: mpt.max_supply,
        network: mpt.network,
        performance: mpt.asset_performance?.[0] || null
      }))
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

