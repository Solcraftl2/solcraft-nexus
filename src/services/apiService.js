import { toast } from 'sonner'

// Simulate API responses locally since serverless functions have issues
const SIMULATE_API = true

class ApiService {
  constructor() {
    this.baseURL = '/api'
    this.token = localStorage.getItem('solcraft_token')
  }

  // Set authentication token
  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('solcraft_token', token)
    } else {
      localStorage.removeItem('solcraft_token')
    }
  }

  // Simulate JWT token creation
  createJWTToken(userData) {
    const payload = {
      user_id: userData.id,
      email: userData.email,
      name: userData.name,
      auth_method: userData.auth_method || 'oauth',
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    }
    return btoa(JSON.stringify(payload)) // Simple base64 encoding for demo
  }

  // Simulate OAuth user data
  simulateOAuthUser(provider) {
    const users = {
      google: {
        id: 'google_123456789',
        name: 'Utente Google',
        email: 'utente@gmail.com',
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
        provider: 'google'
      },
      github: {
        id: 'github_987654321',
        name: 'Utente GitHub',
        email: 'utente@github.com',
        avatar: 'https://avatars.githubusercontent.com/u/default',
        provider: 'github'
      },
      apple: {
        id: 'apple_456789123',
        name: 'Utente Apple',
        email: 'utente@icloud.com',
        avatar: 'https://cdn.apple.com/default-avatar',
        provider: 'apple'
      }
    }
    return users[provider] || users.google
  }

  // Simulate wallet user data
  simulateWalletUser(address) {
    return {
      id: `wallet_${address.slice(0, 10)}`,
      name: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
      email: `${address.slice(0, 10)}@wallet.local`,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
      auth_method: 'wallet',
      wallet_address: address
    }
  }

  // Generic request method with simulation
  async request(endpoint, options = {}) {
    if (SIMULATE_API) {
      return this.simulateRequest(endpoint, options)
    }

    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API Request Error:', error)
      throw error
    }
  }

  // Simulate API requests locally
  async simulateRequest(endpoint, options = {}) {
    // Add realistic delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    const method = options.method || 'GET'
    const data = options.body ? JSON.parse(options.body) : {}

    // Handle different endpoints
    if (endpoint.includes('/auth/oauth/')) {
      const provider = endpoint.split('/').pop()
      const userData = this.simulateOAuthUser(provider)
      userData.auth_method = provider
      const token = this.createJWTToken(userData)

      return {
        success: true,
        message: `Login ${provider} completato!`,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          provider: provider
        },
        token: token
      }
    }

    if (endpoint.includes('/auth/wallet')) {
      const address = data.address
      if (!address) {
        throw new Error('Indirizzo wallet richiesto')
      }

      const userData = this.simulateWalletUser(address)
      const token = this.createJWTToken(userData)

      return {
        success: true,
        message: 'Wallet connesso con successo!',
        user: userData,
        token: token
      }
    }

    // Default response for other endpoints
    return {
      success: true,
      message: 'Operazione completata',
      data: {}
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // Authentication APIs
  async loginWithOAuth(provider, authData) {
    try {
      const response = await this.post(`/auth/oauth/${provider}`, authData)
      if (response.success && response.token) {
        this.setToken(response.token)
      }
      return response
    } catch (error) {
      toast.error(`Errore login ${provider}: ${error.message}`)
      throw error
    }
  }

  async authenticateWallet(walletData) {
    try {
      const response = await this.post('/auth/wallet', walletData)
      if (response.success && response.token) {
        this.setToken(response.token)
      }
      return response
    } catch (error) {
      toast.error(`Errore autenticazione wallet: ${error.message}`)
      throw error
    }
  }

  async logout() {
    try {
      this.setToken(null)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  // Assets APIs
  async getAssets(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = queryParams ? `/assets?${queryParams}` : '/assets'
      return await this.get(endpoint)
    } catch (error) {
      toast.error('Errore caricamento asset')
      throw error
    }
  }

  async getAssetDetails(assetId) {
    try {
      return await this.get(`/assets/${assetId}`)
    } catch (error) {
      toast.error('Errore caricamento dettagli asset')
      throw error
    }
  }

  async investInAsset(assetId, amount) {
    try {
      const response = await this.post(`/assets/${assetId}/invest`, { amount })
      if (response.success) {
        toast.success('Investimento completato con successo!')
      }
      return response
    } catch (error) {
      toast.error(`Errore investimento: ${error.message}`)
      throw error
    }
  }

  // Tokenization APIs
  async createTokenization(tokenData) {
    try {
      const response = await this.post('/tokenization/create', tokenData)
      if (response.success) {
        toast.success('Processo di tokenizzazione avviato!')
      }
      return response
    } catch (error) {
      toast.error(`Errore tokenizzazione: ${error.message}`)
      throw error
    }
  }

  async getTokenizationStatus(tokenId) {
    try {
      return await this.get(`/tokenization/status/${tokenId}`)
    } catch (error) {
      toast.error('Errore stato tokenizzazione')
      throw error
    }
  }

  // Pools APIs
  async getPools() {
    try {
      return await this.get('/pools')
    } catch (error) {
      toast.error('Errore caricamento pool')
      throw error
    }
  }

  async getPoolDetails(poolId) {
    try {
      return await this.get(`/pools/${poolId}`)
    } catch (error) {
      toast.error('Errore dettagli pool')
      throw error
    }
  }

  async stakeInPool(poolId, amount) {
    try {
      const response = await this.post(`/pools/${poolId}/stake`, { amount })
      if (response.success) {
        toast.success('Staking completato con successo!')
      }
      return response
    } catch (error) {
      toast.error(`Errore staking: ${error.message}`)
      throw error
    }
  }

  async getPoolRewards(poolId) {
    try {
      return await this.get(`/pools/${poolId}/rewards`)
    } catch (error) {
      toast.error('Errore caricamento rewards')
      throw error
    }
  }

  // Wallet APIs
  async getWalletBalance() {
    try {
      return await this.get('/wallet/balance')
    } catch (error) {
      toast.error('Errore caricamento balance')
      throw error
    }
  }

  async getTransactions() {
    try {
      return await this.get('/wallet/transactions')
    } catch (error) {
      toast.error('Errore caricamento transazioni')
      throw error
    }
  }

  async sendTransaction(transactionData) {
    try {
      const response = await this.post('/wallet/send', transactionData)
      if (response.success) {
        toast.success('Transazione inviata con successo!')
      }
      return response
    } catch (error) {
      toast.error(`Errore transazione: ${error.message}`)
      throw error
    }
  }

  // Health check
  async healthCheck() {
    try {
      return await this.get('/health')
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }

  // API info
  async getApiInfo() {
    try {
      return await this.get('/info')
    } catch (error) {
      console.error('API info failed:', error)
      throw error
    }
  }
}

// Create singleton instance
const apiService = new ApiService()

export default apiService

