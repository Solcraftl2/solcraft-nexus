import { logger } from '../../../netlify/functions/utils/logger.js';
import React from 'react';

/**
 * Wallet Service - Gestione connessioni wallet Web3/XRPL
 * Supporta: Crossmark, XUMM, Trust Wallet
 */
class WalletService {
  constructor() {
    this.connectedWallet = null;
    this.walletData = null;
    this.listeners = new Set();
  }

  /**
   * Rileva wallet disponibili nel browser
   * @returns {Promise<string[]>} Array di wallet disponibili
   */
  async getAvailableWallets() {
    const available = [];

    try {
      // Crossmark Wallet Detection
      if (window.crossmark) {
        available.push('crossmark');
      }

      // XUMM Wallet Detection (via browser extension o mobile)
      if (window.xumm || this.isXUMMAvailable()) {
        available.push('xumm');
      }

      // Trust Wallet Detection
      if (window.trustwallet || (window.ethereum && window.ethereum.isTrust)) {
        available.push('trust');
      }

      // MetaMask Detection (fallback per testing)
      if (window.ethereum && window.ethereum.isMetaMask) {
        available.push('metamask');
      }

      logger.info('Available wallets:', available);
      return available;
    } catch (error) {
      logger.error('Error detecting wallets:', error);
      return [];
    }
  }

  /**
   * Connette al wallet specificato
   * @param {string} walletType - Tipo di wallet (crossmark, xumm, trust)
   * @returns {Promise<Object>} Risultato connessione
   */
  async connectWallet(walletType) {
    try {
      logger.info(`Connecting to ${walletType} wallet...`);

      switch (walletType) {
        case 'crossmark':
          return await this.connectCrossmark();
        case 'xumm':
          return await this.connectXUMM();
        case 'trust':
          return await this.connectTrustWallet();
        case 'metamask':
          return await this.connectMetaMask();
        default:
          throw new Error(`Wallet type ${walletType} not supported`);
      }
    } catch (error) {
      logger.error(`Error connecting to ${walletType}:`, error);
      return {
        success: false,
        error: error.message || 'Errore durante la connessione al wallet'
      };
    }
  }

  /**
   * Connessione Crossmark Wallet
   */
  async connectCrossmark() {
    if (!window.crossmark) {
      return {
        success: false,
        error: 'Crossmark wallet non installato'
      };
    }

    try {
      // Richiesta connessione
      const response = await window.crossmark.request({
        method: 'xrpl_requestAccounts'
      });

      if (response && response.response && response.response.account) {
        const account = response.response.account;
        
        this.connectedWallet = 'crossmark';
        this.walletData = {
          address: account.address,
          publicKey: account.publicKey,
          network: account.network || 'mainnet'
        };

        this.notifyListeners('connected', this.walletData);

        return {
          success: true,
          wallet: 'crossmark',
          address: account.address,
          publicKey: account.publicKey,
          network: account.network || 'mainnet'
        };
      } else {
        return {
          success: false,
          error: 'Connessione rifiutata dall\'utente'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Errore durante la connessione a Crossmark'
      };
    }
  }

  /**
   * Connessione XUMM Wallet
   */
  async connectXUMM() {
    try {
      // XUMM può essere disponibile come extension o via deep linking
      if (window.xumm) {
        // Extension XUMM
        const response = await window.xumm.request({
          method: 'xrpl_requestAccounts'
        });

        if (response && response.account) {
          this.connectedWallet = 'xumm';
          this.walletData = {
            address: response.account.address,
            publicKey: response.account.publicKey,
            network: response.account.network || 'mainnet'
          };

          this.notifyListeners('connected', this.walletData);

          return {
            success: true,
            wallet: 'xumm',
            address: response.account.address,
            publicKey: response.account.publicKey,
            network: response.account.network || 'mainnet'
          };
        }
      } else {
        // Deep linking per mobile XUMM
        return await this.connectXUMMDeepLink();
      }

      return {
        success: false,
        error: 'XUMM wallet non disponibile'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Errore durante la connessione a XUMM'
      };
    }
  }

  /**
   * Connessione XUMM via deep linking
   */
  async connectXUMMDeepLink() {
    try {
      // Implementazione semplificata per deep linking XUMM
      // In produzione, utilizzare XUMM SDK per payload creation
      
      const payload = {
        txjson: {
          TransactionType: 'SignIn'
        },
        options: {
          submit: false,
          expire: 5 // 5 minuti
        }
      };

      // Simulazione risposta XUMM (in produzione usare XUMM API)
      logger.info('XUMM deep link payload:', payload);
      
      // Per ora ritorniamo un mock per testing
      return {
        success: false,
        error: 'XUMM deep linking non ancora implementato. Usa Crossmark per ora.'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Errore XUMM deep linking'
      };
    }
  }

  /**
   * Connessione Trust Wallet
   */
  async connectTrustWallet() {
    if (!window.trustwallet && !(window.ethereum && window.ethereum.isTrust)) {
      return {
        success: false,
        error: 'Trust Wallet non installato'
      };
    }

    try {
      const provider = window.trustwallet || window.ethereum;
      
      // Richiesta connessione
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        this.connectedWallet = 'trust';
        this.walletData = {
          address: accounts[0],
          network: 'ethereum' // Trust Wallet principalmente per Ethereum
        };

        this.notifyListeners('connected', this.walletData);

        return {
          success: true,
          wallet: 'trust',
          address: accounts[0],
          network: 'ethereum'
        };
      } else {
        return {
          success: false,
          error: 'Nessun account disponibile'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Errore durante la connessione a Trust Wallet'
      };
    }
  }

  /**
   * Connessione MetaMask (fallback per testing)
   */
  async connectMetaMask() {
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      return {
        success: false,
        error: 'MetaMask non installato'
      };
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        this.connectedWallet = 'metamask';
        this.walletData = {
          address: accounts[0],
          network: 'ethereum'
        };

        this.notifyListeners('connected', this.walletData);

        return {
          success: true,
          wallet: 'metamask',
          address: accounts[0],
          network: 'ethereum'
        };
      } else {
        return {
          success: false,
          error: 'Nessun account disponibile'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Errore durante la connessione a MetaMask'
      };
    }
  }

