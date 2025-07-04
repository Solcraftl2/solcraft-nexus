import { logger } from '../../../netlify/functions/utils/logger.js';
// XRPL Service - Gestione transazioni e operazioni blockchain XRPL
import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

/**
 * Servizio per gestire transazioni XRPL reali
 * Fornisce metodi per connessione, pagamenti, tokenizzazione e trading
 */
class XRPLService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.network = 'wss://xrplcluster.com/'; // Mainnet
    // this.network = 'wss://s.altnet.rippletest.net:51233'; // Testnet per sviluppo
  }

  /**
   * Connessione al network XRPL
   * @returns {Promise<Object>} Risultato della connessione
   */
  async connect() {
    try {
      if (!this.client) {
        this.client = new Client(this.network);
      }
      
      if (!this.isConnected) {
        await this.client.connect();
        this.isConnected = true;
        logger.info('✅ Connesso al network XRPL');
      }
      
      return { success: true };
    } catch (error) {
      logger.error('❌ Errore connessione XRPL:', error);
      return { 
        success: false, 
        error: 'Impossibile connettersi al network XRPL' 
      };
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
        logger.info('✅ Disconnesso dal network XRPL');
      }
    } catch (error) {
      logger.error('❌ Errore disconnessione XRPL:', error);
    }
  }

  /**
   * Ottieni informazioni account
   * @param {string} address - Indirizzo del wallet
   * @returns {Promise<Object>} Informazioni dell'account
   */
  async getAccountInfo(address) {
    try {
      await this.connect();
      
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });

      return {
        success: true,
        data: {
          address: address,
          balance: dropsToXrp(accountInfo.result.account_data.Balance),
          sequence: accountInfo.result.account_data.Sequence,
          ownerCount: accountInfo.result.account_data.OwnerCount,
          reserve: accountInfo.result.account_data.Reserve || 10,
          flags: accountInfo.result.account_data.Flags
        }
      };
    } catch (error) {
      logger.error('❌ Errore recupero info account:', error);
      return { 
        success: false, 
        error: 'Account non trovato o errore di rete' 
      };
    }
  }

  /**
   * Ottieni bilancio token
   * @param {string} address - Indirizzo del wallet
   * @returns {Promise<Object>} Bilanci dei token
   */
  async getTokenBalances(address) {
    try {
      await this.connect();
      
      const lines = await this.client.request({
        command: 'account_lines',
        account: address,
        ledger_index: 'validated'
      });

      const balances = lines.result.lines.map(line => ({
        currency: line.currency,
        issuer: line.account,
        balance: parseFloat(line.balance),
        limit: parseFloat(line.limit),
        quality_in: line.quality_in,
        quality_out: line.quality_out
      }));

      return {
        success: true,
        data: balances
      };
    } catch (error) {
      logger.error('❌ Errore recupero bilanci token:', error);
      return { 
        success: false, 
        error: 'Impossibile recuperare bilanci token' 
      };
    }
  }

  /**
   * Invia pagamento XRP
   * @param {Object} fromWallet - Wallet mittente
   * @param {string} toAddress - Indirizzo destinatario
   * @param {number} amount - Importo in XRP
   * @param {string} memo - Memo opzionale
   * @returns {Promise<Object>} Risultato della transazione
   */
  async sendXRPPayment(fromWallet, toAddress, amount, memo = '') {
    try {
      await this.connect();

      // Valida parametri
      if (!fromWallet || !toAddress || !amount) {
        throw new Error('Parametri mancanti per il pagamento');
      }

      if (amount <= 0) {
        throw new Error('Importo deve essere maggiore di zero');
      }

      // Prepara transazione
      const payment = {
        TransactionType: 'Payment',
        Account: fromWallet.address,
        Destination: toAddress,
        Amount: xrpToDrops(amount.toString()),
        Fee: '12' // Fee standard in drops
      };

      // Aggiungi memo se presente
      if (memo) {
        payment.Memos = [{
          Memo: {
            MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase()
          }
        }];
      }

      // Firma e invia transazione
      const prepared = await this.client.autofill(payment);
      const signed = fromWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        return {
          success: true,
          data: {
            hash: result.result.hash,
            ledgerIndex: result.result.ledger_index,
            fee: dropsToXrp(result.result.Fee),
            amount: amount,
            from: fromWallet.address,
            to: toAddress,
            memo: memo
          }
        };
      } else {
        throw new Error(`Transazione fallita: ${result.result.meta.TransactionResult}`);
      }

    } catch (error) {
      logger.error('❌ Errore invio pagamento:', error);
      return { 
        success: false, 
        error: error.message || 'Errore durante l\'invio del pagamento' 
      };
    }
  }

  /**
   * Crea token personalizzato
   * @param {Object} issuerWallet - Wallet emittente
   * @param {string} currencyCode - Codice valuta (3 caratteri)
   * @param {number} totalSupply - Fornitura totale
   * @param {string} memo - Memo opzionale
   * @returns {Promise<Object>} Risultato della creazione
   */
  async createToken(issuerWallet, currencyCode, totalSupply, memo = '') {
    try {
      await this.connect();

      // Valida parametri
      if (!issuerWallet || !currencyCode || !totalSupply) {
        throw new Error('Parametri mancanti per la creazione del token');
      }

      if (currencyCode.length !== 3) {
        throw new Error('Il codice valuta deve essere di 3 caratteri');
      }

      // Prepara transazione per creare token
      const payment = {
        TransactionType: 'Payment',
        Account: issuerWallet.address,
        Destination: issuerWallet.address, // Self-payment per creare token
        Amount: {
          currency: currencyCode,
          value: totalSupply.toString(),
          issuer: issuerWallet.address
        },
        Fee: '12'
      };

      // Aggiungi memo se presente
      if (memo) {
        payment.Memos = [{
          Memo: {
            MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase()
          }
        }];
      }

      // Firma e invia transazione
      const prepared = await this.client.autofill(payment);
      const signed = issuerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        return {
          success: true,
          data: {
            hash: result.result.hash,
            currency: currencyCode,
            issuer: issuerWallet.address,
            totalSupply: totalSupply,
            ledgerIndex: result.result.ledger_index
          }
        };
      } else {
        throw new Error(`Creazione token fallita: ${result.result.meta.TransactionResult}`);
      }

    } catch (error) {
      logger.error('❌ Errore creazione token:', error);
      return { 
        success: false, 
        error: error.message || 'Errore durante la creazione del token' 
      };
    }
  }

  /**
   * Crea Trust Line per token
   * @param {Object} wallet - Wallet che crea la trust line
   * @param {string} currency - Codice valuta
   * @param {string} issuer - Indirizzo emittente
   * @param {string} limit - Limite di fiducia
   * @returns {Promise<Object>} Risultato della creazione
   */
  async createTrustLine(wallet, currency, issuer, limit = '1000000000') {
    try {
      await this.connect();

      const trustSet = {
        TransactionType: 'TrustSet',
        Account: wallet.address,
        LimitAmount: {
          currency: currency,
          issuer: issuer,
          value: limit
        },
        Fee: '12'
      };

      const prepared = await this.client.autofill(trustSet);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        return {
          success: true,
          data: {
            hash: result.result.hash,
            currency: currency,
            issuer: issuer,
            limit: limit
          }
        };
      } else {
        throw new Error(`Trust Line fallita: ${result.result.meta.TransactionResult}`);
      }

    } catch (error) {
      logger.error('❌ Errore creazione Trust Line:', error);
      return { 
        success: false, 
        error: error.message || 'Errore durante la creazione della Trust Line' 
      };
    }
  }

  /**
   * Ottieni cronologia transazioni
   * @param {string} address - Indirizzo del wallet
   * @param {number} limit - Numero massimo di transazioni
   * @returns {Promise<Object>} Cronologia transazioni
   */
  async getTransactionHistory(address, limit = 20) {
    try {
      await this.connect();

      const transactions = await this.client.request({
        command: 'account_tx',
        account: address,
        limit: limit,
        ledger_index_min: -1,
        ledger_index_max: -1
      });

      const history = transactions.result.transactions.map(tx => ({
        hash: tx.tx.hash,
        type: tx.tx.TransactionType,
        date: new Date((tx.tx.date + 946684800) * 1000), // Ripple epoch to Unix
        ledgerIndex: tx.tx.ledger_index,
        fee: dropsToXrp(tx.tx.Fee),
        account: tx.tx.Account,
        destination: tx.tx.Destination,
        amount: tx.tx.Amount,
        result: tx.meta.TransactionResult,
        validated: tx.validated
      }));

      return {
        success: true,
        data: history
      };

    } catch (error) {
      logger.error('❌ Errore recupero cronologia:', error);
      return { 
        success: false, 
        error: 'Impossibile recuperare la cronologia delle transazioni' 
      };
    }
  }

  /**
   * Valida indirizzo XRPL
   * @param {string} address - Indirizzo da validare
   * @returns {boolean} True se valido
   */
  isValidAddress(address) {
    try {
      // Controllo formato base
      if (!address || typeof address !== 'string') {
        return false;
      }

      // Controllo lunghezza e caratteri
      if (address.length < 25 || address.length > 34) {
        return false;
      }

      // Controllo che inizi con 'r'
      if (!address.startsWith('r')) {
        return false;
      }

      // Controllo caratteri validi (base58)
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      return base58Regex.test(address);

    } catch (error) {
      return false;
    }
  }

  /**
   * Calcola commissioni di rete
   * @returns {Promise<Object>} Commissioni di rete
   */
  async getNetworkFees() {
    try {
      await this.connect();

      const fees = await this.client.request({
        command: 'server_info'
      });

      const baseFee = fees.result.info.validated_ledger.base_fee_xrp;
      const reserveBase = fees.result.info.validated_ledger.reserve_base_xrp;
      const reserveInc = fees.result.info.validated_ledger.reserve_inc_xrp;

      return {
        success: true,
        data: {
          baseFee: baseFee,
          reserveBase: reserveBase,
          reserveIncrement: reserveInc,
          recommendedFee: baseFee * 1.2 // 20% sopra la fee base
        }
      };

    } catch (error) {
      logger.error('❌ Errore recupero commissioni:', error);
      return { 
        success: false, 
        error: 'Impossibile recuperare le commissioni di rete' 
      };
    }
  }

  /**
   * Monitora transazione
   * @param {string} hash - Hash della transazione
   * @param {number} timeout - Timeout in millisecondi
   * @returns {Promise<Object>} Stato della transazione
   */
  async waitForTransaction(hash, timeout = 30000) {
    try {
      await this.connect();

      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        try {
          const tx = await this.client.request({
            command: 'tx',
            transaction: hash
          });

          if (tx.result.validated) {
            return {
              success: true,
              data: {
                hash: hash,
                validated: true,
                result: tx.result.meta.TransactionResult,
                ledgerIndex: tx.result.ledger_index
              }
            };
          }
        } catch (error) {
          // Transazione non ancora validata, continua a controllare
        }

        // Aspetta 1 secondo prima del prossimo controllo
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: false,
        error: 'Timeout: transazione non validata entro il tempo limite'
      };

    } catch (error) {
      logger.error('❌ Errore monitoraggio transazione:', error);
      return { 
        success: false, 
        error: 'Errore durante il monitoraggio della transazione' 
      };
    }
  }
}

