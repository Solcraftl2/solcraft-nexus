// XRPL Wallet Service
// Gestisce le connessioni e interazioni con i wallet XRPL

import { XummSdk } from 'xumm-sdk';
import sdk from '@crossmarkio/sdk';
import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES } from '@web3auth/base';

class XRPLWalletService {
  constructor() {
    this.xumm = null;
    this.crossmark = sdk;
    this.web3auth = null;
    this.connectedWallet = null;
    this.userAddress = null;
    
    this.initializeServices();
  }

  // Initialize all wallet services
  async initializeServices() {
    this.initializeXumm();
    await this.initializeWeb3Auth();
  }

  // Initialize XUMM SDK
  initializeXumm() {
    const apiKey = process.env.REACT_APP_XUMM_API_KEY || 'demo-key';
    const apiSecret = process.env.REACT_APP_XUMM_API_SECRET || 'demo-secret';
    
    try {
      this.xumm = new XummSdk(apiKey, apiSecret);
    } catch (error) {
      console.warn('XUMM SDK initialization failed:', error);
      this.xumm = null;
    }
  }

  // Initialize Web3Auth
  async initializeWeb3Auth() {
    try {
      const clientId = process.env.REACT_APP_WEB3AUTH_CLIENT_ID || 'demo-client-id';
      
      this.web3auth = new Web3Auth({
        clientId,
        web3AuthNetwork: 'sapphire_mainnet', // or testnet
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.OTHER,
          chainId: '0x1', // XRPL doesn't use standard chain IDs
          rpcTarget: 'https://xrpl.ws',
          displayName: 'XRPL Mainnet',
          blockExplorer: 'https://livenet.xrpl.org',
          ticker: 'XRP',
          tickerName: 'XRP',
        },
      });

      const openloginAdapter = new OpenloginAdapter({
        loginSettings: {
          mfaLevel: 'optional',
        },
        adapterSettings: {
          whiteLabel: {
            name: 'SolCraft Nexus',
            logoLight: 'https://solcraft-nexus.com/logo-light.png',
            logoDark: 'https://solcraft-nexus.com/logo-dark.png',
            defaultLanguage: 'it',
            dark: true,
          },
        },
      });

      this.web3auth.configureAdapter(openloginAdapter);
      await this.web3auth.initModal();
    } catch (error) {
      console.warn('Web3Auth initialization failed:', error);
      this.web3auth = null;
    }
  }

  // XUMM Wallet Methods
  async connectXumm() {
    if (!this.xumm) {
      throw new Error('XUMM SDK not initialized');
    }

    try {
      // Create sign-in payload
      const payload = {
        txjson: {
          TransactionType: 'SignIn'
        },
        options: {
          submit: false,
          multisign: false,
          expire: 5 // 5 minutes
        },
        custom_meta: {
          identifier: 'solcraft-nexus-login',
          blob: {
            purpose: 'SolCraft Nexus Platform Authentication',
            created: Date.now(),
            version: '1.0.0'
          }
        }
      };

      const xummPayload = await this.xumm.payload.create(payload);
      
      if (!xummPayload) {
        throw new Error('Failed to create XUMM payload');
      }

      return {
        uuid: xummPayload.uuid,
        qr: xummPayload.refs.qr_png,
        deeplink: xummPayload.next.always,
        websocket: xummPayload.refs.websocket_status
      };
    } catch (error) {
      console.error('XUMM connection error:', error);
      throw new Error(`XUMM connection failed: ${error.message}`);
    }
  }

  async waitForXummSignIn(uuid) {
    if (!this.xumm) {
      throw new Error('XUMM SDK not initialized');
    }

    return new Promise((resolve, reject) => {
      const subscription = this.xumm.payload.subscribe(uuid, (event) => {
        if (event.data.signed === true) {
          this.connectedWallet = 'xumm';
          this.userAddress = event.data.account;
          
          subscription.resolve();
          resolve({
            success: true,
            account: event.data.account,
            txHash: event.data.txid,
            wallet: 'xumm'
          });
        } else if (event.data.signed === false) {
          subscription.resolve();
          reject(new Error('XUMM sign-in was cancelled by user'));
        }
      });

      // Auto-cleanup after 5 minutes
      setTimeout(() => {
        subscription.resolve();
        reject(new Error('XUMM sign-in timeout'));
      }, 300000);
    });
  }

  // Crossmark Wallet Methods
  async connectCrossmark() {
    try {
      if (!this.crossmark) {
        throw new Error('Crossmark SDK not available');
      }

      // Check if Crossmark extension is installed
      const isInstalled = await this.isCrossmarkInstalled();
      if (!isInstalled) {
        throw new Error('Crossmark extension not installed. Please install from Chrome Web Store.');
      }

      // Sign in with Crossmark
      const response = await this.crossmark.async.signInAndWait();
      
      if (!response || !response.response || !response.response.data) {
        throw new Error('Invalid Crossmark response');
      }

      const userAddress = response.response.data.address;
      
      this.connectedWallet = 'crossmark';
      this.userAddress = userAddress;

      return {
        success: true,
        account: userAddress,
        wallet: 'crossmark'
      };
    } catch (error) {
      console.error('Crossmark connection error:', error);
      throw new Error(`Crossmark connection failed: ${error.message}`);
    }
  }

  async isCrossmarkInstalled() {
    try {
      // Check if Crossmark is available
      return !!this.crossmark && typeof this.crossmark.async !== 'undefined';
    } catch (error) {
      return false;
    }
  }

  // Trust Wallet Methods
  async connectTrustWallet() {
    try {
      const trustProvider = this.detectTrustWallet();
      
      if (!trustProvider) {
        // Check if mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Redirect to Trust Wallet mobile app
          const deepLink = `trust://open_url?coin_id=144&url=${encodeURIComponent(window.location.href)}`;
          window.location.href = deepLink;
          throw new Error('Redirecting to Trust Wallet mobile app...');
        } else {
          throw new Error('Trust Wallet not detected. Please install the browser extension or use mobile app.');
        }
      }

      // Request account access
      const accounts = await trustProvider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No Trust Wallet accounts available');
      }

      const userAddress = accounts[0];
      
      this.connectedWallet = 'trust';
      this.userAddress = userAddress;

      return {
        success: true,
        account: userAddress,
        wallet: 'trust'
      };
    } catch (error) {
      console.error('Trust Wallet connection error:', error);
      throw error;
    }
  }

  detectTrustWallet() {
    const isTrust = (ethereum) => {
      return !!ethereum?.isTrust || !!ethereum?.isTrustWallet;
    };

    // Search for Trust Wallet provider
    const trustProvider = 
      isTrust(window.ethereum) ||
      window.trustwallet ||
      window.ethereum?.providers?.find(
        (provider) => provider.isTrust || provider.isTrustWallet
      );

    return trustProvider;
  }

  // Web3Auth MPC Methods
  async connectWeb3Auth(loginProvider) {
    if (!this.web3auth) {
      throw new Error('Web3Auth not initialized');
    }

    try {
      const web3authProvider = await this.web3auth.connect();
      
      if (!web3authProvider) {
        throw new Error('Web3Auth connection failed');
      }

      // Get user info
      const user = await this.web3auth.getUserInfo();
      
      // Generate XRPL-compatible address (mock for now)
      const mockAddress = 'rWeb3Auth' + Math.random().toString(36).substr(2, 9);
      
      this.connectedWallet = 'web3auth';
      this.userAddress = mockAddress;

      return {
        success: true,
        account: mockAddress,
        wallet: 'web3auth',
        provider: loginProvider,
        userInfo: {
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
          verifier: user.verifier,
          verifierId: user.verifierId
        }
      };
    } catch (error) {
      console.error('Web3Auth connection error:', error);
      throw new Error(`Web3Auth ${loginProvider} connection failed: ${error.message}`);
    }
  }

  async disconnectWeb3Auth() {
    if (this.web3auth && this.web3auth.connected) {
      await this.web3auth.logout();
    }
  }

  // Generic Wallet Methods
  async getAccountInfo(address) {
    try {
      // Use XRPL public API to get account info
      const response = await fetch('https://xrpl.ws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'account_info',
          params: [{
            account: address,
            strict: true,
            ledger_index: 'current',
            queue: true
          }]
        })
      });

      const data = await response.json();
      
      if (data.result && data.result.account_data) {
        return {
          address: data.result.account_data.Account,
          balance: data.result.account_data.Balance,
          sequence: data.result.account_data.Sequence,
          flags: data.result.account_data.Flags
        };
      } else {
        throw new Error('Account not found or invalid');
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw new Error(`Failed to fetch account info: ${error.message}`);
    }
  }

  async getAccountTransactions(address, limit = 10) {
    try {
      const response = await fetch('https://xrpl.ws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'account_tx',
          params: [{
            account: address,
            limit: limit,
            ledger_index_min: -1,
            ledger_index_max: -1
          }]
        })
      });

      const data = await response.json();
      
      if (data.result && data.result.transactions) {
        return data.result.transactions.map(tx => ({
          hash: tx.tx.hash,
          type: tx.tx.TransactionType,
          account: tx.tx.Account,
          destination: tx.tx.Destination,
          amount: tx.tx.Amount,
          fee: tx.tx.Fee,
          sequence: tx.tx.Sequence,
          date: tx.tx.date,
          ledger_index: tx.tx.ledger_index,
          validated: tx.validated
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  // Supabase Integration Methods
  async saveUserToDatabase(userData) {
    try {
      // This would integrate with Supabase
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          address: userData.account,
          wallet_type: userData.wallet,
          user_info: userData.userInfo || null,
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save user to database');
      }

      return await response.json();
    } catch (error) {
      console.error('Database save error:', error);
      // Don't throw - this is not critical for login
      return null;
    }
  }

  async getUserFromDatabase(address) {
    try {
      const response = await fetch(`/api/users/${address}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Database fetch error:', error);
      return null;
    }
  }

  // Utility Methods
  isConnected() {
    return !!this.connectedWallet && !!this.userAddress;
  }

  getConnectedWallet() {
    return this.connectedWallet;
  }

  getConnectedAddress() {
    return this.userAddress;
  }

  async disconnect() {
    // Disconnect Web3Auth if connected
    if (this.connectedWallet === 'web3auth') {
      await this.disconnectWeb3Auth();
    }
    
    this.connectedWallet = null;
    this.userAddress = null;
    localStorage.removeItem('authToken');
  }

  // Create authentication token
  createAuthToken(walletData) {
    const authData = {
      ...walletData,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    return btoa(JSON.stringify(authData));
  }

  // Validate authentication token
  validateAuthToken(token) {
    try {
      const authData = JSON.parse(atob(token));
      
      if (authData.expires < Date.now()) {
        return { valid: false, reason: 'Token expired' };
      }

      return { valid: true, data: authData };
    } catch (error) {
      return { valid: false, reason: 'Invalid token format' };
    }
  }

  // Auto-restore session
  async restoreSession() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const validation = this.validateAuthToken(token);
    if (!validation.valid) {
      localStorage.removeItem('authToken');
      return null;
    }

    this.connectedWallet = validation.data.wallet;
    this.userAddress = validation.data.account;

    return validation.data;
  }
}

// Export singleton instance
export default new XRPLWalletService();

