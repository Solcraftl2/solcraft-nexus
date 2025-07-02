import { logger } from '../../../netlify/functions/utils/logger.js';
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

/**
 * Web3Auth Service per autenticazione XRPL reale
 * Gestisce login social e wallet connection
 */
class Web3AuthService {
  constructor() {
    this.web3auth = null;
    this.provider = null;
    this.isInitialized = false;
  }

  /**
   * Inizializza Web3Auth con configurazione XRPL
   */
  async initialize() {
    try {
      const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;
      
      if (!clientId) {
        throw new Error("Web3Auth Client ID non configurato");
      }

      // Configurazione chain XRPL
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.OTHER,
        chainId: "0x1", // XRPL Mainnet
        rpcTarget: "https://ripple-node.tor.us",
        displayName: "XRPL Mainnet",
        blockExplorer: "https://livenet.xrpl.org",
        ticker: "XRP",
        tickerName: "XRP",
      };

      // Inizializza Web3Auth
      this.web3auth = new Web3Auth({
        clientId,
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
        chainConfig,
        uiConfig: {
          appName: "SolCraft Nexus",
          appLogo: "https://solcraft-nexus.vercel.app/favicon.ico",
          theme: {
            primary: "#3B82F6",
          },
          mode: "light",
          logoLight: "https://solcraft-nexus.vercel.app/favicon.ico",
          logoDark: "https://solcraft-nexus.vercel.app/favicon.ico",
          defaultLanguage: "it",
          loginMethodsOrder: ["google", "github", "discord"],
        },
      });

      await this.web3auth.initModal();
      this.isInitialized = true;
      
      logger.info("✅ Web3Auth inizializzato con successo");
      return true;
    } catch (error) {
      logger.error("❌ Errore inizializzazione Web3Auth:", error);
      throw error;
    }
  }

  /**
   * Login con provider sociale (Google, GitHub, Discord)
   */
  async loginSocial(provider = "google") {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`🔐 Tentativo login con ${provider}...`);
      
      const web3authProvider = await this.web3auth.connect();
      
      if (web3authProvider) {
        this.provider = web3authProvider;
        const userInfo = await this.getUserInfo();
        
        logger.info("✅ Login sociale completato:", userInfo);
        
        return {
          success: true,
          user: {
            id: userInfo.verifierId,
            email: userInfo.email,
            name: userInfo.name,
            avatar_url: userInfo.profileImage,
            auth_method: 'social',
            provider: provider,
            verified: userInfo.verifierIdField === 'email'
          },
          provider: this.provider
        };
      }
      
      throw new Error("Login fallito");
    } catch (error) {
      logger.error(`❌ Errore login ${provider}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Connessione wallet XRPL
   */
  async connectWallet() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info("🔗 Connessione wallet XRPL...");
      
      const web3authProvider = await this.web3auth.connect();
      
      if (web3authProvider) {
        this.provider = web3authProvider;
        
        // Ottieni account XRPL
        const accounts = await this.provider.request({
          method: "xrpl_getAccounts",
        });

        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          
          // Ottieni informazioni account
          const accountInfo = await this.getAccountInfo(address);
          
          logger.info("✅ Wallet XRPL connesso:", address);
          
          return {
            success: true,
            user: {
              id: address,
              wallet_address: address,
              balance: accountInfo.balance,
              auth_method: 'wallet',
              provider: 'xrpl',
              verified: true
            },
            provider: this.provider
          };
        }
      }
      
      throw new Error("Connessione wallet fallita");
    } catch (error) {
      logger.error("❌ Errore connessione wallet:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ottieni informazioni utente
   */
  async getUserInfo() {
    try {
      if (!this.web3auth) {
        throw new Error("Web3Auth non inizializzato");
      }
      
      return await this.web3auth.getUserInfo();
    } catch (error) {
      logger.error("❌ Errore getUserInfo:", error);
      throw error;
    }
  }

  /**
   * Ottieni informazioni account XRPL
   */
  async getAccountInfo(address) {
    try {
      if (!this.provider) {
        throw new Error("Provider non disponibile");
      }

      const accountInfo = await this.provider.request({
        method: "account_info",
        params: [{
          account: address,
          strict: true,
          ledger_index: "current",
          queue: true,
        }],
      });

      return {
        address: accountInfo?.account_data?.Account,
        balance: accountInfo?.account_data?.Balance,
        sequence: accountInfo?.account_data?.Sequence,
      };
    } catch (error) {
      logger.error("❌ Errore getAccountInfo:", error);
      return {
        address,
        balance: "0",
        sequence: 0,
      };
    }
  }

  /**
   * Firma transazione XRPL
   */
  async signTransaction(transaction) {
    try {
      if (!this.provider) {
        throw new Error("Provider non disponibile");
      }

      logger.info("✍️ Firma transazione XRPL...");
      
      const signedTx = await this.provider.request({
        method: "xrpl_signTransaction",
        params: { transaction },
      });

      logger.info("✅ Transazione firmata:", signedTx);
      return signedTx;
    } catch (error) {
      logger.error("❌ Errore firma transazione:", error);
      throw error;
    }
  }

  /**
   * Invia transazione XRPL
   */
  async submitTransaction(transaction) {
    try {
      if (!this.provider) {
        throw new Error("Provider non disponibile");
      }

      logger.info("📤 Invio transazione XRPL...");
      
      const result = await this.provider.request({
        method: "xrpl_submitTransaction",
        params: { transaction },
      });

      logger.info("✅ Transazione inviata:", result);
      return result;
    } catch (error) {
      logger.error("❌ Errore invio transazione:", error);
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      if (this.web3auth) {
        await this.web3auth.logout();
        this.provider = null;
        logger.info("✅ Logout completato");
        return true;
      }
    } catch (error) {
      logger.error("❌ Errore logout:", error);
      throw error;
    }
  }

  /**
   * Verifica se l'utente è connesso
   */
  isConnected() {
    return this.web3auth && this.web3auth.connected;
  }

  /**
   * Ottieni provider corrente
   */
  getProvider() {
    return this.provider;
  }
}

// Istanza singleton
const web3AuthService = new Web3AuthService();

export default web3AuthService;

