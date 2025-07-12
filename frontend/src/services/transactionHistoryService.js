/**
 * Transaction History Service per Solcraft Nexus
 * Gestisce monitoraggio e storico transazioni XRPL
 * Implementazione real-time basata sui code samples XRPL ufficiali
 */

import { dropsToXrp, convertHexToString } from 'xrpl';
import xrplService from './xrplService.js';
import walletService from './walletService.js';

class TransactionHistoryService {
    constructor() {
        this.transactionCache = new Map();
        this.accountSubscriptions = new Set();
        this.eventListeners = new Map();
        this.isMonitoring = false;
        
        // Configurazione cache
        this.cacheConfig = {
            maxEntries: 10000,
            maxAge: 24 * 60 * 60 * 1000, // 24 ore
            cleanupInterval: 60 * 60 * 1000 // 1 ora
        };
        
        // Avvia cleanup periodico
        this.startCacheCleanup();
    }

    /**
     * Inizia monitoraggio transazioni per un account
     */
    async startMonitoring(address) {
        try {
            if (!address) {
                const wallet = walletService.getCurrentWallet();
                if (!wallet) {
                    throw new Error('Nessun wallet connesso');
                }
                address = wallet.address;
            }

            // Sottoscrivi a transazioni account
            await xrplService.subscribeToAccount(address);
            this.accountSubscriptions.add(address);

            // Setup listener per nuove transazioni
            if (!this.isMonitoring) {
                this.setupTransactionListener();
                this.isMonitoring = true;
            }

            console.log(`✅ Monitoraggio avviato per account: ${address}`);
            
            // Carica storico iniziale
            await this.loadInitialHistory(address);
            
            return true;

        } catch (error) {
            console.error('❌ Errore avvio monitoraggio:', error);
            throw error;
        }
    }

    /**
     * Ferma monitoraggio per un account
     */
    async stopMonitoring(address) {
        try {
            if (!address) {
                const wallet = walletService.getCurrentWallet();
                if (wallet) {
                    address = wallet.address;
                }
            }

            if (address) {
                await xrplService.unsubscribeFromAccount(address);
                this.accountSubscriptions.delete(address);
                console.log(`✅ Monitoraggio fermato per account: ${address}`);
            }

            // Se non ci sono più sottoscrizioni, ferma il listener
            if (this.accountSubscriptions.size === 0) {
                this.isMonitoring = false;
            }

            return true;

        } catch (error) {
            console.error('❌ Errore stop monitoraggio:', error);
            throw error;
        }
    }

    /**
     * Setup listener per transazioni real-time
     */
    setupTransactionListener() {
        // Listener per tutte le transazioni
        xrplService.on('transaction', (tx) => {
            this.handleNewTransaction(tx);
        });

        // Listener specifici per tipo transazione
        xrplService.on('transaction:payment', (tx) => {
            this.handlePaymentTransaction(tx);
        });

        xrplService.on('transaction:trustset', (tx) => {
            this.handleTrustSetTransaction(tx);
        });

        xrplService.on('transaction:accountset', (tx) => {
            this.handleAccountSetTransaction(tx);
        });
    }

    /**
     * Gestisce nuove transazioni
     */
    handleNewTransaction(tx) {
        try {
            const transaction = tx.transaction;
            const meta = tx.meta;
            
            // Verifica se la transazione riguarda i nostri account monitorati
            const isRelevant = this.isTransactionRelevant(transaction);
            
            if (isRelevant) {
                const processedTx = this.processTransaction(tx);
                
                // Salva in cache
                this.cacheTransaction(processedTx);
                
                // Emetti evento
                this.emit('newTransaction', processedTx);
                
                console.log('📥 Nuova transazione rilevante:', processedTx.hash);
            }

        } catch (error) {
            console.error('❌ Errore gestione transazione:', error);
        }
    }

