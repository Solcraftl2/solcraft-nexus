/**
 * Solcraft Nexus - Marketplace Service
 * Handles all marketplace and trading operations
 */

// Get backend URL from environment
const getBackendUrl = () => {
  const currentHost = window.location.hostname;
  
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  } else if (currentHost.includes('preview.emergentagent.com')) {
    return process.env.REACT_APP_BACKEND_URL || `https://${currentHost}`;
  } else {
    return process.env.REACT_APP_BACKEND_URL || '';
  }
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

class MarketplaceService {
  constructor() {
    this.baseURL = API;
  }

  /**
   * Get marketplace assets with filtering and pagination
   */
  async getMarketplaceAssets(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const response = await fetch(`${this.baseURL}/marketplace/assets?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch marketplace assets`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching marketplace assets:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific asset
   */
  async getAssetDetails(assetId) {
    try {
      const response = await fetch(`${this.baseURL}/marketplace/assets/${assetId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch asset details`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching asset details:', error);
      throw error;
    }
  }

  /**
   * Get marketplace categories and order types
   */
  async getMarketplaceCategories() {
    try {
      const response = await fetch(`${this.baseURL}/marketplace/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch categories`);
      }

      const data = await response.json();
      return {
        categories: data.categories,
        orderTypes: data.order_types
      };
    } catch (error) {
      console.error('Error fetching marketplace categories:', error);
      throw error;
    }
  }

  /**
   * Create a new trading order
   */
  async createOrder(orderData) {
    try {
      const response = await fetch(`${this.baseURL}/marketplace/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to create order`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get user's trading orders
   */
  async getUserOrders(userId, status = null, limit = 50) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (limit) params.append('limit', limit);

      const response = await fetch(`${this.baseURL}/marketplace/orders/${userId}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch user orders`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(orderId, userId) {
    try {
      const response = await fetch(`${this.baseURL}/marketplace/orders/${orderId}?user_id=${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to cancel order`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Get trading history
   */
  async getTradingHistory(userId = null, assetId = null, limit = 100) {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (assetId) params.append('asset_id', assetId);
      if (limit) params.append('limit', limit);

      const response = await fetch(`${this.baseURL}/marketplace/trading-history?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch trading history`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching trading history:', error);
      throw error;
    }
  }

  /**
   * Calculate order total (price * quantity + fees)
   */
  calculateOrderTotal(price, quantity, orderType = 'market') {
    const subtotal = price * quantity;
    
    // Calculate fees (0.25% for market orders, 0.1% for limit orders)
    const feeRate = orderType === 'market' ? 0.0025 : 0.001;
    const fees = subtotal * feeRate;
    
    return {
      subtotal: subtotal,
      fees: fees,
      total: subtotal + fees
    };
  }

  /**
   * Format price with proper decimals
   */
  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Format percentage change
   */
  formatPercentageChange(change) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  /**
   * Get color for percentage change
   */
  getChangeColor(change) {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  /**
   * Validate order data before submission
   */
  validateOrder(orderData) {
    const errors = [];

    if (!orderData.asset_id) {
      errors.push('Asset ID is required');
    }

    if (!orderData.order_type || !['market', 'limit', 'stop'].includes(orderData.order_type)) {
      errors.push('Valid order type is required (market, limit, or stop)');
    }

    if (!orderData.side || !['buy', 'sell'].includes(orderData.side)) {
      errors.push('Valid order side is required (buy or sell)');
    }

    if (!orderData.quantity || orderData.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (orderData.order_type === 'limit' && (!orderData.price || orderData.price <= 0)) {
      errors.push('Limit orders require a positive price');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get mock real-time price updates (in production, this would use WebSocket)
   */
  async getMockPriceUpdates(assetId) {
    // Simulate real-time price updates
    return new Promise((resolve) => {
      setTimeout(() => {
        const basePrice = 250;
        const randomChange = (Math.random() - 0.5) * 0.02; // ±1% change
        const newPrice = basePrice * (1 + randomChange);
        
        resolve({
          assetId: assetId,
          price: parseFloat(newPrice.toFixed(2)),
          change: randomChange * 100,
          timestamp: new Date().toISOString()
        });
      }, 1000);
    });
  }

  /**
   * Subscribe to price updates (mock implementation)
   */
  subscribeToPriceUpdates(assetId, callback) {
    const interval = setInterval(async () => {
      try {
        const update = await this.getMockPriceUpdates(assetId);
        callback(update);
      } catch (error) {
        console.error('Error getting price update:', error);
      }
    }, 5000); // Update every 5 seconds

    // Return unsubscribe function
    return () => clearInterval(interval);
  }

  /**
   * Get trading statistics for dashboard
   */
  async getTradingStats(userId) {
    try {
      const [orders, trades] = await Promise.all([
        this.getUserOrders(userId),
        this.getTradingHistory(userId)
      ]);

      const totalOrders = orders.orders ? orders.orders.length : 0;
      const totalTrades = trades.trades ? trades.trades.length : 0;
      
      // Calculate total trading volume
      const totalVolume = trades.trades ? trades.trades.reduce((sum, trade) => {
        return sum + (trade.total_value || 0);
      }, 0) : 0;

      // Calculate pending orders
      const pendingOrders = orders.orders ? orders.orders.filter(order => 
        order.status === 'pending'
      ).length : 0;

      return {
        totalOrders,
        totalTrades,
        totalVolume,
        pendingOrders,
        averageTradeSize: totalTrades > 0 ? totalVolume / totalTrades : 0
      };

    } catch (error) {
      console.error('Error getting trading stats:', error);
      return {
        totalOrders: 0,
        totalTrades: 0,
        totalVolume: 0,
        pendingOrders: 0,
        averageTradeSize: 0
      };
    }
  }
}

// Export singleton instance
const marketplaceService = new MarketplaceService();
export default marketplaceService;