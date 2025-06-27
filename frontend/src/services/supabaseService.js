import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Asset Categories
export const getAssetCategories = async () => {
  const { data, error } = await supabase
    .from('asset_categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

// Assets
export const getAssets = async (categoryId = null, featured = false) => {
  let query = supabase
    .from('assets')
    .select(`
      *,
      asset_categories(name, icon),
      asset_details(details, financials, highlights)
    `)
    .eq('status', 'active')
  
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  
  if (featured) {
    query = query.eq('featured', true)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// User Portfolio
export const getUserPortfolio = async (userId) => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      assets(name, symbol, token_price, asset_categories(name, icon))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// User Transactions
export const getUserTransactions = async (userId, limit = 10) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      assets(name, symbol, asset_categories(name, icon))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// User Orders
export const getUserOrders = async (userId, status = null) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      assets(name, symbol, token_price, asset_categories(name, icon))
    `)
    .eq('user_id', userId)
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Watchlist
export const getUserWatchlist = async (userId) => {
  const { data, error } = await supabase
    .from('watchlist')
    .select(`
      *,
      assets(name, symbol, token_price, expected_yield, asset_categories(name, icon))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const addToWatchlist = async (userId, assetId) => {
  const { data, error } = await supabase
    .from('watchlist')
    .insert({ user_id: userId, asset_id: assetId })
    .select()
  
  if (error) throw error
  return data
}

export const removeFromWatchlist = async (userId, assetId) => {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('asset_id', assetId)
  
  if (error) throw error
}

// User Profile
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Notifications
export const getUserNotifications = async (userId, unreadOnly = false) => {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
  
  if (unreadOnly) {
    query = query.eq('read', false)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const markNotificationAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  
  if (error) throw error
}

// Create Order
export const createOrder = async (orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Real-time subscriptions
export const subscribeToUserData = (userId, callback) => {
  return supabase
    .channel(`user_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'portfolios',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