    /**
     * Gestisce transazioni di pagamento
     */
    handlePaymentTransaction(tx) {
        try {
            const transaction = tx.transaction;
            const meta = tx.meta;
            
            if (this.isTransactionRelevant(transaction)) {
                const paymentData = this.extractPaymentData(tx);
                
                // Emetti evento specifico per pagamenti
                this.emit('newPayment', paymentData);
                
                console.log('💰 Nuovo pagamento:', paymentData);
            }

        } catch (error) {
            console.error('❌ Errore gestione pagamento:', error);
        }
    }

    /**
     * Gestisce transazioni TrustSet
     */
    handleTrustSetTransaction(tx) {
        try {
            const transaction = tx.transaction;
            
            if (this.isTransactionRelevant(transaction)) {
                const trustData = this.extractTrustSetData(tx);
                
                // Emetti evento specifico per trust lines
                this.emit('newTrustSet', trustData);
                
                console.log('🤝 Nuova trust line:', trustData);
            }

        } catch (error) {
            console.error('❌ Errore gestione TrustSet:', error);
        }
    }

    /**
     * Gestisce transazioni AccountSet
     */
    handleAccountSetTransaction(tx) {
        try {
            const transaction = tx.transaction;
            
            if (this.isTransactionRelevant(transaction)) {
                const accountData = this.extractAccountSetData(tx);
                
                // Emetti evento specifico per configurazioni account
                this.emit('newAccountSet', accountData);
                
                console.log('⚙️ Configurazione account:', accountData);
            }

        } catch (error) {
            console.error('❌ Errore gestione AccountSet:', error);
        }
    }

    /**
     * Verifica se una transazione è rilevante per i nostri account
     */
    isTransactionRelevant(transaction) {
        const account = transaction.Account;
        const destination = transaction.Destination;
        
        return this.accountSubscriptions.has(account) || 
               (destination && this.accountSubscriptions.has(destination));
    }

    /**
     * Processa una transazione grezza
     */
    processTransaction(tx) {
        try {
            const transaction = tx.transaction;
            const meta = tx.meta;
            
            const processedTx = {
                hash: transaction.hash,
                type: transaction.TransactionType,
                account: transaction.Account,
                destination: transaction.Destination,
                amount: transaction.Amount,
                fee: transaction.Fee,
                sequence: transaction.Sequence,
                destinationTag: transaction.DestinationTag,
                sourceTag: transaction.SourceTag,
                memos: this.extractMemos(transaction.Memos),
                result: meta.TransactionResult,
                ledgerIndex: meta.TransactionIndex,
                timestamp: this.getTransactionTimestamp(tx),
                validated: true,
                raw: tx
            };

            // Processa amount specifico per tipo
            if (processedTx.type === 'Payment') {
                processedTx.paymentData = this.extractPaymentData(tx);
            }

            return processedTx;

        } catch (error) {
            console.error('❌ Errore processamento transazione:', error);
            throw error;
        }
    }

    /**
     * Estrae dati specifici per pagamenti
     */
    extractPaymentData(tx) {
        try {
            const transaction = tx.transaction;
            const meta = tx.meta;
            
            const paymentData = {
                from: transaction.Account,
                to: transaction.Destination,
                amount: transaction.Amount,
                destinationTag: transaction.DestinationTag,
                sourceTag: transaction.SourceTag,
                fee: transaction.Fee,
                result: meta.TransactionResult
            };

            // Gestisci diversi tipi di amount
            if (typeof transaction.Amount === 'string') {
                // XRP payment
                paymentData.currency = 'XRP';
                paymentData.amountXRP = dropsToXrp(transaction.Amount);
                paymentData.amountDrops = transaction.Amount;
            } else if (typeof transaction.Amount === 'object') {
                // Token payment
                paymentData.currency = transaction.Amount.currency;
                paymentData.issuer = transaction.Amount.issuer;
                paymentData.value = parseFloat(transaction.Amount.value);
            }

            return paymentData;

        } catch (error) {
            console.error('❌ Errore estrazione dati pagamento:', error);
            throw error;
        }
    }