  /**
   * Disconnette il wallet corrente
   */
  async disconnectWallet() {
    try {
      if (this.connectedWallet) {
        this.notifyListeners('disconnected', null);
        this.connectedWallet = null;
        this.walletData = null;
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Error disconnecting wallet:', error);
      return {
        success: false,
        error: error.message || 'Errore durante la disconnessione'
      };
    }
  }

  /**
   * Ottiene informazioni wallet connesso
   */
  getConnectedWallet() {
    return {
      wallet: this.connectedWallet,
      data: this.walletData,
      isConnected: !!this.connectedWallet
    };
  }

  /**
   * Verifica se XUMM è disponibile
   */
  isXUMMAvailable() {
    // Verifica se siamo su mobile e XUMM può essere disponibile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile; // Su mobile XUMM può essere disponibile via deep linking
  }

  /**
   * Aggiunge listener per eventi wallet
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Rimuove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notifica tutti i listener
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        logger.error('Error in wallet listener:', error);
      }
    });
  }

  /**
   * Firma messaggio con wallet connesso
   */
  async signMessage(message) {
    if (!this.connectedWallet || !this.walletData) {
      throw new Error('Nessun wallet connesso');
    }

    try {
      switch (this.connectedWallet) {
        case 'crossmark':
          return await this.signWithCrossmark(message);
        case 'xumm':
          return await this.signWithXUMM(message);
        case 'trust':
        case 'metamask':
          return await this.signWithEthereum(message);
        default:
          throw new Error(`Firma non supportata per ${this.connectedWallet}`);
      }
    } catch (error) {
      logger.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Firma con Crossmark
   */
  async signWithCrossmark(message) {
    const response = await window.crossmark.request({
      method: 'xrpl_signMessage',
      params: {
        message: message
      }
    });

    return response.response;
  }

  /**
   * Firma con XUMM
   */
  async signWithXUMM(message) {
    // Implementazione firma XUMM
    throw new Error('Firma XUMM non ancora implementata');
  }

  /**
   * Firma con provider Ethereum (Trust Wallet, MetaMask)
   */
  async signWithEthereum(message) {
    const provider = window.trustwallet || window.ethereum;
    
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, this.walletData.address]
    });

    return signature;
  }
}

// Istanza singleton
const walletService = new WalletService();

// Hook React per uso nei componenti
export const useWallet = () => {
  const [walletState, setWalletState] = React.useState({
    isConnected: false,
    wallet: null,
    address: null,
    data: null
  });

  React.useEffect(() => {
    const handleWalletEvent = (event, data) => {
      if (event === 'connected') {
        setWalletState({
          isConnected: true,
          wallet: walletService.connectedWallet,
          address: data.address,
          data: data
        });
      } else if (event === 'disconnected') {
        setWalletState({
          isConnected: false,
          wallet: null,
          address: null,
          data: null
        });
      }
    };

    walletService.addListener(handleWalletEvent);

    // Verifica stato iniziale
    const currentWallet = walletService.getConnectedWallet();
    if (currentWallet.isConnected) {
      setWalletState({
        isConnected: true,
        wallet: currentWallet.wallet,
        address: currentWallet.data?.address,
        data: currentWallet.data
      });
    }

    return () => {
      walletService.removeListener(handleWalletEvent);
    };
  }, []);

  return {
    ...walletState,
    connectWallet: walletService.connectWallet.bind(walletService),
    disconnectWallet: walletService.disconnectWallet.bind(walletService),
    getAvailableWallets: walletService.getAvailableWallets.bind(walletService),
    signMessage: walletService.signMessage.bind(walletService)
  };
};

export { walletService };
export default walletService;

