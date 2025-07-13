/**
 * Solcraft Nexus - Tokenization Service Frontend
 * Real asset tokenization functionality
 */

import walletService from './walletService';

class TokenizationService {
  constructor() {
    this.backendUrl = process.env.REACT_APP_BACKEND_URL;
  }

  // Create new asset tokenization
  async createAssetTokenization(assetData) {
    try {
      console.log('Creating asset tokenization:', assetData);

      if (!walletService.isConnected()) {
        throw new Error('Please connect your wallet first');
      }

      const response = await walletService.authenticatedRequest('/tokenize/asset', {
        method: 'POST',
        body: JSON.stringify(assetData),
      });

      console.log('Tokenization created:', response);
      return response;
    } catch (error) {
      console.error('Create tokenization error:', error);
      throw error;
    }
  }

  // Create trustline for token
  async createTrustline(tokenizationId, userAddress = null) {
    try {
      const address = userAddress || walletService.getCurrentAddress();
      if (!address) {
        throw new Error('No wallet address available');
      }

      console.log('Creating trustline for tokenization:', tokenizationId);

      const response = await fetch(`${this.backendUrl}/api/tokenize/${tokenizationId}/trustline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_address: address,
          token_symbol: '', // Will be filled by backend
          issuer_address: '', // Will be filled by backend
          limit: '1000000'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create trustline');
      }

      const trustlineData = await response.json();
      console.log('Trustline creation initiated:', trustlineData);
      return trustlineData;
    } catch (error) {
      console.error('Create trustline error:', error);
      throw error;
    }
  }

  // Issue tokens
  async issueTokens(tokenizationId, recipientAddress, amount) {
    try {
      console.log('Issuing tokens:', { tokenizationId, recipientAddress, amount });

      const response = await walletService.authenticatedRequest(`/tokenize/${tokenizationId}/issue`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_address: recipientAddress,
          amount: amount
        }),
      });

      console.log('Token issuance initiated:', response);
      return response;
    } catch (error) {
      console.error('Issue tokens error:', error);
      throw error;
    }
  }

  // Transfer tokens
  async transferTokens(transferData) {
    try {
      console.log('Transferring tokens:', transferData);

      const response = await walletService.authenticatedRequest('/tokens/transfer', {
        method: 'POST',
        body: JSON.stringify(transferData),
      });

      console.log('Token transfer initiated:', response);
      return response;
    } catch (error) {
      console.error('Transfer tokens error:', error);
      throw error;
    }
  }

  // Transfer XRP
  async transferXrp(toAddress, amount) {
    try {
      const fromAddress = walletService.getCurrentAddress();
      if (!fromAddress) {
        throw new Error('No wallet connected');
      }

      console.log('Transferring XRP:', { fromAddress, toAddress, amount });

      const response = await walletService.authenticatedRequest('/tokens/xrp/transfer', {
        method: 'POST',
        body: JSON.stringify({
          from_address: fromAddress,
          to_address: toAddress,
          amount_xrp: amount
        }),
      });

      console.log('XRP transfer initiated:', response);
      return response;
    } catch (error) {
      console.error('Transfer XRP error:', error);
      throw error;
    }
  }

  // Get tokenization details
  async getTokenizationDetails(tokenizationId) {
    try {
      const response = await fetch(`${this.backendUrl}/api/tokenize/${tokenizationId}`, {
        headers: walletService.getAuthToken() ? {
          'Authorization': `Bearer ${walletService.getAuthToken()}`,
        } : {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get tokenization details');
      }

      const tokenizationData = await response.json();
      return tokenizationData;
    } catch (error) {
      console.error('Get tokenization details error:', error);
      throw error;
    }
  }

  // Check transaction status
  async checkTransactionStatus(transactionId) {
    try {
      const response = await fetch(`${this.backendUrl}/api/transactions/${transactionId}/status`, {
        headers: walletService.getAuthToken() ? {
          'Authorization': `Bearer ${walletService.getAuthToken()}`,
        } : {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get transaction status');
      }

      const statusData = await response.json();
      return statusData;
    } catch (error) {
      console.error('Check transaction status error:', error);
      throw error;
    }
  }

  // Check XUMM payload status
  async checkXummStatus(payloadUuid) {
    try {
      const response = await fetch(`${this.backendUrl}/api/xumm/${payloadUuid}/status`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get XUMM status');
      }

      const statusData = await response.json();
      return statusData;
    } catch (error) {
      console.error('Check XUMM status error:', error);
      throw error;
    }
  }

  // Poll transaction status until completion
  async pollTransactionStatus(transactionId, maxAttempts = 30, interval = 2000) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const poll = async () => {
        try {
          attempts++;
          console.log(`Polling transaction status (attempt ${attempts}/${maxAttempts}):`, transactionId);
          
          const status = await this.checkTransactionStatus(transactionId);
          
          if (status.status === 'validated') {
            console.log('Transaction validated:', status);
            resolve(status);
          } else if (status.status === 'failed') {
            console.log('Transaction failed:', status);
            reject(new Error('Transaction failed'));
          } else if (attempts >= maxAttempts) {
            console.log('Transaction polling timeout');
            reject(new Error('Transaction status polling timeout'));
          } else {
            // Continue polling
            setTimeout(poll, interval);
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            // Retry on error
            setTimeout(poll, interval);
          }
        }
      };
      
      poll();
    });
  }

  // Get user's tokenized assets
  async getUserTokens(address = null) {
    try {
      const targetAddress = address || walletService.getCurrentAddress();
      if (!targetAddress) {
        throw new Error('No wallet address available');
      }

      const balanceData = await walletService.getBalance(targetAddress);
      return {
        success: true,
        tokens: balanceData.tokens,
        total_tokens: balanceData.total_tokens
      };
    } catch (error) {
      console.error('Get user tokens error:', error);
      throw error;
    }
  }

  // Asset type configurations
  getAssetTypes() {
    return [
      {
        id: 'real_estate',
        name: 'Real Estate',
        icon: '🏠',
        description: 'Tokenize property investments with instant liquidity',
        color: 'from-blue-500 to-purple-600',
        fields: ['location', 'property_type', 'size_sqft', 'legal_entity']
      },
      {
        id: 'art',
        name: 'Art & Collectibles',
        icon: '🎨',
        description: 'Transform artistic assets into tradeable NFTs',
        color: 'from-pink-500 to-orange-500',
        fields: ['artist', 'year_created', 'medium', 'provenance']
      },
      {
        id: 'insurance',
        name: 'Insurance & Risk',
        icon: '🛡️',
        description: 'Tokenize policies, guarantees, and risk instruments',
        color: 'from-green-500 to-blue-500',
        fields: ['policy_type', 'coverage_amount', 'expiry_date', 'insurer']
      },
      {
        id: 'carbon_credits',
        name: 'Carbon Credits',
        icon: '🌱',
        description: 'Trade sustainability tokens for environmental impact',
        color: 'from-green-400 to-emerald-600',
        fields: ['project_type', 'verification_standard', 'vintage_year', 'geography']
      },
      {
        id: 'commodities',
        name: 'Physical Assets',
        icon: '🚗',
        description: 'Commodities and tangible asset tokenization',
        color: 'from-yellow-500 to-red-500',
        fields: ['commodity_type', 'grade', 'storage_location', 'certification']
      }
    ];
  }

  // Validate asset data before tokenization
  validateAssetData(assetData) {
    const errors = [];

    if (!assetData.asset_name || assetData.asset_name.trim().length < 3) {
      errors.push('Asset name must be at least 3 characters');
    }

    if (!assetData.asset_type) {
      errors.push('Asset type is required');
    }

    if (!assetData.asset_description || assetData.asset_description.trim().length < 10) {
      errors.push('Asset description must be at least 10 characters');
    }

    if (!assetData.asset_value_usd || assetData.asset_value_usd <= 0) {
      errors.push('Asset value must be greater than 0');
    }

    if (assetData.token_supply && (assetData.token_supply < 1 || assetData.token_supply > 100000000)) {
      errors.push('Token supply must be between 1 and 100,000,000');
    }

    if (assetData.token_symbol && (assetData.token_symbol.length < 3 || assetData.token_symbol.length > 20)) {
      errors.push('Token symbol must be between 3 and 20 characters');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Format currency amounts
  formatCurrency(amount, currency = 'USD') {
    if (currency === 'XRP') {
      return `${parseFloat(amount).toFixed(6)} XRP`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Format token amount
  formatTokenAmount(amount, symbol, decimals = 6) {
    const formatted = parseFloat(amount).toFixed(decimals);
    return `${formatted} ${symbol}`;
  }

  // Calculate token value in USD
  calculateTokenValue(tokenAmount, assetValueUsd, totalSupply) {
    if (!totalSupply || totalSupply === 0) return 0;
    return (tokenAmount / totalSupply) * assetValueUsd;
  }
}

// Create singleton instance
export const tokenizationService = new TokenizationService();
export default tokenizationService;