    /**
     * Estrae dati TrustSet
     */
    extractTrustSetData(tx) {
        try {
            const transaction = tx.transaction;
            const limitAmount = transaction.LimitAmount;
            
            return {
                account: transaction.Account,
                currency: limitAmount.currency,
                issuer: limitAmount.issuer,
                limit: parseFloat(limitAmount.value),
                qualityIn: transaction.QualityIn,
                qualityOut: transaction.QualityOut
            };

        } catch (error) {
            console.error('❌ Errore estrazione TrustSet:', error);
            throw error;
        }
    }

    /**
     * Estrae dati AccountSet
     */
    extractAccountSetData(tx) {
        try {
            const transaction = tx.transaction;
            
            return {
                account: transaction.Account,
                setFlag: transaction.SetFlag,
                clearFlag: transaction.ClearFlag,
                transferRate: transaction.TransferRate,
                tickSize: transaction.TickSize,
                domain: transaction.Domain,
                emailHash: transaction.EmailHash
            };

        } catch (error) {
            console.error('❌ Errore estrazione AccountSet:', error);
            throw error;
        }
    }

    /**
     * Estrae memo da transazione
     */
    extractMemos(memos) {
        if (!memos || !Array.isArray(memos)) {
            return [];
        }

        return memos.map(memoWrapper => {
            const memo = memoWrapper.Memo;
            const extracted = {};
            
            if (memo.MemoData) {
                try {
                    extracted.data = convertHexToString(memo.MemoData);
                } catch (error) {
                    extracted.data = memo.MemoData;
                }
            }
            
            if (memo.MemoType) {
                try {
                    extracted.type = convertHexToString(memo.MemoType);
                } catch (error) {
                    extracted.type = memo.MemoType;
                }
            }
            
            if (memo.MemoFormat) {
                try {
                    extracted.format = convertHexToString(memo.MemoFormat);
                } catch (error) {
                    extracted.format = memo.MemoFormat;
                }
            }
            
            return extracted;
        });
    }

    /**
     * Ottiene timestamp transazione
     */
    getTransactionTimestamp(tx) {
        try {
            // XRPL usa epoch time dal 1 gennaio 2000
            const rippleEpoch = 946684800; // Secondi tra 1970 e 2000
            const txDate = tx.transaction.date;
            
            if (txDate) {
                return new Date((txDate + rippleEpoch) * 1000).toISOString();
            }
            
            return new Date().toISOString();

        } catch (error) {
            return new Date().toISOString();
        }
    }

    /**
     * Carica storico iniziale per un account
     */
    async loadInitialHistory(address, limit = 50) {
        try {
            console.log(`🔄 Caricamento storico per ${address}...`);
            
            const history = await xrplService.getAccountTransactions(address, { limit });
            
            for (const txWrapper of history.transactions) {
                const processedTx = this.processTransaction(txWrapper);
                this.cacheTransaction(processedTx);
            }
            
            console.log(`✅ Caricato storico: ${history.transactions.length} transazioni`);
            
            // Emetti evento
            this.emit('historyLoaded', {
                address,
                count: history.transactions.length,
                transactions: history.transactions.map(tx => this.processTransaction(tx))
            });
            
            return history.transactions;

        } catch (error) {
            console.error('❌ Errore caricamento storico:', error);
            throw error;
        }
    }