/**
 * Utility functions per XRPL
 */
export const XRPLUtils = {
  /**
   * Converti XRP in drops
   * @param {number|string} xrp - Importo in XRP
   * @returns {string} Importo in drops
   */
  xrpToDrops: (xrp) => {
    return (parseFloat(xrp) * 1000000).toString();
  },

  /**
   * Converti drops in XRP
   * @param {number|string} drops - Importo in drops
   * @returns {string} Importo in XRP
   */
  dropsToXrp: (drops) => {
    return (parseInt(drops) / 1000000).toString();
  },

  /**
   * Formatta importo per display
   * @param {number|string} amount - Importo
   * @param {string} currency - Valuta
   * @returns {string} Importo formattato
   */
  formatAmount: (amount, currency = 'XRP') => {
    if (currency === 'XRP') {
      return `${parseFloat(amount).toFixed(6)} XRP`;
    } else {
      return `${parseFloat(amount).toFixed(2)} ${currency}`;
    }
  },

  /**
   * Genera codice valuta da nome asset
   * @param {string} assetName - Nome dell'asset
   * @returns {string} Codice valuta (3 caratteri)
   */
  generateCurrencyCode: (assetName) => {
    // Prende le prime 3 lettere maiuscole
    return assetName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
  },

  /**
   * Calcola valore in USD (mock - in produzione usare API di prezzo)
   * @param {number|string} xrpAmount - Importo in XRP
   * @param {number} xrpPrice - Prezzo XRP in USD
   * @returns {string} Valore in USD
   */
  calculateUSDValue: (xrpAmount, xrpPrice = 0.50) => {
    return (parseFloat(xrpAmount) * xrpPrice).toFixed(2);
  }
};

// Istanza singleton del servizio
export const xrplService = new XRPLService();

// Export default per compatibilità
export default xrplService;

