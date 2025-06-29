// SolCraft Nexus - User Management API
// Integrazione XRPL + Supabase basata su studio approfondito

import { createClient } from '@supabase/supabase-js'
import { Client, Wallet } from 'xrpl'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Configurazione
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// XRPL Client Configuration
const XRPL_NETWORKS = {
  mainnet: 'wss://xrplcluster.com',
  testnet: 'wss://s.altnet.rippletest.net:51233',
  devnet: 'wss://s.devnet.rippletest.net:51233'
}

export default async function handler(req, res) {
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
      case 'register':
        return await registerUser(req, res)
      case 'login':
        return await loginUser(req, res)
      case 'profile':
        return await getUserProfile(req, res)
      case 'create-xrpl-account':
        return await createXRPLAccount(req, res)
      case 'verify-kyc':
        return await verifyKYC(req, res)
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }
  } catch (error) {
    console.error('User API Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}

// =============================================
// USER REGISTRATION & AUTHENTICATION
// =============================================

async function registerUser(req, res) {
  const { email, password, fullName, username } = req.body
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email,
        username,
        full_name: fullName,
        password_hash: hashedPassword,
        kyc_status: 'pending',
        kyc_level: 1,
        is_active: true
      }])
      .select()
      .single()
    
    if (error) {
      return res.status(400).json({ error: error.message })
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'solcraft-nexus-secret',
      { expiresIn: '7d' }
    )
    
    // Create session
    await supabase
      .from('user_sessions')
      .insert([{
        user_id: user.id,
        session_token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
      }])
    
    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        kycStatus: user.kyc_status
      },
      token
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body
  
  try {
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'solcraft-nexus-secret',
      { expiresIn: '7d' }
    )
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        kycStatus: user.kyc_status,
        xrplAddress: user.xrpl_address
      },
      token
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// =============================================
// XRPL INTEGRATION
// =============================================

async function createXRPLAccount(req, res) {
  const { network = 'testnet' } = req.body
  const userId = req.user?.id // From JWT middleware
  
  try {
    // Connect to XRPL
    const client = new Client(XRPL_NETWORKS[network])
    await client.connect()
    
    // Generate new wallet
    const wallet = Wallet.generate()
    
    // For testnet, fund the account
    if (network === 'testnet') {
      await client.fundWallet(wallet)
    }
    
    // Get account info
    const accountInfo = await client.request({
      command: 'account_info',
      account: wallet.address,
      ledger_index: 'validated'
    })
    
    // Store in database
    const { data: xrplAccount, error } = await supabase
      .from('xrpl_accounts')
      .insert([{
        user_id: userId,
        address: wallet.address,
        public_key: wallet.publicKey,
        account_sequence: accountInfo.result.account_data.Sequence,
        balance: parseFloat(accountInfo.result.account_data.Balance) / 1000000, // Convert drops to XRP
        network,
        is_active: true
      }])
      .select()
      .single()
    
    if (error) {
      await client.disconnect()
      return res.status(400).json({ error: error.message })
    }
    
    // Update user with XRPL address
    await supabase
      .from('users')
      .update({ 
        xrpl_address: wallet.address,
        xrpl_public_key: wallet.publicKey
      })
      .eq('id', userId)
    
    await client.disconnect()
    
    return res.status(201).json({
      success: true,
      account: {
        address: wallet.address,
        publicKey: wallet.publicKey,
        balance: xrplAccount.balance,
        network,
        sequence: xrplAccount.account_sequence
      },
      // Note: Private key should be handled securely in production
      privateKey: wallet.privateKey // Only for development/testing
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// =============================================
// KYC & COMPLIANCE
// =============================================

async function verifyKYC(req, res) {
  const { 
    firstName, 
    lastName, 
    dateOfBirth, 
    countryCode, 
    documentType, 
    documentNumber 
  } = req.body
  const userId = req.user?.id
  
  try {
    // Update user KYC information
    const { data: user, error } = await supabase
      .from('users')
      .update({
        full_name: `${firstName} ${lastName}`,
        country_code: countryCode,
        kyc_status: 'verified', // In production, this would be 'pending' until manual review
        kyc_level: 2
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      return res.status(400).json({ error: error.message })
    }
    
    // Log KYC verification in audit trail
    await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        action: 'kyc_verification_submitted',
        resource_type: 'user',
        resource_id: userId,
        new_values: {
          document_type: documentType,
          document_number: documentNumber,
          country_code: countryCode
        }
      }])
    
    return res.status(200).json({
      success: true,
      message: 'KYC verification submitted successfully',
      kycStatus: user.kyc_status,
      kycLevel: user.kyc_level
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// =============================================
// USER PROFILE
// =============================================

async function getUserProfile(req, res) {
  const userId = req.user?.id
  
  try {
    // Get user with XRPL accounts
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        xrpl_accounts (
          address,
          balance,
          network,
          is_active
        )
      `)
      .eq('id', userId)
      .single()
    
    if (userError) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Get portfolio summary
    const { data: holdings } = await supabase
      .from('mpt_holdings')
      .select(`
        balance,
        total_invested,
        mpt_tokens (
          name,
          symbol,
          current_supply
        )
      `)
      .eq('user_id', userId)
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        kycStatus: user.kyc_status,
        kycLevel: user.kyc_level,
        countryCode: user.country_code,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      xrplAccounts: user.xrpl_accounts,
      portfolio: {
        holdings: holdings || [],
        totalAssets: holdings?.length || 0,
        totalInvested: holdings?.reduce((sum, h) => sum + (h.total_invested || 0), 0) || 0
      }
    })
    
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// =============================================
// MIDDLEWARE FUNCTIONS
// =============================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'solcraft-nexus-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