    /**
     * Recupera transazioni da cache con filtri
     */
    getTransactions(filters = {}) {
        try {
            let transactions = Array.from(this.transactionCache.values());
            
            // Applica filtri
            if (filters.account) {
                transactions = transactions.filter(tx => 
                    tx.account === filters.account || tx.destination === filters.account
                );
            }
            
            if (filters.type) {
                transactions = transactions.filter(tx => tx.type === filters.type);
            }
            
            if (filters.currency) {
                transactions = transactions.filter(tx => {
                    if (filters.currency === 'XRP') {
                        return typeof tx.amount === 'string';
                    } else {
                        return tx.amount && tx.amount.currency === filters.currency;
                    }
                });
            }
            
            if (filters.from) {
                const fromDate = new Date(filters.from);
                transactions = transactions.filter(tx => new Date(tx.timestamp) >= fromDate);
            }
            
            if (filters.to) {
                const toDate = new Date(filters.to);
                transactions = transactions.filter(tx => new Date(tx.timestamp) <= toDate);
            }
            
            // Ordina per timestamp (più recenti prima)
            transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Paginazione
            if (filters.limit) {
                const offset = filters.offset || 0;
                transactions = transactions.slice(offset, offset + filters.limit);
            }
            
            return transactions;

        } catch (error) {
            console.error('❌ Errore recupero transazioni:', error);
            throw error;
        }
    }

    /**
     * Salva transazione in cache
     */
    cacheTransaction(transaction) {
        try {
            // Aggiungi timestamp cache
            transaction.cachedAt = Date.now();
            
            // Salva in cache
            this.transactionCache.set(transaction.hash, transaction);
            
            // Verifica limite cache
            if (this.transactionCache.size > this.cacheConfig.maxEntries) {
                this.cleanupOldTransactions();
            }

        } catch (error) {
            console.error('❌ Errore cache transazione:', error);
        }
    }

    /**
     * Cleanup transazioni vecchie
     */
    cleanupOldTransactions() {
        try {
            const now = Date.now();
            const maxAge = this.cacheConfig.maxAge;
            
            for (const [hash, tx] of this.transactionCache.entries()) {
                if (now - tx.cachedAt > maxAge) {
                    this.transactionCache.delete(hash);
                }
            }
            
            console.log(`🧹 Cache cleanup: ${this.transactionCache.size} transazioni rimanenti`);

        } catch (error) {
            console.error('❌ Errore cleanup cache:', error);
        }
    }

    /**
     * Avvia cleanup periodico cache
     */
    startCacheCleanup() {
        setInterval(() => {
            this.cleanupOldTransactions();
        }, this.cacheConfig.cleanupInterval);
    }

    /**
     * Esporta storico transazioni
     */
    exportTransactions(format = 'json', filters = {}) {
        try {
            const transactions = this.getTransactions(filters);
            
            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(transactions, null, 2);
                    
                case 'csv':
                    return this.convertToCSV(transactions);
                    
                default:
                    throw new Error(`Formato non supportato: ${format}`);
            }

        } catch (error) {
            console.error('❌ Errore export transazioni:', error);
            throw error;
        }
    }

    /**
     * Converte transazioni in CSV
     */
    convertToCSV(transactions) {
        try {
            if (transactions.length === 0) {
                return '';
            }
            
            const headers = [
                'Hash', 'Type', 'Account', 'Destination', 'Amount', 'Currency', 
                'Fee', 'Result', 'Timestamp'
            ];
            
            const rows = transactions.map(tx => [
                tx.hash,
                tx.type,
                tx.account,
                tx.destination || '',
                tx.paymentData ? (tx.paymentData.amountXRP || tx.paymentData.value || '') : '',
                tx.paymentData ? tx.paymentData.currency || '' : '',
                tx.fee ? dropsToXrp(tx.fee) : '',
                tx.result,
                tx.timestamp
            ]);
            
            const csvContent = [headers, ...rows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');
                
            return csvContent;

        } catch (error) {
            console.error('❌ Errore conversione CSV:', error);
            throw error;
        }
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
            // Ferma monitoraggio per tutti gli account
            for (const address of this.accountSubscriptions) {
                await this.stopMonitoring(address);
            }
            
            // Pulisci cache
            this.transactionCache.clear();
            this.eventListeners.clear();
            
            console.log('✅ Cleanup transaction history service completato');

        } catch (error) {
            console.error('❌ Errore cleanup:', error);
        }
    }
}

// Esporta istanza singleton
const transactionHistoryService = new TransactionHistoryService();
export default transactionHistoryService;

