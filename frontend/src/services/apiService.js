// API Service per comunicazione con backend XRPL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Metodo per impostare il token di autenticazione
  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Metodo per fare richieste HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Aggiungi token di autenticazione se disponibile
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Metodi GET
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Metodi POST
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Metodi PUT
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Metodi DELETE
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // === XRPL API Methods ===

  // Health check
  async healthCheck() {
    return this.get('/health');
  }

  // Wallet operations
  async generateWallet() {
    return this.post('/api/xrpl/wallet/generate');
  }

  async importWallet(seed) {
    return this.post('/api/xrpl/wallet/import', { seed });
  }

  async getWalletInfo(address) {
    return this.get(`/api/xrpl/wallet/info/${address}`);
  }

  async getWalletBalance(address) {
    return this.get(`/api/xrpl/wallet/balance/${address}`);
  }

  async subscribeToWallet(address) {
    return this.post('/api/xrpl/wallet/subscribe', { address });
  }

  // Transaction operations
  async sendXRP(fromAddress, toAddress, amount, seed) {
    return this.post('/api/xrpl/transaction/send', {
      fromAddress,
      toAddress,
      amount,
      seed
    });
  }

  async getTransactionHistory(address, limit = 20) {
    return this.get(`/api/xrpl/transaction/history/${address}?limit=${limit}`);
  }

  async getTransactionDetails(txHash) {
    return this.get(`/api/xrpl/transaction/${txHash}`);
  }

  // Token operations
  async createToken(tokenData) {
    return this.post('/api/xrpl/token/create', tokenData);
  }

  async getTokens(address) {
    return this.get(`/api/xrpl/token/list/${address}`);
  }

  async transferToken(fromAddress, toAddress, currency, amount, issuer, seed) {
    return this.post('/api/xrpl/token/transfer', {
      fromAddress,
      toAddress,
      currency,
      amount,
      issuer,
      seed
    });
  }

  // Authentication
  async loginWithWallet(address, signature) {
    const response = await this.post('/api/auth/wallet-login', {
      address,
      signature
    });
    
    if (response.token) {
      this.setAuthToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.setAuthToken(null);
    return this.post('/api/auth/logout');
  }

  async getCurrentUser() {
    return this.get('/api/auth/me');
  }

  // User operations
  async getUserProfile() {
    return this.get('/api/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.put('/api/user/profile', profileData);
  }

  async getUserWallets() {
    return this.get('/api/user/wallets');
  }

  async addUserWallet(walletData) {
    return this.post('/api/user/wallets', walletData);
  }

  // Asset tokenization
  async tokenizeAsset(assetData) {
    return this.post('/api/assets/tokenize', assetData);
  }

  async getUserAssets() {
    return this.get('/api/assets/user');
  }

  async getAssetDetails(assetId) {
    return this.get(`/api/assets/${assetId}`);
  }

  async updateAsset(assetId, updateData) {
    return this.put(`/api/assets/${assetId}`, updateData);
  }

  // Market data
  async getMarketData() {
    return this.get('/api/market/data');
  }

  async getXRPPrice() {
    return this.get('/api/market/xrp-price');
  }

  // Analytics
  async getDashboardData() {
    return this.get('/api/analytics/dashboard');
  }

  async getPortfolioSummary() {
    return this.get('/api/analytics/portfolio');
  }
}

// Esporta un'istanza singleton
export default new ApiService();

