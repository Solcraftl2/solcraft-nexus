/**
 * Payment Service Reale per Solcraft Nexus
 * Gestisce pagamenti XRP e token personalizzati
 * Implementazione basata sui code samples XRPL ufficiali
 */

import { xrpToDrops, dropsToXrp, isValidClassicAddress, convertStringToHex } from 'xrpl';
import xrplService from './xrplService.js';
import walletService from './walletService.js';

class PaymentService {
    constructor() {
        this.pendingPayments = new Map();
        this.paymentHistory = new Map();
        this.eventListeners = new Map();
        
        // Configurazione validazione
        this.validationConfig = {
            minXRPAmount: 0.000001, // 1 drop
            maxXRPAmount: 100000000, // 100M XRP
            minTokenAmount: 0.000001,
            maxTokenAmount: 999999999999
        };
    }

    /**
     * Invia pagamento XRP
     */
    async sendXRPPayment(paymentData) {
        try {
            const {
                destination,
                amount,
                destinationTag,
                memo,
                sourceTag
            } = paymentData;

            // Validazione input
            this.validateXRPPayment(paymentData);

            const wallet = walletService.getCurrentWallet();
            if (!wallet) {
                throw new Error('Wallet non connesso');
            }

            // Verifica saldo disponibile
            await this.checkAvailableBalance(wallet.address, amount);

            // Converti amount in drops
            const amountInDrops = xrpToDrops(amount);

            // Crea transazione Payment
            const paymentTx = {
                TransactionType: 'Payment',
                Account: wallet.address,
                Destination: destination,
                Amount: amountInDrops
            };

            // Aggiungi campi opzionali
            if (destinationTag) {
                paymentTx.DestinationTag = parseInt(destinationTag);
            }

            if (sourceTag) {
                paymentTx.SourceTag = parseInt(sourceTag);
            }

            if (memo) {
                paymentTx.Memos = [{
                    Memo: {
                        MemoData: convertStringToHex(memo),
                        MemoType: convertStringToHex('text/plain')
                    }
                }];
            }

            console.log('🔄 Invio pagamento XRP...', paymentTx);

            // Genera ID pagamento
            const paymentId = this.generatePaymentId();
            
            // Salva come pending
            this.pendingPayments.set(paymentId, {
                id: paymentId,
                type: 'XRP',
                transaction: paymentTx,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            // Invia transazione
            const response = await this.submitTransaction(paymentTx, wallet);
            
            if (response.result.engine_result !== 'tesSUCCESS') {
                throw new Error(`Errore pagamento: ${response.result.engine_result}`);
            }

            const paymentResult = {
                id: paymentId,
                hash: response.result.tx_json.hash,
                type: 'XRP',
                from: wallet.address,
                to: destination,
                amount: amount,
                amountDrops: amountInDrops,
                destinationTag,
                sourceTag,
                memo,
                fee: response.result.tx_json.Fee,
                status: 'submitted',
                timestamp: new Date().toISOString()
            };

            // Aggiorna pending
            this.pendingPayments.set(paymentId, {
                ...this.pendingPayments.get(paymentId),
                ...paymentResult,
                status: 'submitted'
            });

            // Salva in history
            this.paymentHistory.set(paymentId, paymentResult);

            // Emetti evento
            this.emit('paymentSubmitted', paymentResult);

            console.log('✅ Pagamento XRP inviato:', paymentResult.hash);
            return paymentResult;

        } catch (error) {
            console.error('❌ Errore pagamento XRP:', error);
            throw error;
        }
    }

    /**
     * Invia pagamento token
     */
    async sendTokenPayment(paymentData) {
        try {
            const {
                destination,
                currencyCode,
                amount,
                issuer,
                destinationTag,
                memo,
                sourceTag
            } = paymentData;

            // Validazione input
            this.validateTokenPayment(paymentData);

            const wallet = walletService.getCurrentWallet();
            if (!wallet) {
                throw new Error('Wallet non connesso');
            }

            // Verifica saldo token disponibile
            await this.checkTokenBalance(wallet.address, currencyCode, issuer, amount);

            // Crea transazione Payment per token
            const paymentTx = {
                TransactionType: 'Payment',
                Account: wallet.address,
                Destination: destination,
                Amount: {
                    currency: this.formatCurrencyCode(currencyCode),
                    issuer: issuer,
                    value: amount.toString()
                }
            };

            // Aggiungi campi opzionali
            if (destinationTag) {
                paymentTx.DestinationTag = parseInt(destinationTag);
            }

            if (sourceTag) {
                paymentTx.SourceTag = parseInt(sourceTag);
            }

            if (memo) {
                paymentTx.Memos = [{
                    Memo: {
                        MemoData: convertStringToHex(memo),
                        MemoType: convertStringToHex('text/plain')
                    }
                }];
            }

            console.log('🔄 Invio pagamento token...', paymentTx);

            // Genera ID pagamento
            const paymentId = this.generatePaymentId();
            
            // Salva come pending
            this.pendingPayments.set(paymentId, {
                id: paymentId,
                type: 'TOKEN',
                transaction: paymentTx,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            // Invia transazione
            const response = await this.submitTransaction(paymentTx, wallet);
            
            if (response.result.engine_result !== 'tesSUCCESS') {
                throw new Error(`Errore pagamento token: ${response.result.engine_result}`);
            }

            const paymentResult = {
                id: paymentId,
                hash: response.result.tx_json.hash,
                type: 'TOKEN',
                from: wallet.address,
                to: destination,
                currencyCode,
                amount: amount,
                issuer,
                destinationTag,
                sourceTag,
                memo,
                fee: response.result.tx_json.Fee,
                status: 'submitted',
                timestamp: new Date().toISOString()
            };

            // Aggiorna pending
            this.pendingPayments.set(paymentId, {
                ...this.pendingPayments.get(paymentId),
                ...paymentResult,
                status: 'submitted'
            });

            // Salva in history
            this.paymentHistory.set(paymentId, paymentResult);

            // Emetti evento
            this.emit('paymentSubmitted', paymentResult);

            console.log('✅ Pagamento token inviato:', paymentResult.hash);
            return paymentResult;

        } catch (error) {
            console.error('❌ Errore pagamento token:', error);
            throw error;
        }
    }

    /**
     * Verifica saldo XRP disponibile
     */
    async checkAvailableBalance(address, amount) {
        try {
            const balance = await xrplService.getAccountBalance(address);
            const reserve = await xrplService.getReserveRequirement(balance.ownerCount);
            
            const availableXRP = balance.balanceXRP - reserve.totalReserve;
            const requiredAmount = parseFloat(amount);

            if (availableXRP < requiredAmount) {
                throw new Error(`Saldo insufficiente. Disponibile: ${availableXRP.toFixed(6)} XRP, Richiesto: ${requiredAmount} XRP`);
            }

            return {
                available: availableXRP,
                required: requiredAmount,
                sufficient: true
            };

        } catch (error) {
            console.error('❌ Errore verifica saldo:', error);
            throw error;
        }
    }

    /**
     * Verifica saldo token disponibile
     */
    async checkTokenBalance(address, currencyCode, issuer, amount) {
        try {
            const response = await xrplService.client.request({
                command: 'account_lines',
                account: address,
                ledger_index: 'validated'
            });

            const lines = response.result.lines;
            const tokenLine = lines.find(line => 
                line.currency === this.formatCurrencyCode(currencyCode) && 
                line.account === issuer
            );

            if (!tokenLine) {
                throw new Error(`Trust line non trovata per ${currencyCode}`);
            }

            const availableBalance = parseFloat(tokenLine.balance);
            const requiredAmount = parseFloat(amount);

            if (availableBalance < requiredAmount) {
                throw new Error(`Saldo token insufficiente. Disponibile: ${availableBalance} ${currencyCode}, Richiesto: ${requiredAmount} ${currencyCode}`);
            }

            return {
                available: availableBalance,
                required: requiredAmount,
                sufficient: true
            };

        } catch (error) {
            console.error('❌ Errore verifica saldo token:', error);
            throw error;
        }
    }

    /**
     * Stima fee per transazione
     */
    async estimateTransactionFee(transactionType = 'Payment') {
        try {
            const response = await xrplService.client.request({
                command: 'server_info'
            });

            const baseFee = response.result.info.validated_ledger.base_fee_xrp;
            const reserveBase = response.result.info.validated_ledger.reserve_base_xrp;

            // Fee stimata basata sul tipo di transazione
            let estimatedFee = baseFee;
            
            switch (transactionType) {
                case 'Payment':
                    estimatedFee = baseFee * 1.2; // 20% buffer
                    break;
                case 'TrustSet':
                    estimatedFee = baseFee * 1.5;
                    break;
                case 'AccountSet':
                    estimatedFee = baseFee * 1.3;
                    break;
                default:
                    estimatedFee = baseFee * 1.2;
            }

            return {
                baseFee,
                estimatedFee,
                reserveBase,
                currency: 'XRP'
            };

        } catch (error) {
            console.error('❌ Errore stima fee:', error);
            throw error;
        }
    }

    /**
     * Verifica stato pagamento
     */
    async checkPaymentStatus(paymentId) {
        try {
            const payment = this.pendingPayments.get(paymentId) || this.paymentHistory.get(paymentId);
            
            if (!payment) {
                throw new Error(`Pagamento ${paymentId} non trovato`);
            }

            if (payment.hash) {
                // Verifica stato su XRPL
                const txStatus = await xrplService.getTransactionStatus(payment.hash);
                
                const updatedPayment = {
                    ...payment,
                    status: txStatus.validated ? 'confirmed' : 'pending',
                    result: txStatus.result,
                    ledgerIndex: txStatus.ledgerIndex,
                    lastChecked: new Date().toISOString()
                };

                // Aggiorna cache
                if (this.pendingPayments.has(paymentId)) {
                    this.pendingPayments.set(paymentId, updatedPayment);
                }
                this.paymentHistory.set(paymentId, updatedPayment);

                return updatedPayment;
            }

            return payment;

        } catch (error) {
            console.error('❌ Errore verifica stato pagamento:', error);
            throw error;
        }
    }

    /**
     * Recupera storico pagamenti
     */
    getPaymentHistory(filters = {}) {
        try {
            let payments = Array.from(this.paymentHistory.values());

            // Applica filtri
            if (filters.type) {
                payments = payments.filter(p => p.type === filters.type);
            }

            if (filters.status) {
                payments = payments.filter(p => p.status === filters.status);
            }

            if (filters.from) {
                const fromDate = new Date(filters.from);
                payments = payments.filter(p => new Date(p.timestamp) >= fromDate);
            }

            if (filters.to) {
                const toDate = new Date(filters.to);
                payments = payments.filter(p => new Date(p.timestamp) <= toDate);
            }

            // Ordina per timestamp (più recenti prima)
            payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Paginazione
            if (filters.limit) {
                const offset = filters.offset || 0;
                payments = payments.slice(offset, offset + filters.limit);
            }

            return payments;

        } catch (error) {
            console.error('❌ Errore recupero storico:', error);
            throw error;
        }
    }

    /**
     * Validazione pagamento XRP
     */
    validateXRPPayment(paymentData) {
        const { destination, amount } = paymentData;

        if (!destination || !isValidClassicAddress(destination)) {
            throw new Error('Indirizzo destinazione non valido');
        }

        if (!amount || isNaN(amount)) {
            throw new Error('Importo non valido');
        }

        const numAmount = parseFloat(amount);
        if (numAmount < this.validationConfig.minXRPAmount) {
            throw new Error(`Importo minimo: ${this.validationConfig.minXRPAmount} XRP`);
        }

        if (numAmount > this.validationConfig.maxXRPAmount) {
            throw new Error(`Importo massimo: ${this.validationConfig.maxXRPAmount} XRP`);
        }
    }

    /**
     * Validazione pagamento token
     */
    validateTokenPayment(paymentData) {
        const { destination, currencyCode, amount, issuer } = paymentData;

        if (!destination || !isValidClassicAddress(destination)) {
            throw new Error('Indirizzo destinazione non valido');
        }

        if (!currencyCode || currencyCode.length < 3) {
            throw new Error('Currency code non valido');
        }

        if (!issuer || !isValidClassicAddress(issuer)) {
            throw new Error('Indirizzo issuer non valido');
        }

        if (!amount || isNaN(amount)) {
            throw new Error('Importo non valido');
        }

        const numAmount = parseFloat(amount);
        if (numAmount < this.validationConfig.minTokenAmount) {
            throw new Error(`Importo minimo: ${this.validationConfig.minTokenAmount}`);
        }

        if (numAmount > this.validationConfig.maxTokenAmount) {
            throw new Error(`Importo massimo: ${this.validationConfig.maxTokenAmount}`);
        }
    }

    /**
     * Formatta currency code
     */
    formatCurrencyCode(code) {
        if (code.length === 3) {
            return code.toUpperCase();
        } else {
            return convertStringToHex(code).padEnd(40, '0');
        }
    }

    /**
     * Genera ID pagamento unico
     */
    generatePaymentId() {
        return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Invia transazione
     */
    async submitTransaction(transaction, wallet) {
        try {
            if (wallet.type === 'xumm') {
                return await this.submitWithXUMM(transaction);
            } else if (wallet.type === 'crossmark') {
                return await this.submitWithCrossmark(transaction);
            } else {
                return await xrplService.submitTransaction(transaction, wallet);
            }
        } catch (error) {
            console.error('❌ Errore invio transazione:', error);
            throw error;
        }
    }

    /**
     * Invia con XUMM
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
                            Fee: payload.tx.Fee
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
     * Invia con Crossmark
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
                            Fee: transaction.Fee
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
    cleanup() {
        this.pendingPayments.clear();
        this.paymentHistory.clear();
        this.eventListeners.clear();
        console.log('✅ Cleanup payment service completato');
    }
}

// Esporta istanza singleton
const paymentService = new PaymentService();
export default paymentService;

