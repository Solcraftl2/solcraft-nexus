// Servizio per gestire le connessioni wallet reali
import { supabase } from './supabaseService';

// Crossmark Wallet Service
export class CrossmarkService {
  static async isInstalled() {
    return typeof window !== 'undefined' && !!window.crossmark;
  }

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

  static async signTransaction(transaction) {
    if (!await this.isInstalled()) {
      throw new Error('Crossmark wallet non installato');
    }

    try {
      const signResponse = await window.crossmark.signAndWait(transaction);
      
      if (!signResponse?.response?.data?.signedTransaction) {
        throw new Error('Firma transazione fallita o cancellata dall\'utente');
      }

      return {
        success: true,
        signedTransaction: signResponse.response.data.signedTransaction,
        hash: signResponse.response.data.hash
      };
    } catch (error) {
      console.error('Errore firma Crossmark:', error);
      return {
        success: false,
        error: error.message || 'Errore durante la firma della transazione'
      };
    }
  }

  static async signAndSubmit(transaction) {
    if (!await this.isInstalled()) {
      throw new Error('Crossmark wallet non installato');
    }

    try {
      // Usa signAndSubmitAndWait per firmare e inviare in un'unica operazione
      const submitResponse = await window.crossmark.signAndSubmitAndWait(transaction);
      
      if (!submitResponse?.response?.data?.hash) {
        throw new Error('Invio transazione fallito o cancellato dall\'utente');
      }

      return {
        success: true,
        hash: submitResponse.response.data.hash,
        ledgerIndex: submitResponse.response.data.ledgerIndex,
        result: submitResponse.response.data.result
      };
    } catch (error) {
      console.error('Errore invio Crossmark:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'invio della transazione'
      };
    }
  }

  static async getAccountInfo(address) {
    if (!await this.isInstalled()) {
      throw new Error('Crossmark wallet non installato');
    }

    try {
      const accountInfo = await window.crossmark.getAccountInfo(address);
      
      if (accountInfo?.response?.data) {
        return {
          success: true,
          data: accountInfo.response.data
        };
      } else {
        throw new Error('Impossibile recuperare informazioni account');
      }
    } catch (error) {
      console.error('Errore info account Crossmark:', error);
      return {
        success: false,
        error: error.message || 'Errore durante il recupero delle informazioni account'
      };
    }
  }

  static async getBalance(address) {
    try {
      const accountResult = await this.getAccountInfo(address);
      
      if (accountResult.success && accountResult.data?.account_data?.Balance) {
        // Converti da drops a XRP
        const balanceXRP = parseInt(accountResult.data.account_data.Balance) / 1000000;
        return {
          success: true,
          balance: balanceXRP
        };
      } else {
        throw new Error('Impossibile recuperare il saldo');
      }
    } catch (error) {
      console.error('Errore saldo Crossmark:', error);
      return {
        success: false,
        error: error.message || 'Errore durante il recupero del saldo'
      };
    }
  }

  static async disconnect() {
    try {
      if (await this.isInstalled() && window.crossmark.signOut) {
        await window.crossmark.signOut();
      }
      return { success: true };
    } catch (error) {
      console.error('Errore disconnessione Crossmark:', error);
      return {
        success: false,
        error: error.message || 'Errore durante la disconnessione'
      };
    }
  }
}

