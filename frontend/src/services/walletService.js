/**
 * Solcraft Nexus - Enhanced Wallet Service
 * Integrazione diretta XUMM + Crossmark + Supabase
 * Versione aggiornata con XUMM SDK diretto
 */

import xummService from './xummService.js';
import { registerWallet, updateWalletBalance, getWallet } from './supabaseService.js';

class WalletService {
  constructor() {
    this.connectedWallet = null;
    this.userAddress = null;
    this.authToken = null;
    this.walletType = null;
    this.listeners = new Map();
    
    console.log('🔧 Wallet Service inizializzato con supporto XUMM diretto');
  }

  // Event listener system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
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

  // Get wallet type
  getWalletType() {
    return this.walletType;
  }

  /**
   * Connessione wallet unificata
   * Supporta XUMM, Crossmark e altri wallet
   */
  async connectWallet(type = 'xumm') {
    try {
      console.log(`🔗 Connessione wallet tipo: ${type}`);
      
      let result;
      
      switch (type.toLowerCase()) {
        case 'xumm':
          result = await this.connectXumm();
          break;
          
        case 'crossmark':
          result = await this.connectCrossmark();
          break;
          
        default:
          throw new Error(`Tipo wallet non supportato: ${type}`);
      }
      
      if (result.success) {
        console.log('✅ Connessione wallet completata:', result);
        this.emit('connected', result);
        return result;
      } else {
        throw new Error(result.error || 'Connessione fallita');
      }
      
    } catch (error) {
      console.error('❌ Errore connessione wallet:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Connessione XUMM diretta (NUOVO)
   * Usa il servizio XUMM diretto senza backend proxy
   */
  async connectXumm() {
    try {
      console.log('🦄 Connessione XUMM diretta...');
      
      // Usa il nuovo servizio XUMM
      const xummResult = await xummService.connectWallet();
      
      if (xummResult.success) {
        // Salva dati connessione
        this.connectedWallet = 'xumm';
        this.userAddress = xummResult.account;
        this.walletType = 'xumm';
        this.authToken = xummResult.userToken;
        
        // Crea oggetto wallet per Supabase
        const walletData = {
          address: xummResult.account,
          type: 'xumm',
          network: xummResult.network || 'mainnet',
          userToken: xummResult.userToken,
          balance: 0, // Sarà aggiornato successivamente
          metadata: {
            connectedAt: new Date().toISOString(),
            qrCode: xummResult.qrCode,
            deeplink: xummResult.deeplink
          }
        };
        
        // Registra wallet nel database Supabase
        try {
          await registerWallet(walletData);
          console.log('💾 Wallet registrato in Supabase');
        } catch (dbError) {
          console.warn('⚠️ Errore registrazione Supabase:', dbError);
          // Non bloccare la connessione per errori DB
        }
        
        return {
          success: true,
          address: this.userAddress,
          type: 'xumm',
          network: xummResult.network,
          userToken: this.authToken,
          qrCode: xummResult.qrCode,
          deeplink: xummResult.deeplink
        };
        
      } else {
        throw new Error(xummResult.error || 'Connessione XUMM fallita');
      }
      
    } catch (error) {
      console.error('❌ Errore connessione XUMM:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Connessione Crossmark (esistente)
   */
  async connectCrossmark() {
    try {
      console.log('🔷 Connessione Crossmark...');
      
      if (!window.crossmark) {
        throw new Error('Crossmark wallet non installato');
      }
      
      const response = await window.crossmark.signIn();
      
      if (response && response.response && response.response.account) {
        this.connectedWallet = 'crossmark';
        this.userAddress = response.response.account;
        this.walletType = 'crossmark';
        this.authToken = response.response.account; // Usa address come token
        
        // Registra in Supabase
        const walletData = {
          address: this.userAddress,
          type: 'crossmark',
          network: 'mainnet',
          balance: 0,
          metadata: {
            connectedAt: new Date().toISOString()
          }
        };
        
        try {
          await registerWallet(walletData);
        } catch (dbError) {
          console.warn('⚠️ Errore registrazione Supabase:', dbError);
        }
        
        return {
          success: true,
          address: this.userAddress,
          type: 'crossmark',
          network: 'mainnet'
        };
        
      } else {
        throw new Error('Connessione Crossmark rifiutata');
      }
      
    } catch (error) {
      console.error('❌ Errore connessione Crossmark:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Crea transazione di tokenizzazione
   */
  async createTokenizationTransaction(tokenData) {
    try {
      if (!this.isConnected()) {
        throw new Error('Wallet non connesso');
      }
      
      console.log('💎 Creando transazione tokenizzazione...');
      
      if (this.walletType === 'xumm') {
        // Usa servizio XUMM per creare transazione
        const result = await xummService.createTokenizationTransaction(tokenData);
        
        if (result.success) {
          // Salva transazione in Supabase se necessario
          console.log('✅ Transazione tokenizzazione creata:', result.uuid);
          
          return {
            success: true,
            uuid: result.uuid,
            qrCode: result.qrCode,
            deeplink: result.deeplink,
            message: result.message
          };
        } else {
          throw new Error(result.error);
        }
        
      } else if (this.walletType === 'crossmark') {
        // Implementa logica Crossmark se necessario
        throw new Error('Tokenizzazione Crossmark non ancora implementata');
        
      } else {
        throw new Error('Tipo wallet non supportato per tokenizzazione');
      }
      
    } catch (error) {
      console.error('❌ Errore creazione transazione:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verifica stato transazione
   */
  async checkTransactionStatus(uuid) {
    try {
      if (this.walletType === 'xumm') {
        return await xummService.checkTransactionStatus(uuid);
      } else {
        throw new Error('Verifica transazione supportata solo per XUMM');
      }
    } catch (error) {
      console.error('❌ Errore verifica transazione:', error);
      return { error: error.message };
    }
  }

  /**
   * Crea pagamento
   */
  async createPayment(destination, amount, currency = 'XRP') {
    try {
      if (!this.isConnected()) {
        throw new Error('Wallet non connesso');
      }
      
      if (this.walletType === 'xumm') {
        return await xummService.createPayment(destination, amount, currency);
      } else {
        throw new Error('Pagamenti supportati solo per XUMM al momento');
      }
      
    } catch (error) {
      console.error('❌ Errore creazione pagamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ottieni bilancio wallet
   */
  async getBalance() {
    try {
      if (!this.isConnected()) {
        throw new Error('Wallet non connesso');
      }
      
      if (this.walletType === 'xumm') {
        return await xummService.getAccountBalance();
      } else {
        // Implementa per altri wallet se necessario
        return { balance: '0 XRP', tokens: [] };
      }
      
    } catch (error) {
      console.error('❌ Errore recupero bilancio:', error);
      return { error: error.message };
    }
  }

  /**
   * Disconnetti wallet
   */
  async disconnect() {
    try {
      console.log('🔌 Disconnessione wallet...');
      
      if (this.walletType === 'xumm') {
        xummService.disconnect();
      }
      
      // Reset stato
      this.connectedWallet = null;
      this.userAddress = null;
      this.authToken = null;
      this.walletType = null;
      
      this.emit('disconnected', { message: 'Wallet disconnesso' });
      
      return { success: true, message: 'Wallet disconnesso' };
      
    } catch (error) {
      console.error('❌ Errore disconnessione:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ottieni informazioni wallet corrente
   */
  getWalletInfo() {
    return {
      isConnected: this.isConnected(),
      address: this.userAddress,
      type: this.walletType,
      authToken: this.authToken
    };
  }

  /**
   * Verifica se wallet è mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}

// Esporta istanza singleton
const walletService = new WalletService();
export default walletService;

// Esporta anche la classe per test
export { WalletService };

