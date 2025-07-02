import { logger } from '../../../netlify/functions/utils/logger.js';
// Servizio API per integrazione con backend
import authService from './authService.js';

class ApiService {
  constructor() {
    this.baseUrl = 'http://localhost:5000/api/v1';
  }

  // Metodo generico per chiamate API
  async apiCall(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      // Aggiungi token di autenticazione se disponibile
      if (authService.isLoggedIn()) {
        config.headers.Authorization = `Bearer ${authService.getAuthToken()}`;
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      logger.error('API Error:', error);
      throw error;
    }
  }

  // === WALLET API ===
  
  // Crea wallet
  async createWallet(walletData) {
    return this.apiCall('/wallet/create', {
      method: 'POST',
      body: JSON.stringify(walletData)
    });
  }

  // Ottieni wallet utente
  async getUserWallets() {
    return this.apiCall('/wallet/list');
  }

  // Ottieni balance wallet
  async getWalletBalance(walletAddress) {
    return this.apiCall(`/wallet/balance/${walletAddress}`);
  }

  // === CRYPTO API ===
  
  // Invia crypto
  async sendCrypto(transactionData) {
    return this.apiCall('/crypto/send', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  }

  // Ricevi crypto (genera indirizzo)
  async generateReceiveAddress(currency) {
    return this.apiCall('/crypto/receive', {
      method: 'POST',
      body: JSON.stringify({ currency })
    });
  }

  // Storico transazioni
  async getTransactionHistory(page = 1, limit = 20) {
    return this.apiCall(`/crypto/transactions?page=${page}&limit=${limit}`);
  }

  // === ASSET API ===
  
  // Crea nuovo asset
  async createAsset(assetData) {
    return this.apiCall('/assets/create', {
      method: 'POST',
      body: JSON.stringify(assetData)
    });
  }

  // Lista asset utente
  async getUserAssets() {
    return this.apiCall('/assets/my-assets');
  }

  // Dettagli asset
  async getAssetDetails(assetId) {
    return this.apiCall(`/assets/${assetId}`);
  }

  // Aggiorna asset
  async updateAsset(assetId, updateData) {
    return this.apiCall(`/assets/${assetId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // === TOKENIZATION API ===
  
  // Tokenizza asset
  async tokenizeAsset(tokenizationData) {
    return this.apiCall('/tokens/create', {
      method: 'POST',
      body: JSON.stringify(tokenizationData)
    });
  }

  // Lista token
  async getTokens() {
    return this.apiCall('/tokens/list');
  }

  // Dettagli token
  async getTokenDetails(tokenId) {
    return this.apiCall(`/tokens/${tokenId}`);
  }

  // Transfer token
  async transferToken(transferData) {
    return this.apiCall('/tokens/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData)
    });
  }

  // === PORTFOLIO API ===
  
  // Ottieni portfolio
  async getPortfolio() {
    return this.apiCall('/portfolio');
  }

  // Statistiche portfolio
  async getPortfolioStats() {
    return this.apiCall('/portfolio/stats');
  }

  // === MARKETPLACE API ===
  
  // Lista asset marketplace
  async getMarketplaceAssets(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.apiCall(`/marketplace/assets?${queryParams}`);
  }

  // Compra asset
  async buyAsset(assetId, quantity) {
    return this.apiCall('/marketplace/buy', {
      method: 'POST',
      body: JSON.stringify({ asset_id: assetId, quantity })
    });
  }

  // Vendi asset
  async sellAsset(assetId, quantity, price) {
    return this.apiCall('/marketplace/sell', {
      method: 'POST',
      body: JSON.stringify({ asset_id: assetId, quantity, price })
    });
  }

  // === USER API ===
  
  // Profilo utente
  async getUserProfile() {
    return this.apiCall('/user/profile');
  }

  // Aggiorna profilo
  async updateUserProfile(profileData) {
    return this.apiCall('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // === SECURITY API ===
  
  // Abilita 2FA
  async enable2FA() {
    return this.apiCall('/security/2fa/enable', {
      method: 'POST'
    });
  }

  // Verifica 2FA
  async verify2FA(code) {
    return this.apiCall('/security/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  // === NOTIFICATIONS API ===
  
  // Ottieni notifiche
  async getNotifications() {
    return this.apiCall('/notifications');
  }

  // Segna notifica come letta
  async markNotificationRead(notificationId) {
    return this.apiCall(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  // === ANALYTICS API ===
  
  // Dati dashboard
  async getDashboardData() {
    return this.apiCall('/analytics/dashboard');
  }

  // Performance asset
  async getAssetPerformance(assetId, period = '30d') {
    return this.apiCall(`/analytics/asset/${assetId}/performance?period=${period}`);
  }
}

export default new ApiService();