// XUMM Wallet Service
export class XUMMService {
  static async connect() {
    try {
      // Implementazione XUMM OAuth2 PKCE
      const { XummOauth2Pkce } = await import('xumm-oauth2-pkce');
      
      const oauth = new XummOauth2Pkce({
        clientId: import.meta.env.VITE_XUMM_CLIENT_ID || 'demo-client-id',
        redirectUrl: `${window.location.origin}/auth/callback`,
        scope: ['openid', 'profile', 'email']
      });

      // Avvia il flusso OAuth
      const authUrl = oauth.getAuthorizeUrl();
      
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
              const tokens = await oauth.exchangeCodeForTokens(event.data.code);
              const userInfo = await oauth.getUserInfo(tokens.access_token);
              
              resolve({
                address: userInfo.account,
                provider: 'XUMM',
                network: userInfo.network || 'mainnet',
                tokens: tokens,
                userInfo: userInfo,
                isReal: true
              });
            } catch (error) {
              reject(error);
            }
          } else if (event.data.type === 'XUMM_AUTH_ERROR') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', messageHandler);
            reject(new Error(event.data.error || 'Errore autorizzazione XUMM'));
          }
        };

        window.addEventListener('message', messageHandler);
      });

    } catch (error) {
      console.error('Errore XUMM:', error);
      throw new Error('Errore durante la connessione a XUMM');
    }
  }

  static async signTransaction(transaction, accessToken) {
    try {
      // Implementazione firma XUMM
      const response = await fetch('https://xumm.app/api/v1/platform/payload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          txjson: transaction,
          options: {
            submit: false // Solo firma, non invia
          }
        })
      });

      const result = await response.json();
      
      if (result.uuid) {
        return {
          success: true,
          payloadId: result.uuid,
          qrUrl: result.refs.qr_png,
          websocketUrl: result.refs.websocket_status
        };
      } else {
        throw new Error('Errore creazione payload XUMM');
      }
    } catch (error) {
      console.error('Errore firma XUMM:', error);
      return {
        success: false,
        error: error.message || 'Errore durante la firma XUMM'
      };
    }
  }
}

// Trust Wallet Service (Non supportato per XRPL via browser)
export class TrustWalletService {
  static async connect() {
    throw new Error('Trust Wallet non supporta XRPL via browser. Usa Crossmark o XUMM per XRPL.');
  }
}

// Wallet Manager - Gestisce tutti i provider
export class WalletManager {
  static async connectWallet(provider) {
    try {
      let result;
      
      switch (provider) {
        case 'Crossmark':
          result = await CrossmarkService.connect();
          break;
        case 'XUMM':
          result = await XUMMService.connect();
          break;
        case 'TrustWallet':
          result = await TrustWalletService.connect();
          break;
        default:
          throw new Error(`Provider wallet non supportato: ${provider}`);
      }

      // Salva la connessione nel database se è reale
      if (result.isReal && result.address) {
        await this.saveWalletConnection(result);
      }

      return result;
    } catch (error) {
      console.error(`Errore connessione ${provider}:`, error);
      throw error;
    }
  }

  static async saveWalletConnection(walletData) {
    try {
      const { data, error } = await supabase
        .from('wallet_connections')
        .upsert({
          address: walletData.address,
          provider: walletData.provider,
          network: walletData.network,
          connected_at: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'address'
        });

      if (error) {
        console.error('Errore salvataggio connessione wallet:', error);
      } else {
        console.log('✅ Connessione wallet salvata nel database');
      }
    } catch (error) {
      console.error('Errore salvataggio wallet:', error);
    }
  }

  static async disconnectWallet(provider) {
    try {
      switch (provider) {
        case 'Crossmark':
          return await CrossmarkService.disconnect();
        case 'XUMM':
          // XUMM non ha disconnessione esplicita
          return { success: true };
        default:
          return { success: true };
      }
    } catch (error) {
      console.error(`Errore disconnessione ${provider}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getWalletBalance(address, provider) {
    try {
      switch (provider) {
        case 'Crossmark':
          return await CrossmarkService.getBalance(address);
        default:
          throw new Error(`Recupero saldo non supportato per ${provider}`);
      }
    } catch (error) {
      console.error(`Errore recupero saldo ${provider}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async signTransaction(transaction, provider, accessToken = null) {
    try {
      switch (provider) {
        case 'Crossmark':
          return await CrossmarkService.signTransaction(transaction);
        case 'XUMM':
          return await XUMMService.signTransaction(transaction, accessToken);
        default:
          throw new Error(`Firma transazione non supportata per ${provider}`);
      }
    } catch (error) {
      console.error(`Errore firma transazione ${provider}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async signAndSubmitTransaction(transaction, provider) {
    try {
      switch (provider) {
        case 'Crossmark':
          return await CrossmarkService.signAndSubmit(transaction);
        default:
          throw new Error(`Invio transazione non supportato per ${provider}`);
      }
    } catch (error) {
      console.error(`Errore invio transazione ${provider}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default WalletManager;

