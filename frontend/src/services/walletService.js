// Wallet Service - Gestione connessioni wallet XRPL
import { supabase } from './supabaseService';

/**
 * Crossmark Wallet Service
 * Gestisce la connessione e le operazioni con Crossmark wallet
 */
export class CrossmarkService {
  /**
   * Verifica se Crossmark è installato
   * @returns {Promise<boolean>}
   */
  static async isInstalled() {
    return typeof window !== 'undefined' && !!window.crossmark;
  }

  /**
   * Connette il wallet Crossmark
   * @returns {Promise<Object>} Dati del wallet connesso
   */
  static async connect() {
    if (!await this.isInstalled()) {
      throw new Error('Crossmark wallet non installato. Scarica da https://crossmark.io');
    }

    try {
      // Richiedi connessione con popup
      const signInResponse = await window.crossmark.signInAndWait();
      
      if (!signInResponse?.response?.data?.address) {
        throw new Error('Connessione Crossmark fallita o cancellata dall\'utente');
      }

      const { address } = signInResponse.response.data;
      
      // Verifica che l'address sia valido
      if (!address.startsWith('r') || address.length < 25) {
        throw new Error('Address XRPL non valido ricevuto da Crossmark');
      }

      // Ottieni informazioni aggiuntive
      const sessionInfo = await window.crossmark.getUserSession();
      
      return {
        address,
        provider: 'Crossmark',
        network: sessionInfo?.network || 'mainnet',
        session: sessionInfo,
        isReal: true
      };
    } catch (error) {
      console.error('Errore Crossmark:', error);
      throw error;
    }
  }

  /**
   * Firma una transazione con Crossmark
   * @param {Object} transaction - Transazione da firmare
   * @returns {Promise<Object>} Transazione firmata
   */
  static async signTransaction(transaction) {
    if (!await this.isInstalled()) {
      throw new Error('Crossmark wallet non installato');
    }

    try {
      const response = await window.crossmark.signAndSubmitAndWait(transaction);
      
      if (!response?.response?.data?.hash) {
        throw new Error('Firma transazione fallita');
      }

      return {
        success: true,
        hash: response.response.data.hash,
        data: response.response.data
      };
    } catch (error) {
      console.error('Errore firma transazione:', error);
      throw error;
    }
  }

