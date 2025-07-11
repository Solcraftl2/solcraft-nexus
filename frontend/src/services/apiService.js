// API Service per comunicazione con backend XRPL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://3001-i2wkidfmlls5uonvlwixz-11c7e098.manusvm.computer/api' 
  : 'https://3001-i2wkidfmlls5uonvlwixz-11c7e098.manusvm.computer/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  // Utility per chiamate HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      
      // Fallback per demo mode quando backend non è disponibile
      if (error.message.includes('fetch')) {
        return this.getDemoData(endpoint);
      }
      
      throw error;
    }
  }

  // Dati demo per quando il backend non è disponibile
  getDemoData(endpoint) {
    const demoData = {
      '/xrpl/wallet/generate': {
        success: true,
        data: {
          address: 'rDemo1234567890Demo1234567890',
          seed: 'demo seed phrase for testing purposes only',
          privateKey: 'demo_private_key',
          balance: 1000
        }
      },
      '/wallet/portfolio': {
        success: true,
        data: {
          totalValue: 125750,
          xrpBalance: 2450,
          tokensCount: 7,
          performance: 15.8
        }
      },
      '/wallet/transactions': {
        success: true,
        data: [
          { id: 1, type: 'send', amount: -150, currency: 'XRP', to: 'rN7n...8kL2', timestamp: Date.now() - 3600000 },
          { id: 2, type: 'receive', amount: 500, currency: 'XRP', from: 'rM4k...9pQ1', timestamp: Date.now() - 7200000 },
          { id: 3, type: 'tokenize', amount: 0, asset: 'Appartamento Milano', timestamp: Date.now() - 86400000 }
        ]
      },
      '/tokens/user': {
        success: true,
        data: [
          { id: 1, symbol: 'MILAPP', name: 'Appartamento Milano', value: 450000, performance: 12.5 },
          { id: 2, symbol: 'ARTCOL', name: 'Collezione Arte', value: 85000, performance: 18.2 }
        ]
      },
      '/market/data': {
        success: true,
        data: {
          xrp: { price: 0.52, change: 8.2 },
          btc: { price: 42150, change: -2.1 },
          eth: { price: 2890, change: 5.7 }
        }
      }
    };

    // Trova il match più vicino per l'endpoint
    const matchingKey = Object.keys(demoData).find(key => endpoint.includes(key.replace('/api', '')));
    return demoData[matchingKey] || { success: false, error: 'Demo data not available' };
  }

  // === WALLET OPERATIONS ===

  async generateWallet() {
    return this.request('/xrpl/wallet/generate', {
      method: 'POST'
    });
  }

  async importWallet(seedPhrase) {
    return this.request('/xrpl/wallet/import', {
      method: 'POST',
      body: JSON.stringify({ seedPhrase })
    });
  }

  async getAccountInfo(address) {
    return this.request(`/xrpl/account/${address}`);
  }

  async getWalletBalance(address) {
    return this.request(`/wallet/balance/${address}`);
  }

  // === PORTFOLIO OPERATIONS ===

  async getPortfolio(address) {
    return this.request(`/wallet/portfolio/${address}`);
  }

  async getTransactions(address, options = {}) {
    const params = new URLSearchParams(options).toString();
    return this.request(`/wallet/transactions/${address}?${params}`);
  }

  async getUserTokens(address) {
    return this.request(`/tokens/user/${address}`);
  }

  // === TOKENIZATION OPERATIONS ===

  async estimateTokenizationCosts(data) {
    return this.request('/tokens/estimate-costs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createToken(tokenizationData) {
    return this.request('/tokens/create', {
      method: 'POST',
      body: JSON.stringify(tokenizationData)
    });
  }

  async getTokenDetails(tokenId) {
    return this.request(`/tokens/${tokenId}`);
  }

  async transferToken(tokenId, toAddress, amount) {
    return this.request('/tokens/transfer', {
      method: 'POST',
      body: JSON.stringify({ tokenId, toAddress, amount })
    });
  }

  // === MARKET DATA ===

  async getMarketData() {
    return this.request('/market/data');
  }

  async getTokenPrice(symbol) {
    return this.request(`/market/price/${symbol}`);
  }

  // === TRANSACTION OPERATIONS ===

  async sendXRP(fromAddress, toAddress, amount, memo = '') {
    return this.request('/xrpl/send', {
      method: 'POST',
      body: JSON.stringify({ fromAddress, toAddress, amount, memo })
    });
  }

  async getTransactionHistory(address, limit = 50) {
    return this.request(`/xrpl/transactions/${address}?limit=${limit}`);
  }

  async getTransactionDetails(txHash) {
    return this.request(`/xrpl/transaction/${txHash}`);
  }

  // === DEX OPERATIONS ===

  async getOrderBook(baseCurrency, quoteCurrency) {
    return this.request(`/dex/orderbook/${baseCurrency}/${quoteCurrency}`);
  }

  async createOrder(orderData) {
    return this.request('/dex/order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async cancelOrder(orderId) {
    return this.request(`/dex/order/${orderId}`, {
      method: 'DELETE'
    });
  }

  // === ANALYTICS ===

  async getPortfolioAnalytics(address, timeframe = '30d') {
    return this.request(`/analytics/portfolio/${address}?timeframe=${timeframe}`);
  }

  async getTokenAnalytics(tokenId, timeframe = '30d') {
    return this.request(`/analytics/token/${tokenId}?timeframe=${timeframe}`);
  }

  // === AUTHENTICATION ===

  async authenticateWallet(address, signature) {
    const response = await this.request('/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({ address, signature })
    });

    if (response.success && response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
    }

    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    return { success: true };
  }

  // === REAL-TIME UPDATES ===

  subscribeToUpdates(address, callback) {
    // WebSocket connection per aggiornamenti real-time
    const wsUrl = this.baseURL.replace('http', 'ws').replace('/api', '/ws');
    
    try {
      const ws = new WebSocket(`${wsUrl}?address=${address}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return ws;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      return null;
    }
  }

  // === UTILITY METHODS ===

  formatXRP(amount) {
    return `${parseFloat(amount).toLocaleString()} XRP`;
  }

  formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  validateXRPAddress(address) {
    // Validazione base per indirizzi XRPL
    return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
  }

  generateQRCode(data) {
    // Genera QR code per indirizzi o dati di pagamento
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  }

  // === HEALTH CHECK ===

  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      return { 
        success: false, 
        error: 'Backend not available - running in demo mode',
        demo: true 
      };
    }
  }
}

// Esporta istanza singleton
export const apiService = new ApiService();
export default apiService;

