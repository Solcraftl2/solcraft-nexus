import { Client, Wallet, dropsToXrp, xrpToDrops } from 'xrpl';

/**
 * XRPLService - Servizio per gestire tutte le operazioni XRPL
 * Gestisce connessioni, wallet, transazioni e query del ledger
 */
class XRPLService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.network = 'testnet'; // 'testnet' o 'mainnet'
    this.servers = {
      testnet: 'wss://s.altnet.rippletest.net:51233',
      mainnet: 'wss://xrplcluster.com/'
    };
    this.currentWallet = null;
    this.eventListeners = new Map();
  }

  /**
   * Connessione al network XRPL
   */
  async connect(network = 'testnet') {
    try {
      this.network = network;
      const serverUrl = this.servers[network];
      
      if (!serverUrl) {
        throw new Error(`Network non supportato: ${network}`);
      }

      this.client = new Client(serverUrl);
      await this.client.connect();
      this.isConnected = true;

      console.log(`✅ Connesso a XRPL ${network}: ${serverUrl}`);
      
      // Setup event listeners
      this.setupEventListeners();
      
      return {
        success: true,
        network: this.network,
        server: serverUrl
      };
    } catch (error) {
      console.error('❌ Errore connessione XRPL:', error);
      throw new Error(`Connessione fallita: ${error.message}`);
    }
  }

  /**
   * Disconnessione dal network
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        this.client = null;
        console.log('✅ Disconnesso da XRPL');
      }
    } catch (error) {
      console.error('❌ Errore disconnessione:', error);
    }
  }

  /**
   * Verifica connessione
   */
  checkConnection() {
    if (!this.client || !this.isConnected) {
      throw new Error('Non connesso a XRPL. Chiamare connect() prima.');
    }
  }

  /**
   * Creazione nuovo wallet
   */
  generateWallet() {
    try {
      const wallet = Wallet.generate();
      console.log('✅ Nuovo wallet generato:', wallet.address);
      
      return {
        address: wallet.address,
        seed: wallet.seed,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey
      };
    } catch (error) {
      console.error('❌ Errore generazione wallet:', error);
      throw error;
    }
  }

  /**
   * Importa wallet da seed
   */
  importWallet(seed) {
    try {
      const wallet = Wallet.fromSeed(seed);
      this.currentWallet = wallet;
      console.log('✅ Wallet importato:', wallet.address);
      
      return {
        address: wallet.address,
        publicKey: wallet.publicKey
      };
    } catch (error) {
      console.error('❌ Errore import wallet:', error);
      throw new Error(`Import fallito: ${error.message}`);
    }
  }

  /**
   * Finanziamento account su Testnet
   */
  async fundTestnetAccount(wallet = null) {
    try {
      this.checkConnection();
      
      if (this.network !== 'testnet') {
        throw new Error('Funding disponibile solo su Testnet');
      }

      const fundResult = await this.client.fundWallet(wallet);
      console.log('✅ Account finanziato:', fundResult);
      
      return {
        wallet: {
          address: fundResult.wallet.address,
          seed: fundResult.wallet.seed
        },
        balance: fundResult.balance
      };
    } catch (error) {
      console.error('❌ Errore funding account:', error);
      throw error;
    }
  }

  /**
   * Ottieni informazioni account
   */
  async getAccountInfo(address) {
    try {
      this.checkConnection();
      
      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });

      const accountData = response.result.account_data;
      
      return {
        address: accountData.Account,
        balance: dropsToXrp(accountData.Balance),
        sequence: accountData.Sequence,
        ownerCount: accountData.OwnerCount,
        previousTxnID: accountData.PreviousTxnID,
        flags: accountData.Flags
      };
    } catch (error) {
      console.error('❌ Errore get account info:', error);
      if (error.data?.error === 'actNotFound') {
        throw new Error('Account non trovato o non attivato');
      }
      throw error;
    }
  }

  /**
   * Ottieni bilancio account
   */
  async getBalance(address) {
    try {
      const accountInfo = await this.getAccountInfo(address);
      return parseFloat(accountInfo.balance);
    } catch (error) {
      console.error('❌ Errore get balance:', error);
      return 0;
    }
  }

  /**
   * Invia pagamento XRP
   */
  async sendXRP(fromWallet, toAddress, amount, memo = null) {
    try {
      this.checkConnection();
      
      if (!fromWallet || !fromWallet.seed) {
        throw new Error('Wallet mittente non valido');
      }

      const wallet = Wallet.fromSeed(fromWallet.seed);
      const amountInDrops = xrpToDrops(amount.toString());

      const payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: toAddress,
        Amount: amountInDrops
      };

      // Aggiungi memo se fornito
      if (memo) {
        payment.Memos = [{
          Memo: {
            MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase()
          }
        }];
      }

      // Prepara e invia transazione
      const prepared = await this.client.autofill(payment);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ Pagamento inviato:', result);

      return {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.result.hash,
        fee: dropsToXrp(result.result.Fee),
        result: result.result.meta.TransactionResult
      };
    } catch (error) {
      console.error('❌ Errore invio pagamento:', error);
      throw error;
    }
  }

  /**
   * Crea Trust Line per token
   */
  async createTrustLine(wallet, tokenCode, issuerAddress, limit = '1000000') {
    try {
      this.checkConnection();
      
      const walletObj = Wallet.fromSeed(wallet.seed);

      const trustSet = {
        TransactionType: 'TrustSet',
        Account: walletObj.address,
        LimitAmount: {
          currency: tokenCode,
          issuer: issuerAddress,
          value: limit
        }
      };

      const prepared = await this.client.autofill(trustSet);
      const signed = walletObj.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ Trust Line creata:', result);

      return {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.result.hash,
        tokenCode,
        issuerAddress,
        limit
      };
    } catch (error) {
      console.error('❌ Errore creazione Trust Line:', error);
      throw error;
    }
  }

  /**
   * Emetti token personalizzato
   */
  async issueToken(issuerWallet, holderAddress, tokenCode, amount) {
    try {
      this.checkConnection();
      
      const wallet = Wallet.fromSeed(issuerWallet.seed);

      const payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: holderAddress,
        Amount: {
          currency: tokenCode,
          issuer: wallet.address,
          value: amount.toString()
        }
      };

      const prepared = await this.client.autofill(payment);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ Token emesso:', result);

      return {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.result.hash,
        tokenCode,
        amount,
        issuer: wallet.address,
        holder: holderAddress
      };
    } catch (error) {
      console.error('❌ Errore emissione token:', error);
      throw error;
    }
  }

  /**
   * Crea ordine DEX
   */
  async createDEXOrder(wallet, takerGets, takerPays, expiration = null) {
    try {
      this.checkConnection();
      
      const walletObj = Wallet.fromSeed(wallet.seed);

      const offer = {
        TransactionType: 'OfferCreate',
        Account: walletObj.address,
        TakerGets: takerGets,
        TakerPays: takerPays
      };

      if (expiration) {
        offer.Expiration = expiration;
      }

      const prepared = await this.client.autofill(offer);
      const signed = walletObj.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ Ordine DEX creato:', result);

      return {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.result.hash,
        offerSequence: result.result.Sequence
      };
    } catch (error) {
      console.error('❌ Errore creazione ordine DEX:', error);
      throw error;
    }
  }

  /**
   * Ottieni Order Book DEX
   */
  async getOrderBook(takerGets, takerPays, limit = 20) {
    try {
      this.checkConnection();
      
      const response = await this.client.request({
        command: 'book_offers',
        taker_gets: takerGets,
        taker_pays: takerPays,
        limit: limit
      });

      return response.result.offers || [];
    } catch (error) {
      console.error('❌ Errore get order book:', error);
      throw error;
    }
  }

  /**
   * Ottieni storico transazioni
   */
  async getTransactionHistory(address, limit = 20) {
    try {
      this.checkConnection();
      
      const response = await this.client.request({
        command: 'account_tx',
        account: address,
        limit: limit,
        ledger_index_min: -1,
        ledger_index_max: -1
      });

      return response.result.transactions || [];
    } catch (error) {
      console.error('❌ Errore get transaction history:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners per ledger updates
   */
  setupEventListeners() {
    if (!this.client) return;

    // Sottoscrivi a ledger close events
    this.client.request({
      command: 'subscribe',
      streams: ['ledger']
    });

    // Listener per nuovi ledger
    this.client.on('ledgerClosed', (ledger) => {
      console.log(`📊 Nuovo Ledger #${ledger.ledger_index} - ${ledger.txn_count} transazioni`);
      this.notifyListeners('ledgerClosed', ledger);
    });

    // Listener per transazioni
    this.client.on('transaction', (tx) => {
      console.log('📝 Nuova transazione:', tx);
      this.notifyListeners('transaction', tx);
    });
  }

  /**
   * Aggiungi listener personalizzato
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Rimuovi listener
   */
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Notifica listeners
   */
  notifyListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Errore in listener ${event}:`, error);
        }
      });
    }
  }

  /**
   * Ottieni info network corrente
   */
  getNetworkInfo() {
    return {
      network: this.network,
      server: this.servers[this.network],
      isConnected: this.isConnected,
      currentWallet: this.currentWallet?.address || null
    };
  }

  /**
   * Validazione indirizzo XRPL
   */
  isValidAddress(address) {
    try {
      // Verifica formato base
      if (!address || typeof address !== 'string') return false;
      if (address.length < 25 || address.length > 34) return false;
      if (!address.startsWith('r')) return false;
      
      // Verifica caratteri validi (base58)
      const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
      return base58Regex.test(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Formatta importo XRP
   */
  formatXRP(amount) {
    return `${parseFloat(amount).toFixed(6)} XRP`;
  }

  /**
   * Converti drops a XRP
   */
  dropsToXrp(drops) {
    return dropsToXrp(drops);
  }

  /**
   * Converti XRP a drops
   */
  xrpToDrops(xrp) {
    return xrpToDrops(xrp);
  }
}

// Istanza singleton
const xrplService = new XRPLService();

export default xrplService;

