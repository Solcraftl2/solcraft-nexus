const { Client, Wallet, dropsToXrp, xrpToDrops } = require('xrpl');
const EventEmitter = require('events');
const DatabaseService = require('./DatabaseService');
const RedisService = require('./RedisService');

/**
 * XRPLService - Servizio backend completo per XRPL
 * Gestisce connessioni, transazioni, token e monitoraggio real-time
 */
class XRPLService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnectedFlag = false;
    this.network = 'testnet';
    this.servers = {
      testnet: 'wss://s.altnet.rippletest.net:51233',
      mainnet: 'wss://xrplcluster.com/'
    };
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
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
      
      // Setup event listeners
      this.setupEventListeners();
      
      await this.client.connect();
      this.isConnectedFlag = true;
      this.reconnectAttempts = 0;

      console.log(`✅ XRPL connesso a ${network}: ${serverUrl}`);
      
      // Subscribe to ledger stream
      await this.subscribeToLedger();
      
      this.emit('connected', { network, server: serverUrl });
      
      return {
        success: true,
        network: this.network,
        server: serverUrl
      };
    } catch (error) {
      console.error('❌ Errore connessione XRPL:', error);
      this.isConnectedFlag = false;
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Tentativo riconnessione ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms...`);
        setTimeout(() => this.connect(network), this.reconnectDelay);
      }
      
      throw new Error(`Connessione fallita: ${error.message}`);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.client) return;

    this.client.on('ledgerClosed', async (ledger) => {
      console.log(`📊 Nuovo Ledger #${ledger.ledger_index} - ${ledger.txn_count} transazioni`);
      
      // Cache ledger data in Redis
      if (RedisService.isConnected()) {
        await RedisService.cacheLedgerData(ledger.ledger_index, ledger, 60);
        
        // Publish real-time update
        await RedisService.publishUpdate('ledger_updates', {
          type: 'ledger_closed',
          data: ledger
        });
      }
      
      this.emit('ledgerClosed', ledger);
    });

    this.client.on('transaction', async (tx) => {
      console.log('📝 Nuova transazione:', tx.transaction.hash);
      
      // Publish real-time transaction update
      if (RedisService.isConnected()) {
        await RedisService.publishUpdate('transaction_updates', {
          type: 'new_transaction',
          data: tx
        });
        
        // Queue event for affected wallets
        const affectedAddresses = this.extractAffectedAddresses(tx);
        for (const address of affectedAddresses) {
          await RedisService.queueEvent(address, {
            type: 'transaction',
            data: tx
          });
          
          // Invalidate wallet balance cache
          await RedisService.redis.del(`wallet:balance:${address}`);
        }
      }
      
      this.emit('transaction', tx);
      
      // Save transaction to database
      try {
        await this.saveTransactionToDatabase(tx);
      } catch (error) {
        console.error('❌ Errore salvataggio transazione:', error);
      }
    });

    this.client.on('disconnected', () => {
      console.log('🔌 XRPL disconnesso');
      this.isConnectedFlag = false;
      this.emit('disconnected');
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Tentativo riconnessione ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        setTimeout(() => this.connect(this.network), this.reconnectDelay);
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ Errore XRPL:', error);
      this.emit('error', error);
    });
  }

  /**
   * Subscribe to ledger stream
   */
  async subscribeToLedger() {
    try {
      await this.client.request({
        command: 'subscribe',
        streams: ['ledger']
      });
      console.log('✅ Sottoscritto al stream ledger');
    } catch (error) {
      console.error('❌ Errore sottoscrizione ledger:', error);
    }
  }

  /**
   * Subscribe to account transactions
   */
  async subscribeToAccount(address) {
    try {
      if (this.subscriptions.has(address)) {
        return; // Already subscribed
      }

      await this.client.request({
        command: 'subscribe',
        accounts: [address]
      });

      this.subscriptions.set(address, true);
      console.log(`✅ Sottoscritto alle transazioni per: ${address}`);
      
      return { success: true, address };
    } catch (error) {
      console.error(`❌ Errore sottoscrizione account ${address}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from account transactions
   */
  async unsubscribeFromAccount(address) {
    try {
      if (!this.subscriptions.has(address)) {
        return; // Not subscribed
      }

      await this.client.request({
        command: 'unsubscribe',
        accounts: [address]
      });

      this.subscriptions.delete(address);
      console.log(`✅ Disiscritto dalle transazioni per: ${address}`);
      
      return { success: true, address };
    } catch (error) {
      console.error(`❌ Errore disiscrizione account ${address}:`, error);
      throw error;
    }
  }

  /**
   * Disconnessione dal network
   */
  async disconnect() {
    try {
      if (this.client && this.isConnectedFlag) {
        await this.client.disconnect();
        this.isConnectedFlag = false;
        this.client = null;
        this.subscriptions.clear();
        console.log('✅ Disconnesso da XRPL');
        this.emit('disconnected');
      }
    } catch (error) {
      console.error('❌ Errore disconnessione:', error);
    }
  }

  /**
   * Verifica connessione
   */
  isConnected() {
    return this.isConnectedFlag && this.client && this.client.isConnected();
  }

  /**
   * Genera nuovo wallet
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
      if (!this.isConnected()) {
        throw new Error('Non connesso a XRPL');
      }
      
      if (this.network !== 'testnet') {
        throw new Error('Funding disponibile solo su Testnet');
      }

      const fundResult = await this.client.fundWallet(wallet);
      console.log('✅ Account finanziato:', fundResult.wallet.address);
      
      // Save wallet to database
      await this.saveWalletToDatabase(fundResult.wallet, fundResult.balance);
      
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
      if (!this.isConnected()) {
        throw new Error('Non connesso a XRPL');
      }
      
      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });

      const accountData = response.result.account_data;
      
      const accountInfo = {
        address: accountData.Account,
        balance: dropsToXrp(accountData.Balance),
        sequence: accountData.Sequence,
        ownerCount: accountData.OwnerCount,
        previousTxnID: accountData.PreviousTxnID,
        flags: accountData.Flags,
        lastUpdated: new Date().toISOString()
      };

      // Update database
      await this.updateAccountInDatabase(accountInfo);
      
      return accountInfo;
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
  async sendXRP(fromSeed, toAddress, amount, memo = null) {
    try {
      if (!this.isConnected()) {
        throw new Error('Non connesso a XRPL');
      }
      
      const wallet = Wallet.fromSeed(fromSeed);
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

      console.log('✅ Pagamento inviato:', result.result.hash);

      const transactionResult = {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.result.hash,
        fee: dropsToXrp(result.result.Fee),
        result: result.result.meta.TransactionResult,
        from: wallet.address,
        to: toAddress,
        amount: amount,
        memo: memo,
        timestamp: new Date().toISOString()
      };

      // Save to database
      await this.saveTransactionToDatabase({
        transaction: result.result,
        meta: result.result.meta
      });

      return transactionResult;
    } catch (error) {
      console.error('❌ Errore invio pagamento:', error);
      throw error;
    }
  }

  /**
   * Crea Trust Line per token
   */
  async createTrustLine(walletSeed, tokenCode, issuerAddress, limit = '1000000') {
    try {
      if (!this.isConnected()) {
        throw new Error('Non connesso a XRPL');
      }
      
      const wallet = Wallet.fromSeed(walletSeed);

      const trustSet = {
        TransactionType: 'TrustSet',
        Account: wallet.address,
        LimitAmount: {
          currency: tokenCode,
          issuer: issuerAddress,
          value: limit
        }
      };

      const prepared = await this.client.autofill(trustSet);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ Trust Line creata:', result.result.hash);

      const trustLineResult = {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.result.hash,
        tokenCode,
        issuerAddress,
        limit,
        account: wallet.address,
        timestamp: new Date().toISOString()
      };

      // Save to database
      await this.saveTrustLineToDatabase(trustLineResult);

      return trustLineResult;
    } catch (error) {
      console.error('❌ Errore creazione Trust Line:', error);
      throw error;
    }
  }

  /**
   * Emetti token personalizzato
   */
  async issueToken(issuerSeed, holderAddress, tokenCode, amount) {
    try {
      if (!this.isConnected()) {
        throw new Error('Non connesso a XRPL');
      }
      
      const wallet = Wallet.fromSeed(issuerSeed);

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

      console.log('✅ Token emesso:', result.result.hash);

      const tokenResult = {
        success: result.result.meta.TransactionResult === 'tesSUCCESS',
        hash: result.result.hash,
        tokenCode,
        amount,
        issuer: wallet.address,
        holder: holderAddress,
        timestamp: new Date().toISOString()
      };

      // Save to database
      await this.saveTokenToDatabase(tokenResult);

      return tokenResult;
    } catch (error) {
      console.error('❌ Errore emissione token:', error);
      throw error;
    }
  }

  /**
   * Ottieni storico transazioni
   */
  async getTransactionHistory(address, limit = 20) {
    try {
      if (!this.isConnected()) {
        throw new Error('Non connesso a XRPL');
      }
      
      const response = await this.client.request({
        command: 'account_tx',
        account: address,
        limit: limit,
        ledger_index_min: -1,
        ledger_index_max: -1
      });

      const transactions = response.result.transactions || [];
      
      // Save to database
      for (const tx of transactions) {
        await this.saveTransactionToDatabase(tx);
      }

      return transactions;
    } catch (error) {
      console.error('❌ Errore get transaction history:', error);
      throw error;
    }
  }

  /**
   * Database operations
   */
  async saveWalletToDatabase(wallet, balance) {
    try {
      await DatabaseService.saveWallet({
        address: wallet.address,
        balance: balance,
        network: this.network,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Errore salvataggio wallet:', error);
    }
  }

  async updateAccountInDatabase(accountInfo) {
    try {
      await DatabaseService.updateAccount(accountInfo);
    } catch (error) {
      console.error('❌ Errore aggiornamento account:', error);
    }
  }

  async saveTransactionToDatabase(transaction) {
    try {
      const tx = transaction.transaction || transaction;
      await DatabaseService.saveTransaction({
        hash: tx.hash,
        type: tx.TransactionType,
        account: tx.Account,
        destination: tx.Destination,
        amount: tx.Amount,
        fee: tx.Fee,
        sequence: tx.Sequence,
        ledger_index: transaction.ledger_index,
        meta: transaction.meta,
        network: this.network,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Errore salvataggio transazione:', error);
    }
  }

  async saveTrustLineToDatabase(trustLine) {
    try {
      await DatabaseService.saveTrustLine(trustLine);
    } catch (error) {
      console.error('❌ Errore salvataggio trust line:', error);
    }
  }

  async saveTokenToDatabase(token) {
    try {
      await DatabaseService.saveToken(token);
    } catch (error) {
      console.error('❌ Errore salvataggio token:', error);
    }
  }

  /**
   * Utility methods
   */
  isValidAddress(address) {
    try {
      if (!address || typeof address !== 'string') return false;
      if (address.length < 25 || address.length > 34) return false;
      if (!address.startsWith('r')) return false;
      
      const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
      return base58Regex.test(address);
    } catch (error) {
      return false;
    }
  }

  formatXRP(amount) {
    return `${parseFloat(amount).toFixed(6)} XRP`;
  }

  dropsToXrp(drops) {
    return dropsToXrp(drops);
  }

  xrpToDrops(xrp) {
    return xrpToDrops(xrp);
  }

  /**
   * Estrae gli indirizzi coinvolti in una transazione
   */
  extractAffectedAddresses(tx) {
    const addresses = new Set();
    const transaction = tx.transaction || tx;
    
    if (transaction.Account) {
      addresses.add(transaction.Account);
    }
    
    if (transaction.Destination) {
      addresses.add(transaction.Destination);
    }
    
    // Check for other affected addresses in metadata
    if (tx.meta && tx.meta.AffectedNodes) {
      for (const node of tx.meta.AffectedNodes) {
        const nodeData = node.ModifiedNode || node.CreatedNode || node.DeletedNode;
        if (nodeData && nodeData.FinalFields && nodeData.FinalFields.Account) {
          addresses.add(nodeData.FinalFields.Account);
        }
        if (nodeData && nodeData.NewFields && nodeData.NewFields.Account) {
          addresses.add(nodeData.NewFields.Account);
        }
      }
    }
    
    return Array.from(addresses);
  }

  getNetworkInfo() {
    return {
      network: this.network,
      server: this.servers[this.network],
      isConnected: this.isConnected(),
      subscriptions: Array.from(this.subscriptions.keys())
    };
  }
}

// Istanza singleton
const xrplService = new XRPLService();

module.exports = xrplService;