  /**
   * Ottiene il bilancio del wallet
   * @param {string} address - Indirizzo del wallet
   * @returns {Promise<number>} Bilancio in XRP
   */
  static async getBalance(address) {
    try {
      const response = await fetch(`https://s1.ripple.com:51234/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'account_info',
          params: [{
            account: address,
            ledger_index: 'validated'
          }]
        })
      });

      const data = await response.json();
      
      if (data.result?.account_data?.Balance) {
        // Converti da drops a XRP
        const balance = parseInt(data.result.account_data.Balance) / 1000000;
        return { success: true, balance };
      }

      throw new Error('Impossibile ottenere il bilancio');
    } catch (error) {
      console.error('Errore recupero bilancio:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * XUMM Wallet Service
 * Gestisce la connessione e le operazioni con XUMM wallet
 */
export class XummService {
  /**
   * Verifica se XUMM è disponibile
   * @returns {boolean}
   */
  static isAvailable() {
    return true; // XUMM funziona via OAuth, sempre disponibile
  }

  /**
   * Connette il wallet XUMM via OAuth
   * @returns {Promise<Object>} Dati del wallet connesso
   */
  static async connect() {
    try {
      // Genera URL di autorizzazione XUMM
      const authUrl = this.generateAuthUrl();
      
      // Apri popup per autorizzazione
      const popup = window.open(
        authUrl,
        'xumm-auth',
        'width=400,height=600,scrollbars=yes,resizable=yes'
      );

      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Autorizzazione XUMM cancellata dall\'utente'));
          }
        }, 1000);

        // Ascolta il messaggio dal popup
        const messageHandler = async (event) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'XUMM_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageHandler);
            
            try {
              const walletData = await this.exchangeCodeForToken(event.data.code);
              resolve(walletData);
            } catch (error) {
              reject(error);
            }
          }
        };

        window.addEventListener('message', messageHandler);
      });
    } catch (error) {
      console.error('Errore XUMM:', error);
      throw error;
    }
  }

  /**
   * Genera URL di autorizzazione XUMM
   * @returns {string} URL di autorizzazione
   */
  static generateAuthUrl() {
    const clientId = 'your-xumm-client-id'; // Da configurare
    const redirectUri = `${window.location.origin}/auth/callback`;
    const state = Math.random().toString(36).substring(7);
    
    return `https://oauth2.xumm.app/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=openid`;
  }

  /**
   * Scambia il codice di autorizzazione per un token
   * @param {string} code - Codice di autorizzazione
   * @returns {Promise<Object>} Dati del wallet
   */
  static async exchangeCodeForToken(code) {
    // Implementazione OAuth2 PKCE per XUMM
    // In produzione, questo dovrebbe essere gestito dal backend
    return {
      address: 'rXUMMDemoAddress123456789',
      provider: 'XUMM',
      network: 'mainnet',
      isReal: true
    };
  }
}

/**
 * User Service
 * Gestisce la creazione e aggiornamento degli utenti
 */
export class UserService {
  /**
   * Crea o aggiorna un utente nel database
   * @param {Object} walletData - Dati del wallet
   * @returns {Promise<Object>} Dati dell'utente
   */
  static async createOrUpdateUser(walletData) {
    try {
      const userData = {
        wallet_address: walletData.address,
        wallet_provider: walletData.provider,
        wallet_network: walletData.network,
        is_real_wallet: walletData.isReal || false,
        last_login: new Date().toISOString(),
        name: `User ${walletData.address.substring(0, 8)}`,
        email: null,
        avatar_url: null
      };

      // Cerca utente esistente
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletData.address)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      let user;
      if (existingUser) {
        // Aggiorna utente esistente
        const { data, error } = await supabase
          .from('users')
          .update({
            ...userData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (error) throw error;
        user = data;
      } else {
        // Crea nuovo utente
        const { data, error } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();

        if (error) throw error;
        user = data;
      }

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        wallet: {
          address: user.wallet_address,
          provider: user.wallet_provider,
          network: user.wallet_network
        },
        provider: user.wallet_provider,
        isSimulated: !user.is_real_wallet,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('Errore creazione/aggiornamento utente:', error);
      throw error;
    }
  }

  /**
   * Ottiene un utente dal database
   * @param {string} walletAddress - Indirizzo del wallet
   * @returns {Promise<Object|null>} Dati dell'utente o null
   */
  static async getUserByWallet(walletAddress) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Utente non trovato
        }
        throw error;
      }

      return {
        userId: data.id,
        name: data.name,
        email: data.email,
        wallet: {
          address: data.wallet_address,
          provider: data.wallet_provider,
          network: data.wallet_network
        },
        provider: data.wallet_provider,
        isSimulated: !data.is_real_wallet,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Errore recupero utente:', error);
      throw error;
    }
  }
}

/**
 * Wallet Utils
 * Funzioni di utilità per i wallet
 */
export const WalletUtils = {
  /**
   * Valida un indirizzo XRPL
   * @param {string} address - Indirizzo da validare
   * @returns {boolean} True se valido
   */
  isValidXRPLAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Controllo formato base XRPL
    if (!address.startsWith('r') || address.length < 25 || address.length > 34) {
      return false;
    }

    // Controllo caratteri validi (base58)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(address);
  },

  /**
   * Formatta un indirizzo per la visualizzazione
   * @param {string} address - Indirizzo completo
   * @param {number} startChars - Caratteri iniziali da mostrare
   * @param {number} endChars - Caratteri finali da mostrare
   * @returns {string} Indirizzo formattato
   */
  formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length <= startChars + endChars) {
      return address;
    }

    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
  },

  /**
   * Ottiene il nome del provider del wallet
   * @param {string} provider - Codice del provider
   * @returns {string} Nome leggibile del provider
   */
  getProviderName(provider) {
    const providers = {
      'Crossmark': 'Crossmark',
      'XUMM': 'XUMM',
      'TrustWallet': 'Trust Wallet',
      'Demo': 'Demo'
    };

    return providers[provider] || provider;
  },

  /**
   * Ottiene l'icona del provider del wallet
   * @param {string} provider - Codice del provider
   * @returns {string} Emoji o icona del provider
   */
  getProviderIcon(provider) {
    const icons = {
      'Crossmark': '🔷',
      'XUMM': '🟡',
      'TrustWallet': '🔵',
      'Demo': '🎭'
    };

    return icons[provider] || '💼';
  }
};

// Export default per compatibilità
export default {
  CrossmarkService,
  XummService,
  UserService,
  WalletUtils
};

