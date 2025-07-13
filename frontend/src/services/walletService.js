/**
 * Solcraft Nexus - Real Wallet Service
 * XRPL testnet wallet integration via backend proxy
 */

class WalletService {
  constructor() {
    this.connectedWallet = null;
    this.userAddress = null;
    this.authToken = null;
    this.backendUrl = process.env.REACT_APP_BACKEND_URL;
  }

  // Check if wallet is connected
  isConnected() {
    return this.connectedWallet !== null && this.userAddress !== null;
  }

  // Get current user address
  getCurrentAddress() {
    return this.userAddress;
  }

  // Get auth token
  getAuthToken() {
    return this.authToken;
  }

  // XUMM Wallet Connection via Backend Proxy
  async connectXumm() {
    try {
      console.log('Connecting to XUMM wallet via backend proxy...');
      
      // Create XUMM connection request through backend
      const response = await fetch(`${this.backendUrl}/api/wallet/xumm/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'XUMM connection request failed');
      }

      const xummData = await response.json();
      console.log('XUMM payload created:', xummData);

      // Show QR code and deep link to user
      const userChoice = await this.showXummConnectionModal(xummData);
      
      if (userChoice === 'qr') {
        // User wants to scan QR code
        window.open(xummData.qr_url, '_blank', 'width=400,height=400');
      } else if (userChoice === 'deeplink') {
        // User wants to use deep link
        window.open(xummData.deep_link, '_self');
      } else {
        throw new Error('User cancelled XUMM connection');
      }

      // Poll for connection result
      const connectionResult = await this.pollXummConnection(xummData.payload_uuid);
      
      if (connectionResult.success && connectionResult.connected) {
        return await this.handleSuccessfulConnection('xumm', connectionResult.address, null, connectionResult);
      } else {
        throw new Error('XUMM connection was not completed');
      }
    } catch (error) {
      console.error('XUMM connection error:', error);
      throw new Error(`XUMM connection failed: ${error.message}`);
    }
  }

  // Show XUMM connection modal to user
  async showXummConnectionModal(xummData) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 10000; font-family: Arial, sans-serif;
      `;
      
      modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 2rem; border-radius: 1rem; max-width: 400px; width: 90%; border: 1px solid rgba(99, 102, 241, 0.3); text-align: center;">
          <h3 style="color: white; margin-bottom: 1rem;">Connect XUMM Wallet</h3>
          <p style="color: #94a3b8; margin-bottom: 1.5rem;">Choose how to connect your XUMM wallet:</p>
          
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <button id="qr-option" style="
              background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; 
              padding: 1rem; border: none; border-radius: 0.5rem; font-size: 1rem; 
              font-weight: 600; cursor: pointer; transition: all 0.3s ease;
            ">
              📱 Scan QR Code
            </button>
            
            <button id="deeplink-option" style="
              background: linear-gradient(135deg, #10b981, #059669); color: white; 
              padding: 1rem; border: none; border-radius: 0.5rem; font-size: 1rem; 
              font-weight: 600; cursor: pointer; transition: all 0.3s ease;
            ">
              🚀 Open XUMM App
            </button>
            
            <button id="cancel-option" style="
              background: transparent; border: 1px solid #6366f1; color: #6366f1; 
              padding: 1rem; border-radius: 0.5rem; font-size: 1rem; 
              font-weight: 600; cursor: pointer; transition: all 0.3s ease;
            ">
              Cancel
            </button>
          </div>
          
          <div style="margin-top: 1rem; font-size: 0.875rem; color: #64748b;">
            <p>Expires in: <span id="timer">${Math.floor((new Date(xummData.expires_at) - new Date()) / 1000)}s</span></p>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Timer countdown
      const timer = modal.querySelector('#timer');
      const expireTime = new Date(xummData.expires_at);
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expireTime - new Date()) / 1000));
        timer.textContent = `${remaining}s`;
        if (remaining === 0) {
          clearInterval(interval);
          document.body.removeChild(modal);
          resolve('expired');
        }
      }, 1000);
      
      // Event listeners
      modal.querySelector('#qr-option').onclick = () => {
        clearInterval(interval);
        document.body.removeChild(modal);
        resolve('qr');
      };
      
      modal.querySelector('#deeplink-option').onclick = () => {
        clearInterval(interval);
        document.body.removeChild(modal);
        resolve('deeplink');
      };
      
      modal.querySelector('#cancel-option').onclick = () => {
        clearInterval(interval);
        document.body.removeChild(modal);
        resolve('cancel');
      };
    });
  }

  // Poll XUMM connection status
  async pollXummConnection(payloadUuid, maxAttempts = 30) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const poll = async () => {
        try {
          attempts++;
          console.log(`Polling XUMM connection (${attempts}/${maxAttempts}):`, payloadUuid);
          
          const response = await fetch(`${this.backendUrl}/api/wallet/xumm/${payloadUuid}/result`);
          
          if (!response.ok) {
            throw new Error('Failed to check XUMM status');
          }
          
          const result = await response.json();
          
          if (result.success && result.connected) {
            console.log('XUMM wallet connected:', result);
            resolve(result);
          } else if (result.cancelled || result.expired) {
            reject(new Error('XUMM connection was cancelled or expired'));
          } else if (attempts >= maxAttempts) {
            reject(new Error('XUMM connection timeout'));
          } else {
            // Continue polling
            setTimeout(poll, 2000);
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            // Retry on error
            setTimeout(poll, 2000);
          }
        }
      };
      
      poll();
    });
  }

  // Crossmark Wallet Connection
  async connectCrossmark() {
    try {
      console.log('Connecting to Crossmark wallet...');

      // Check if Crossmark is installed
      if (typeof window.xrpl === 'undefined' || !window.xrpl.crossmark) {
        throw new Error('Crossmark wallet extension not found. Please install Crossmark.');
      }

      // Request connection to Crossmark
      const response = await window.xrpl.crossmark.signIn();
      
      if (response && response.response && response.response.data) {
        const address = response.response.data.address;
        console.log('Crossmark connected:', address);
        return await this.handleSuccessfulConnection('crossmark', address);
      } else {
        throw new Error('Crossmark connection failed or was cancelled');
      }
    } catch (error) {
      console.error('Crossmark connection error:', error);
      throw new Error(`Crossmark connection failed: ${error.message}`);
    }
  }

  // Web3Auth Social Login
  async connectWeb3Auth() {
    try {
      console.log('Connecting with Web3Auth...');
      
      // For now, simulate Web3Auth connection
      // In real implementation, you'd integrate Web3Auth SDK
      const socialProvider = prompt('Choose social provider:\n1. Google\n2. Twitter\n3. GitHub\n4. Discord\n\nEnter number (1-4):');
      
      if (!socialProvider || !['1', '2', '3', '4'].includes(socialProvider)) {
        throw new Error('Invalid social provider selected');
      }

      const providers = {
        '1': 'Google',
        '2': 'Twitter', 
        '3': 'GitHub',
        '4': 'Discord'
      };

      const providerName = providers[socialProvider];
      console.log(`Connecting with ${providerName}...`);

      // Simulate successful social login
      const userConfirmed = window.confirm(`Login with ${providerName}?\n\nThis will create a new XRPL address for you.`);
      
      if (userConfirmed) {
        // Generate a new XRPL address for the user
        const simulatedAddress = `rSolcraft${providerName}${Date.now().toString().slice(-6)}`;
        return await this.handleSuccessfulConnection('web3auth', simulatedAddress, providerName);
      } else {
        throw new Error('User cancelled Web3Auth connection');
      }
    } catch (error) {
      console.error('Web3Auth connection error:', error);
      throw new Error(`Web3Auth connection failed: ${error.message}`);
    }
  }

  // Handle successful wallet connection
  async handleSuccessfulConnection(walletType, address, provider = null, connectionData = null) {
    try {
      // Validate address format (basic check)
      if (!address || address.length < 25) {
        throw new Error('Invalid XRPL address received');
      }

      console.log(`${walletType} wallet connected successfully:`, address);

      // If we already have connection data from XUMM backend, use it
      if (connectionData && connectionData.token) {
        this.connectedWallet = walletType;
        this.userAddress = address;
        this.authToken = connectionData.token;

        // Store in localStorage for persistence
        localStorage.setItem('solcraft_wallet_type', walletType);
        localStorage.setItem('solcraft_wallet_address', address);
        localStorage.setItem('solcraft_auth_token', connectionData.token);

        return {
          success: true,
          walletType: walletType,
          address: address,
          balanceXrp: connectionData.balance_xrp,
          message: connectionData.message,
          provider: provider
        };
      }

      // Otherwise, send connection to backend (for non-XUMM wallets)
      const response = await fetch(`${this.backendUrl}/api/wallet/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_type: walletType,
          address: address,
          network: 'testnet',
          provider: provider
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Backend connection failed');
      }

      const backendConnectionData = await response.json();
      
      // Store connection data
      this.connectedWallet = walletType;
      this.userAddress = address;
      this.authToken = backendConnectionData.token;

      // Store in localStorage for persistence
      localStorage.setItem('solcraft_wallet_type', walletType);
      localStorage.setItem('solcraft_wallet_address', address);
      localStorage.setItem('solcraft_auth_token', backendConnectionData.token);

      return {
        success: true,
        walletType: walletType,
        address: address,
        balanceXrp: backendConnectionData.balance_xrp,
        message: backendConnectionData.message,
        provider: provider
      };
    } catch (error) {
      console.error('Connection handling error:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnect() {
    try {
      this.connectedWallet = null;
      this.userAddress = null;
      this.authToken = null;

      // Clear localStorage
      localStorage.removeItem('solcraft_wallet_type');
      localStorage.removeItem('solcraft_wallet_address');
      localStorage.removeItem('solcraft_auth_token');

      console.log('Wallet disconnected successfully');
      return { success: true, message: 'Wallet disconnected' };
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }

  // Restore connection from localStorage
  async restoreConnection() {
    try {
      const walletType = localStorage.getItem('solcraft_wallet_type');
      const address = localStorage.getItem('solcraft_wallet_address');
      const token = localStorage.getItem('solcraft_auth_token');

      if (walletType && address && token) {
        // Verify the connection is still valid
        const response = await fetch(`${this.backendUrl}/api/wallet/${address}/balance`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          this.connectedWallet = walletType;
          this.userAddress = address;
          this.authToken = token;

          console.log('Wallet connection restored:', { walletType, address });
          return {
            success: true,
            walletType,
            address,
            restored: true
          };
        } else {
          // Token expired or invalid, clear storage
          this.disconnect();
          return { success: false, message: 'Session expired' };
        }
      }

      return { success: false, message: 'No previous connection found' };
    } catch (error) {
      console.error('Restore connection error:', error);
      return { success: false, message: 'Failed to restore connection' };
    }
  }

  // Get wallet balance
  async getBalance(address = null) {
    try {
      const targetAddress = address || this.userAddress;
      if (!targetAddress) {
        throw new Error('No wallet address available');
      }

      const response = await fetch(`${this.backendUrl}/api/wallet/${targetAddress}/balance`, {
        headers: this.authToken ? {
          'Authorization': `Bearer ${this.authToken}`,
        } : {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get balance');
      }

      const balanceData = await response.json();
      return balanceData;
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactions(address = null, limit = 20) {
    try {
      const targetAddress = address || this.userAddress;
      if (!targetAddress) {
        throw new Error('No wallet address available');
      }

      const response = await fetch(`${this.backendUrl}/api/wallet/${targetAddress}/transactions?limit=${limit}`, {
        headers: this.authToken ? {
          'Authorization': `Bearer ${this.authToken}`,
        } : {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get transactions');
      }

      const transactionData = await response.json();
      return transactionData;
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  }

  // Make authenticated API call
  async authenticatedRequest(endpoint, options = {}) {
    try {
      if (!this.authToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.backendUrl}/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const walletService = new WalletService();
export default walletService;