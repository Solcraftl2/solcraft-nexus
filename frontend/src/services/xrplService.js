/**
 * XRPL Service Reale Migliorato per Solcraft Nexus
 * Client XRPL completo con monitoraggio real-time e cache ottimizzata
 * Implementazione basata sui code samples XRPL ufficiali
 */

import { Client, dropsToXrp, xrpToDrops, isValidClassicAddress } from 'xrpl';

class XRPLService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.currentNetwork = null;
        this.eventListeners = new Map();
        this.cache = new Map();
        this.subscriptions = new Set();
        
        // Configurazione network
        this.networks = {
            testnet: {
                server: 'wss://s.altnet.rippletest.net:51233',
                name: 'Testnet',
                explorer: 'https://testnet.xrpl.org'
            },
            devnet: {
                server: 'wss://s.devnet.rippletest.net:51233',
                name: 'Devnet',
                explorer: 'https://devnet.xrpl.org'
            },
            mainnet: {
                server: 'wss://xrplcluster.com',
                name: 'Mainnet',
                explorer: 'https://livenet.xrpl.org'
            }
        };
        
        // Configurazione cache
        this.cacheConfig = {
            accountInfo: 30000, // 30 secondi
            balance: 15000, // 15 secondi
            transactions: 60000, // 1 minuto
            maxEntries: 1000
        };
        
        // Configurazione retry
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
        
        // Avvia cleanup cache periodico
        this.startCacheCleanup();
    }

    /**
     * Connessione al network XRPL con retry automatico
     */
    async connect(network = 'testnet') {
        try {
            console.log(`🔄 Connessione a XRPL ${network}...`);
            
            if (this.isConnected && this.currentNetwork === network) {
                console.log('✅ Già connesso a', network);
                return true;
            }

            // Disconnetti se già connesso a un altro network
            if (this.isConnected) {
                await this.disconnect();
            }

            const networkConfig = this.networks[network];
            if (!networkConfig) {
                throw new Error(`Network non supportato: ${network}`);
            }

            // Crea nuovo client
            this.client = new Client(networkConfig.server);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Connetti con retry
            await this.connectWithRetry();
            
            this.isConnected = true;
            this.currentNetwork = network;
            
            console.log(`✅ Connesso a XRPL ${network}`);
            
            // Emetti evento connessione
            this.emit('connected', { network, server: networkConfig.server });
            
            return true;

        } catch (error) {
            console.error('❌ Errore connessione XRPL:', error);
            this.isConnected = false;
            this.currentNetwork = null;
            throw error;
        }
    }

    /**
     * Connessione con retry automatico
     */
    async connectWithRetry() {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                await this.client.connect();
                return;
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Tentativo ${attempt}/${this.retryConfig.maxRetries} fallito:`, error.message);
                
                if (attempt < this.retryConfig.maxRetries) {
                    const delay = Math.min(
                        this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
                        this.retryConfig.maxDelay
                    );
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Setup event listeners per il client
     */
    setupEventListeners() {
        if (!this.client) return;

        // Listener per disconnessioni
        this.client.on('disconnected', (code) => {
            console.warn('⚠️ XRPL disconnesso:', code);
            this.isConnected = false;
            this.emit('disconnected', { code });
            
            // Auto-reconnect dopo 5 secondi
            setTimeout(() => {
                if (!this.isConnected && this.currentNetwork) {
                    console.log('🔄 Tentativo auto-reconnect...');
                    this.connect(this.currentNetwork).catch(error => {
                        console.error('❌ Auto-reconnect fallito:', error);
                    });
                }
            }, 5000);
        });

        // Listener per errori
        this.client.on('error', (error) => {
            console.error('❌ Errore XRPL client:', error);
            this.emit('error', error);
        });

        // Listener per transazioni
        this.client.on('transaction', (tx) => {
            this.handleTransaction(tx);
        });

        // Listener per validazioni ledger
        this.client.on('ledgerClosed', (ledger) => {
            this.emit('ledgerClosed', ledger);
        });
    }

    /**
     * Gestisce transazioni in arrivo
     */
    handleTransaction(tx) {
        try {
            // Invalida cache per account coinvolti
            if (tx.transaction) {
                this.invalidateAccountCache(tx.transaction.Account);
                if (tx.transaction.Destination) {
                    this.invalidateAccountCache(tx.transaction.Destination);
                }
            }

            // Emetti eventi specifici per tipo transazione
            const txType = tx.transaction?.TransactionType;
            if (txType) {
                this.emit(`transaction:${txType.toLowerCase()}`, tx);
            }
            
            // Emetti evento generico
            this.emit('transaction', tx);

        } catch (error) {
            console.error('❌ Errore gestione transazione:', error);
        }
    }

    /**
     * Disconnessione
     */
    async disconnect() {
        try {
            if (this.client && this.isConnected) {
                // Rimuovi tutte le sottoscrizioni
                for (const account of this.subscriptions) {
                    await this.unsubscribeFromAccount(account);
                }
                
                await this.client.disconnect();
                console.log('✅ Disconnesso da XRPL');
            }
            
            this.client = null;
            this.isConnected = false;
            this.currentNetwork = null;
            this.subscriptions.clear();
            
            // Emetti evento disconnessione
            this.emit('disconnected', { manual: true });

        } catch (error) {
            console.error('❌ Errore disconnessione:', error);
            throw error;
        }
    }

    /**
     * Verifica se è connesso
     */
    isConnected() {
        return this.isConnected && this.client && this.client.isConnected();
    }

    /**
     * Ottieni informazioni account con cache
     */
    async getAccountInfo(address) {
        try {
            if (!isValidClassicAddress(address)) {
                throw new Error('Indirizzo non valido');
            }

            // Verifica cache
            const cacheKey = `accountInfo:${address}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }

            if (!this.isConnected) {
                throw new Error('Client XRPL non connesso');
            }

            const response = await this.client.request({
                command: 'account_info',
                account: address,
                ledger_index: 'validated'
            });

            const accountInfo = response.result.account_data;
            
            // Salva in cache
            this.setCache(cacheKey, accountInfo, this.cacheConfig.accountInfo);
            
            return accountInfo;

        } catch (error) {
            if (error.data?.error === 'actNotFound') {
                throw new Error('Account non trovato. Potrebbe non essere ancora attivato.');
            }
            console.error('❌ Errore recupero account info:', error);
            throw error;
        }
    }

    /**
     * Ottieni saldo account con cache
     */
    async getAccountBalance(address) {
        try {
            // Verifica cache
            const cacheKey = `balance:${address}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }

            const accountInfo = await this.getAccountInfo(address);
            
            const balance = {
                balanceDrops: accountInfo.Balance,
                balanceXRP: dropsToXrp(accountInfo.Balance),
                ownerCount: accountInfo.OwnerCount || 0,
                sequence: accountInfo.Sequence,
                previousTxnID: accountInfo.PreviousTxnID
            };
            
            // Salva in cache
            this.setCache(cacheKey, balance, this.cacheConfig.balance);
            
            return balance;

        } catch (error) {
            console.error('❌ Errore recupero saldo:', error);
            throw error;
        }
    }

    /**
     * Calcola reserve requirement
     */
    async getReserveRequirement(ownerCount = 0) {
        try {
            if (!this.isConnected) {
                throw new Error('Client XRPL non connesso');
            }

            const response = await this.client.request({
                command: 'server_info'
            });

            const serverInfo = response.result.info;
            const baseReserve = dropsToXrp(serverInfo.validated_ledger.reserve_base);
            const ownerReserve = dropsToXrp(serverInfo.validated_ledger.reserve_inc);
            
            const totalReserve = baseReserve + (ownerCount * ownerReserve);

            return {
                baseReserve,
                ownerReserve,
                ownerCount,
                totalReserve
            };

        } catch (error) {
            console.error('❌ Errore calcolo reserve:', error);
            // Ritorna valori di default se non riesce a recuperare
            return {
                baseReserve: 10,
                ownerReserve: 2,
                ownerCount,
                totalReserve: 10 + (ownerCount * 2)
            };
        }
    }

    /**
     * Invia transazione
     */
    async submitTransaction(transaction, wallet) {
        try {
            if (!this.isConnected) {
                throw new Error('Client XRPL non connesso');
            }

            console.log('🔄 Invio transazione...', transaction);

            // Prepara transazione
            const prepared = await this.client.autofill(transaction);
            
            let response;
            
            if (wallet.type === 'xumm') {
                response = await this.submitWithXUMM(prepared);
            } else if (wallet.type === 'crossmark') {
                response = await this.submitWithCrossmark(prepared);
            } else {
                throw new Error(`Tipo wallet non supportato: ${wallet.type}`);
            }

            console.log('✅ Transazione inviata:', response);
            
            // Invalida cache per account coinvolti
            this.invalidateAccountCache(transaction.Account);
            if (transaction.Destination) {
                this.invalidateAccountCache(transaction.Destination);
            }

            return response;

        } catch (error) {
            console.error('❌ Errore invio transazione:', error);
            throw error;
        }
    }

    /**
     * Invia transazione con XUMM
     */
    async submitWithXUMM(transaction) {
        try {
            if (!window.xumm) {
                throw new Error('XUMM non disponibile');
            }

            const payload = await window.xumm.payload.createAndSubscribe({
                txjson: transaction
            });

            if (payload.signed) {
                return {
                    result: {
                        engine_result: 'tesSUCCESS',
                        tx_json: {
                            hash: payload.txid,
                            ...transaction
                        }
                    }
                };
            } else {
                throw new Error('Transazione rifiutata dall\'utente');
            }

        } catch (error) {
            console.error('❌ Errore XUMM:', error);
            throw error;
        }
    }

    /**
     * Invia transazione con Crossmark
     */
    async submitWithCrossmark(transaction) {
        try {
            if (!window.crossmark) {
                throw new Error('Crossmark non disponibile');
            }

            const response = await window.crossmark.sign(transaction);

            if (response && response.response && response.response.dispatched_result) {
                return {
                    result: {
                        engine_result: response.response.dispatched_result,
                        tx_json: {
                            hash: response.response.tx_hash,
                            ...transaction
                        }
                    }
                };
            } else {
                throw new Error('Transazione rifiutata dall\'utente');
            }

        } catch (error) {
            console.error('❌ Errore Crossmark:', error);
            throw error;
        }
    }

    /**
     * Ottieni stato transazione
     */
    async getTransactionStatus(hash) {
        try {
            if (!this.isConnected) {
                throw new Error('Client XRPL non connesso');
            }

            const response = await this.client.request({
                command: 'tx',
                transaction: hash
            });

            return {
                hash: hash,
                validated: response.result.validated,
                result: response.result.meta.TransactionResult,
                ledgerIndex: response.result.ledger_index,
                transaction: response.result
            };

        } catch (error) {
            if (error.data?.error === 'txnNotFound') {
                return {
                    hash: hash,
                    validated: false,
                    result: 'PENDING',
                    ledgerIndex: null,
                    transaction: null
                };
            }
            console.error('❌ Errore stato transazione:', error);
            throw error;
        }
    }

    /**
     * Ottieni storico transazioni account
     */
    async getAccountTransactions(address, options = {}) {
        try {
            if (!isValidClassicAddress(address)) {
                throw new Error('Indirizzo non valido');
            }

            if (!this.isConnected) {
                throw new Error('Client XRPL non connesso');
            }

            const request = {
                command: 'account_tx',
                account: address,
                ledger_index_min: -1,
                ledger_index_max: -1,
                limit: options.limit || 50,
                forward: options.forward || false
            };

            if (options.marker) {
                request.marker = options.marker;
            }

            const response = await this.client.request(request);

            return {
                transactions: response.result.transactions,
                marker: response.result.marker,
                limit: response.result.limit,
                account: address
            };

        } catch (error) {
            console.error('❌ Errore storico transazioni:', error);
            throw error;
        }
    }

    /**
     * Sottoscrivi a transazioni account
     */
    async subscribeToAccount(address) {
        try {
            if (!isValidClassicAddress(address)) {
                throw new Error('Indirizzo non valido');
            }

            if (!this.isConnected) {
                throw new Error('Client XRPL non connesso');
            }

            await this.client.request({
                command: 'subscribe',
                accounts: [address]
            });

            this.subscriptions.add(address);
            console.log('✅ Sottoscrizione account:', address);

        } catch (error) {
            console.error('❌ Errore sottoscrizione account:', error);
            throw error;
        }
    }

    /**
     * Rimuovi sottoscrizione account
     */
    async unsubscribeFromAccount(address) {
        try {
            if (!this.isConnected) {
                return;
            }

            await this.client.request({
                command: 'unsubscribe',
                accounts: [address]
            });

            this.subscriptions.delete(address);
            console.log('✅ Sottoscrizione rimossa:', address);

        } catch (error) {
            console.error('❌ Errore rimozione sottoscrizione:', error);
        }
    }

    /**
     * Gestione cache
     */
    setCache(key, value, ttl) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
        
        // Cleanup se cache troppo grande
        if (this.cache.size > this.cacheConfig.maxEntries) {
            this.cleanupCache();
        }
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }

    invalidateAccountCache(address) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(address)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (now > cached.expiry) {
                this.cache.delete(key);
            }
        }
    }

    startCacheCleanup() {
        setInterval(() => {
            this.cleanupCache();
        }, 60000); // Cleanup ogni minuto
    }

    /**
     * Ottieni informazioni network corrente
     */
    getCurrentNetwork() {
        return this.currentNetwork ? {
            name: this.currentNetwork,
            ...this.networks[this.currentNetwork]
        } : null;
    }

    /**
     * Sottoscrivi eventi
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Rimuovi sottoscrizione eventi
     */
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emetti evento
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Errore callback evento ${event}:`, error);
                }
            });
        }
    }

    /**
     * Cleanup risorse
     */
    async cleanup() {
        try {
            await this.disconnect();
            this.cache.clear();
            this.eventListeners.clear();
            console.log('✅ Cleanup XRPL service completato');
        } catch (error) {
            console.error('❌ Errore cleanup:', error);
        }
    }
}

// Esporta istanza singleton
const xrplService = new XRPLService();
export default xrplService;

