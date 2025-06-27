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
      const response = await window.crossmark.signAndSubmitAndWait(transaction);
      return response;
    } catch (error) {
      console.error('Errore firma transazione Crossmark:', error);
      throw error;
    }
  }

  static async getAccountInfo(address) {
    if (!await this.isInstalled()) {
      throw new Error('Crossmark wallet non installato');
    }

    try {
      // Usa l'API XRPL tramite Crossmark per ottenere info account
      const accountInfo = await window.crossmark.request({
        method: 'account_info',
        params: [{
          account: address,
          ledger_index: 'current'
        }]
      });
      
      return accountInfo;
    } catch (error) {
      console.error('Errore recupero info account:', error);
      throw error;
    }
  }
}

// XUMM Wallet Service
export class XummService {
  static apiKey = import.meta.env.VITE_XUMM_API_KEY || 'demo-key';
  static xummInstance = null;

  static async initialize() {
    if (this.xummInstance) return this.xummInstance;

    try {
      const { XummPkce } = await import('xumm-oauth2-pkce');
      
      this.xummInstance = new XummPkce(this.apiKey, {
        redirectUrl: window.location.origin,
        rememberJwt: true
      });

      return this.xummInstance;
    } catch (error) {
      console.error('Errore inizializzazione XUMM:', error);
      throw error;
    }
  }

  static async connect() {
    const xumm = await this.initialize();

    try {
      // Verifica se c'è già una sessione attiva
      const existingState = await xumm.state();
      
      if (existingState?.me?.account) {
        return {
          address: existingState.me.account,
          provider: 'XUMM',
          network: existingState.me.networkType || 'mainnet',
          jwt: existingState.jwt,
          isReal: true
        };
      }

      // Avvia nuovo processo di autorizzazione
      const authResult = await xumm.authorize();
      
      if (!authResult?.me?.account) {
        throw new Error('Autorizzazione XUMM fallita o cancellata');
      }

      return {
        address: authResult.me.account,
        provider: 'XUMM',
        network: authResult.me.networkType || 'mainnet',
        jwt: authResult.jwt,
        isReal: true
      };
    } catch (error) {
      console.error('Errore connessione XUMM:', error);
      throw error;
    }
  }

  static async createPayload(transaction) {
    const xumm = await this.initialize();
    
    try {
      const payload = await xumm.payload.create(transaction);
      return payload;
    } catch (error) {
      console.error('Errore creazione payload XUMM:', error);
      throw error;
    }
  }
}

// User Service per gestire utenti nel database
export class UserService {
  static async createOrUpdateUser(walletData) {
    try {
      const userData = {
        wallet_address: walletData.address,
        wallet_provider: walletData.provider,
        wallet_network: walletData.network,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Verifica se l'utente esiste già
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletData.address)
        .single();

      if (existingUser) {
        // Aggiorna utente esistente
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            wallet_provider: walletData.provider,
            wallet_network: walletData.network,
            updated_at: new Date().toISOString()
          })
          .eq('wallet_address', walletData.address)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Crea nuovo utente
        const { data, error } = await supabase
          .from('user_profiles')
          .insert(userData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Errore gestione utente:', error);
      throw error;
    }
  }

  static async getUserByWallet(address) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Errore recupero utente:', error);
      throw error;
    }
  }
}

// Transaction Service per gestire transazioni XRPL
export class TransactionService {
  static async createPayment(fromAddress, toAddress, amount, currency = 'XRP') {
    const transaction = {
      TransactionType: 'Payment',
      Account: fromAddress,
      Destination: toAddress,
      Amount: currency === 'XRP' ? 
        (parseFloat(amount) * 1000000).toString() : // XRP in drops
        {
          currency: currency,
          value: amount.toString(),
          issuer: toAddress // Per token personalizzati
        }
    };

    return transaction;
  }

  static async createTokenOffer(account, tokenAmount, tokenCurrency, tokenIssuer, xrpAmount) {
    const transaction = {
      TransactionType: 'OfferCreate',
      Account: account,
      TakerGets: (parseFloat(xrpAmount) * 1000000).toString(), // XRP in drops
      TakerPays: {
        currency: tokenCurrency,
        value: tokenAmount.toString(),
        issuer: tokenIssuer
      }
    };

    return transaction;
  }

  static async submitTransaction(transaction, walletProvider) {
    try {
      let result;

      switch (walletProvider) {
        case 'Crossmark':
          result = await CrossmarkService.signTransaction(transaction);
          break;
        case 'XUMM':
          result = await XummService.createPayload(transaction);
          break;
        default:
          throw new Error(`Wallet provider ${walletProvider} non supportato`);
      }

      // Salva la transazione nel database
      await this.saveTransactionToDatabase(transaction, result);
      
      return result;
    } catch (error) {
      console.error('Errore invio transazione:', error);
      throw error;
    }
  }

  static async saveTransactionToDatabase(transaction, result) {
    try {
      const transactionData = {
        transaction_hash: result.hash || result.txid,
        from_address: transaction.Account,
        to_address: transaction.Destination,
        amount: transaction.Amount,
        transaction_type: transaction.TransactionType,
        status: result.validated ? 'completed' : 'pending',
        network: 'mainnet',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) throw error;
    } catch (error) {
      console.error('Errore salvataggio transazione:', error);
      // Non bloccare il flusso principale per errori di database
    }
  }
}

export default {
  CrossmarkService,
  XummService,
  UserService,
  TransactionService
};

