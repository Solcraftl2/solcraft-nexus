// Real Authentication Service for SolCraft Nexus
// Supports: Web3Auth Plug and Play (Google, Twitter, Discord, Email), XRPL Wallets

import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { web3AuthContextConfig } from '../config/web3AuthConfig.js';

class AuthService {
  constructor() {
    this.web3auth = null;
    this.provider = null;
    this.isInitialized = false;
    this.currentUser = null;
    this.authCallbacks = new Set();
  }

  // Initialize Web3Auth Plug and Play for social login
  async initializeWeb3Auth() {
    try {
      console.log('🔐 Initializing Web3Auth Plug and Play...');

      const { web3AuthOptions } = web3AuthContextConfig;

      this.web3auth = new Web3Auth({
        clientId: web3AuthOptions.clientId,
        web3AuthNetwork: web3AuthOptions.web3AuthNetwork,
        chainConfig: web3AuthOptions.chainConfig,
        uiConfig: web3AuthOptions.uiConfig,
      });

      // Configure OpenLogin adapter for social logins
      const openloginAdapter = new OpenloginAdapter({
        loginSettings: {
          mfaLevel: "optional",
        },
        adapterSettings: {
          uxMode: "popup",
          whiteLabel: {
            appName: "SolCraft Nexus",
            appUrl: "https://solcraft-nexus-tokenize-v1.vercel.app",
            logoLight: "https://solcraft-nexus-tokenize-v1.vercel.app/favicon.ico",
            logoDark: "https://solcraft-nexus-tokenize-v1.vercel.app/favicon.ico",
          },
        },
      });

      this.web3auth.configureAdapter(openloginAdapter);
      await this.web3auth.initModal();
      
      this.isInitialized = true;
      console.log('✅ Web3Auth Plug and Play initialized successfully');

      // Check if user is already logged in
      if (this.web3auth.connected) {
        this.provider = this.web3auth.provider;
        await this.getUserInfo();
      }

    } catch (error) {
      console.error('❌ Web3Auth initialization failed:', error);
      throw error;
    }
  }

  // Login with social providers (Google, Twitter, Discord, Email)
  async loginWithSocial(provider = 'google') {
    try {
      if (!this.isInitialized) {
        await this.initializeWeb3Auth();
      }

      console.log(`🔐 Logging in with ${provider}...`);

      const web3authProvider = await this.web3auth.connect(provider, {
        loginProvider: provider,
      });

      if (web3authProvider) {
        this.provider = web3authProvider;
        const userInfo = await this.getUserInfo();
        
        const user = {
          id: userInfo.verifierId,
          name: userInfo.name,
          email: userInfo.email,
          profileImage: userInfo.profileImage,
          provider: provider,
          loginType: 'social_web3auth',
          walletAddress: await this.getWalletAddress(),
          isVerified: userInfo.verifierIdField === 'email' ? true : false,
          loginTime: new Date().toISOString()
        };

        this.currentUser = user;
        this.notifyAuthCallbacks('login', user);
        
        console.log('✅ Social login successful:', user);
        return user;
      }

    } catch (error) {
      console.error(`❌ Social login failed for ${provider}:`, error);
      throw error;
    }
  }

  // Login with XRPL Wallets (Crossmark, XUMM, Trust Wallet)
  async loginWithXRPLWallet(walletType) {
    try {
      console.log(`Connecting to ${walletType} wallet...`);

      switch (walletType) {
        case 'crossmark':
          return await this.connectCrossmark();
        case 'xumm':
          return await this.connectXUMM();
        case 'trust':
          return await this.connectTrustWallet();
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

    } catch (error) {
      console.error(`XRPL wallet connection failed for ${walletType}:`, error);
      throw error;
    }
  }

  // Connect to Crossmark wallet
  async connectCrossmark() {
    if (typeof window.crossmark === 'undefined') {
      throw new Error('Crossmark wallet not installed. Please install the Crossmark browser extension.');
    }

    try {
      const response = await window.crossmark.request({
        command: 'request_access',
        access: {
          types: ['address', 'network', 'networkType'],
        },
      });

      if (response.response.access) {
        const addressResponse = await window.crossmark.request({
          command: 'get_address'
        });

        const networkResponse = await window.crossmark.request({
          command: 'get_network'
        });

        const user = {
          id: addressResponse.response.address,
          name: 'Crossmark User',
          email: null,
          profileImage: null,
          provider: 'crossmark',
          loginType: 'xrpl_wallet',
          walletAddress: addressResponse.response.address,
          network: networkResponse.response.network,
          isVerified: true,
          loginTime: new Date().toISOString()
        };

        this.currentUser = user;
        this.notifyAuthCallbacks('login', user);
        
        console.log('Crossmark connection successful:', user);
        return user;
      } else {
        throw new Error('User denied access to Crossmark wallet');
      }

    } catch (error) {
      console.error('Crossmark connection failed:', error);
      throw error;
    }
  }

  // Connect to XUMM wallet
  async connectXUMM() {
    try {
      // XUMM requires SDK integration for real implementation
      // For now, provide instructions for QR code scanning
      
      console.log('XUMM connection requires QR code scanning...');
      
      // This would typically involve:
      // 1. Creating a payload with XUMM SDK
      // 2. Displaying QR code to user
      // 3. Waiting for user to scan and approve
      // 4. Receiving webhook confirmation
      
      throw new Error('XUMM integration requires QR code implementation. Please use Crossmark or Trust Wallet for now.');

    } catch (error) {
      console.error('XUMM connection failed:', error);
      throw error;
    }
  }

  // Connect to Trust Wallet
  async connectTrustWallet() {
    try {
      // Trust Wallet integration for XRPL
      if (typeof window.trustwallet === 'undefined') {
        throw new Error('Trust Wallet not detected. Please install Trust Wallet browser extension or use mobile app.');
      }

      // Trust Wallet XRPL integration would go here
      throw new Error('Trust Wallet XRPL integration in development. Please use Crossmark for now.');

    } catch (error) {
      console.error('Trust Wallet connection failed:', error);
      throw error;
    }
  }

  // Get user information from Web3Auth
  async getUserInfo() {
    if (!this.web3auth || !this.web3auth.connected) {
      throw new Error('Web3Auth not connected');
    }

    try {
      const userInfo = await this.web3auth.getUserInfo();
      return userInfo;
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  // Get wallet address
  async getWalletAddress() {
    if (!this.provider) {
      throw new Error('No provider available');
    }

    try {
      // For Web3Auth, get Ethereum address
      const accounts = await this.provider.request({
        method: "eth_accounts",
      });
      return accounts[0];
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return null;
    }
  }

  // Logout
  async logout() {
    try {
      if (this.web3auth && this.web3auth.connected) {
        await this.web3auth.logout();
      }
      
      this.provider = null;
      this.currentUser = null;
      this.notifyAuthCallbacks('logout');
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Add authentication callback
  addAuthCallback(callback) {
    this.authCallbacks.add(callback);
  }

  // Remove authentication callback
  removeAuthCallback(callback) {
    this.authCallbacks.delete(callback);
  }

  // Notify authentication callbacks
  notifyAuthCallbacks(event, data = null) {
    this.authCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Auth callback error:', error);
      }
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;

