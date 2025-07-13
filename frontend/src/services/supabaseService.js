import { createClient } from '@supabase/supabase-js'

// Configurazione Supabase per Solcraft Nexus
const supabaseUrl = 'https://dtzlkcqddjaoubrjnzjw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0emxrY3FkZGphb3Vicmpuemp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzE1NDgsImV4cCI6MjA2NjUwNzU0OH0.eYJhbGc1OjJIUzI1NiIsInR5cCI6IkpXVCJ9'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================================
// WALLET MANAGEMENT
// ============================================================================

// Registra un nuovo wallet connesso
export const registerWallet = async (walletData) => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .upsert({
        address: walletData.address,
        wallet_type: walletData.type,
        network: walletData.network || 'testnet',
        balance_xrp: walletData.balance || 0,
        xumm_user_token: walletData.xummUserToken || null,
        metadata: walletData.metadata || {},
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'address'
      })
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error registering wallet:', error)
    return { success: false, error: error.message }
  }
}

// Ottieni informazioni wallet
export const getWallet = async (address) => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('address', address)
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting wallet:', error)
    return { success: false, error: error.message }
  }
}

// Aggiorna balance wallet
export const updateWalletBalance = async (address, balance) => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .update({
        balance_xrp: balance,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('address', address)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating wallet balance:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// TOKENIZATION MANAGEMENT
// ============================================================================

// Crea una nuova tokenizzazione
export const createTokenization = async (tokenData) => {
  try {
    const { data, error } = await supabase
      .from('tokenizations')
      .insert({
        asset_name: tokenData.assetName,
        asset_type: tokenData.assetType,
        asset_description: tokenData.description,
        asset_value_usd: tokenData.valueUsd,
        token_symbol: tokenData.tokenSymbol,
        token_supply: tokenData.tokenSupply || 1000000,
        token_decimals: tokenData.tokenDecimals || 6,
        issuer_address: tokenData.issuerAddress,
        owner_address: tokenData.ownerAddress,
        metadata: tokenData.metadata || {},
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating tokenization:', error)
    return { success: false, error: error.message }
  }
}

// Aggiorna stato tokenizzazione
export const updateTokenizationStatus = async (id, status, txnHashes = []) => {
  try {
    const { data, error } = await supabase
      .from('tokenizations')
      .update({
        status,
        txn_hashes: txnHashes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating tokenization status:', error)
    return { success: false, error: error.message }
  }
}

// Ottieni tokenizzazioni per owner
export const getTokenizationsByOwner = async (ownerAddress) => {
  try {
    const { data, error } = await supabase
      .from('tokenizations')
      .select('*')
      .eq('owner_address', ownerAddress)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting tokenizations:', error)
    return { success: false, error: error.message }
  }
}

// Ottieni tutte le tokenizzazioni attive
export const getActiveTokenizations = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('tokenizations')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting active tokenizations:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

// Registra una nuova transazione
export const createTransaction = async (transactionData) => {
  try {
    const { data, error } = await supabase
      .from('token_transactions')
      .insert({
        transaction_type: transactionData.type,
        token_symbol: transactionData.tokenSymbol,
        issuer_address: transactionData.issuerAddress,
        from_address: transactionData.fromAddress,
        to_address: transactionData.toAddress,
        amount: transactionData.amount,
        txn_hash: transactionData.txnHash,
        xumm_payload_uuid: transactionData.xummPayloadUuid,
        status: transactionData.status || 'pending',
        metadata: transactionData.metadata || {}
      })
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating transaction:', error)
    return { success: false, error: error.message }
  }
}

// Aggiorna stato transazione
export const updateTransactionStatus = async (id, status, txnHash = null) => {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (txnHash) {
      updateData.txn_hash = txnHash
    }
    
    const { data, error } = await supabase
      .from('token_transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating transaction status:', error)
    return { success: false, error: error.message }
  }
}

// Ottieni transazioni per wallet
export const getTransactionsByWallet = async (walletAddress, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .or(`from_address.eq.${walletAddress},to_address.eq.${walletAddress}`)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting transactions:', error)
    return { success: false, error: error.message }
  }
}

// Ottieni transazioni per token
export const getTransactionsByToken = async (tokenSymbol, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('token_symbol', tokenSymbol)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting token transactions:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// PLATFORM STATS
// ============================================================================

// Ottieni statistiche piattaforma
export const getPlatformStats = async () => {
  try {
    const { data, error } = await supabase
      .from('platform_stats')
      .select('*')
      .eq('date_recorded', new Date().toISOString().split('T')[0])
    
    if (error) throw error
    
    // Converte array in oggetto per facilità d'uso
    const stats = {}
    data.forEach(stat => {
      stats[stat.metric_name] = {
        value: parseFloat(stat.metric_value),
        type: stat.metric_type
      }
    })
    
    return { success: true, data: stats }
  } catch (error) {
    console.error('Error getting platform stats:', error)
    return { success: false, error: error.message }
  }
}

// Aggiorna statistica piattaforma
export const updatePlatformStat = async (metricName, value, type = 'counter') => {
  try {
    const { data, error } = await supabase
      .from('platform_stats')
      .upsert({
        metric_name: metricName,
        metric_value: value,
        metric_type: type,
        date_recorded: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'metric_name,date_recorded'
      })
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating platform stat:', error)
    return { success: false, error: error.message }
  }
}

// Incrementa contatore piattaforma
export const incrementPlatformCounter = async (metricName, increment = 1) => {
  try {
    // Prima ottieni il valore attuale
    const { data: currentStats } = await getPlatformStats()
    const currentValue = currentStats[metricName]?.value || 0
    
    // Poi aggiorna con il nuovo valore
    return await updatePlatformStat(metricName, currentValue + increment, 'counter')
  } catch (error) {
    console.error('Error incrementing platform counter:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

// Sottoscrizione per aggiornamenti wallet
export const subscribeToWalletUpdates = (walletAddress, callback) => {
  return supabase
    .channel(`wallet_${walletAddress}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `address=eq.${walletAddress}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'token_transactions',
        filter: `from_address=eq.${walletAddress}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'token_transactions',
        filter: `to_address=eq.${walletAddress}`
      },
      callback
    )
    .subscribe()
}

// Sottoscrizione per aggiornamenti tokenizzazioni
export const subscribeToTokenizationUpdates = (ownerAddress, callback) => {
  return supabase
    .channel(`tokenizations_${ownerAddress}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tokenizations',
        filter: `owner_address=eq.${ownerAddress}`
      },
      callback
    )
    .subscribe()
}

// Sottoscrizione per statistiche piattaforma
export const subscribeToPlatformStats = (callback) => {
  return supabase
    .channel('platform_stats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'platform_stats'
      },
      callback
    )
    .subscribe()
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Test connessione database
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('platform_stats')
      .select('count')
      .limit(1)
    
    if (error) throw error
    
    return {
      success: true,
      message: 'Connessione Supabase attiva',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// Gestione errori Supabase
export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error)
  
  if (error.message?.includes('paused') || error.message?.includes('inactive')) {
    return {
      success: false,
      error: 'Database temporaneamente non disponibile. Il progetto Supabase è in pausa.',
      code: 'PROJECT_PAUSED',
      retry: true
    }
  }
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      success: false,
      error: 'Errore di connessione al database. Riprova tra qualche istante.',
      code: 'NETWORK_ERROR',
      retry: true
    }
  }
  
  return {
    success: false,
    error: error.message || 'Errore database sconosciuto',
    code: 'UNKNOWN_ERROR',
    retry: false
  }
}

export default supabase

