/**
 * Tokenization Service Ottimizzato per Solcraft Nexus
 * Gestisce creazione token seguendo best practices XRPL
 * Implementazione basata sui code samples XRPL ufficiali
 */

import { convertStringToHex, convertHexToString, isValidClassicAddress } from 'xrpl';
import xrplService from './xrplService.js';
import walletService from './walletService.js';

class TokenizationService {
    constructor() {
        this.tokens = new Map();
        this.trustLines = new Map();
        this.eventListeners = new Map();
        
        // Configurazione token
        this.tokenConfig = {
            maxCurrencyCodeLength: 20,
            minCurrencyCodeLength: 3,
            maxMetadataSize: 1024,
            defaultTransferFee: 0,
            maxTransferFee: 1000000000 // 1 billion (1%)
        };
    }

    /**
     * Crea un nuovo token seguendo best practices XRPL
     */
    async createToken(tokenData) {
        try {
            const {
                currencyCode,
                totalSupply,
                metadata = {},
                transferFee = this.tokenConfig.defaultTransferFee,
                requireAuth = false,
                disallowXRP = true,
                defaultRipple = false
            } = tokenData;

            // Validazione input
            this.validateTokenData(tokenData);

            const wallet = walletService.getCurrentWallet();
            if (!wallet) {
                throw new Error('Wallet non connesso');
            }

            console.log('🔄 Creazione token:', currencyCode);

            // Step 1: Configura account issuer
            const issuerConfig = await this.configureIssuerAccount({
                transferFee,
                requireAuth,
                disallowXRP,
                defaultRipple
            });

            // Step 2: Crea token metadata
            const tokenMetadata = {
                ...metadata,
                currencyCode,
                totalSupply,
                issuer: wallet.address,
                createdAt: new Date().toISOString(),
                network: xrplService.getCurrentNetwork()?.name || 'unknown'
            };

            // Step 3: Crea trust line per il token (se necessario)
            const trustLineResult = await this.createTrustLine(
                wallet.address,
                currencyCode,
                totalSupply
            );

            // Step 4: Emetti token (Payment da issuer a se stesso)
            const paymentResult = await this.issueTokens(
                wallet.address,
                currencyCode,
                totalSupply
            );

            // Step 5: Crea record token
            const token = {
                id: this.generateTokenId(),
                currencyCode,
                totalSupply: parseFloat(totalSupply),
                issuer: wallet.address,
                metadata: tokenMetadata,
                config: {
                    transferFee,
                    requireAuth,
                    disallowXRP,
                    defaultRipple
                },
                transactions: {
                    issuerConfig: issuerConfig.hash,
                    trustLine: trustLineResult.hash,
                    payment: paymentResult.hash
                },
                status: 'active',
                createdAt: new Date().toISOString()
            };

            // Salva token
            this.tokens.set(token.id, token);

            // Emetti evento
            this.emit('tokenCreated', token);

            console.log('✅ Token creato:', token.id);
            return token;

        } catch (error) {
            console.error('❌ Errore creazione token:', error);
            throw error;
        }
    }

    /**
     * Configura account issuer
     */
    async configureIssuerAccount(config) {
        try {
            const wallet = walletService.getCurrentWallet();
            
            // Prepara flags per AccountSet
            let setFlags = 0;
            let clearFlags = 0;

            // Disallow XRP flag
            if (config.disallowXRP) {
                setFlags |= 0x00000008; // asfDisallowXRP
            } else {
                clearFlags |= 0x00000008;
            }

            // Require Auth flag
            if (config.requireAuth) {
                setFlags |= 0x00000004; // asfRequireAuth
            } else {
                clearFlags |= 0x00000004;
            }

            // Default Ripple flag
            if (config.defaultRipple) {
                setFlags |= 0x00020000; // asfDefaultRipple
            } else {
                clearFlags |= 0x00020000;
            }

            // Crea transazione AccountSet
            const accountSetTx = {
                TransactionType: 'AccountSet',
                Account: wallet.address
            };

            // Aggiungi flags se necessario
            if (setFlags > 0) {
                accountSetTx.SetFlag = setFlags;
            }
            if (clearFlags > 0) {
                accountSetTx.ClearFlag = clearFlags;
            }

            // Aggiungi transfer fee se specificato
            if (config.transferFee > 0) {
                accountSetTx.TransferRate = 1000000000 + config.transferFee;
            }

            console.log('🔄 Configurazione account issuer...', accountSetTx);

            // Invia transazione
            const response = await xrplService.submitTransaction(accountSetTx, wallet);
            
            if (response.result.engine_result !== 'tesSUCCESS') {
                throw new Error(`Errore configurazione issuer: ${response.result.engine_result}`);
            }

            return {
                hash: response.result.tx_json.hash,
                config,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Errore configurazione issuer:', error);
            throw error;
        }
    }

    /**
     * Crea trust line per il token
     */
    async createTrustLine(issuer, currencyCode, limit) {
        try {
            const wallet = walletService.getCurrentWallet();
            
            // Formatta currency code
            const formattedCurrency = this.formatCurrencyCode(currencyCode);

            // Crea transazione TrustSet
            const trustSetTx = {
                TransactionType: 'TrustSet',
                Account: wallet.address,
                LimitAmount: {
                    currency: formattedCurrency,
                    issuer: issuer,
                    value: limit.toString()
                }
            };

            console.log('🔄 Creazione trust line...', trustSetTx);

            // Invia transazione
            const response = await xrplService.submitTransaction(trustSetTx, wallet);
            
            if (response.result.engine_result !== 'tesSUCCESS') {
                throw new Error(`Errore trust line: ${response.result.engine_result}`);
            }

            // Salva trust line
            const trustLineKey = `${wallet.address}:${currencyCode}:${issuer}`;
            this.trustLines.set(trustLineKey, {
                account: wallet.address,
                currency: currencyCode,
                issuer: issuer,
                limit: parseFloat(limit),
                hash: response.result.tx_json.hash,
                createdAt: new Date().toISOString()
            });

            return {
                hash: response.result.tx_json.hash,
                account: wallet.address,
                currency: currencyCode,
                issuer: issuer,
                limit: parseFloat(limit)
            };

        } catch (error) {
            console.error('❌ Errore trust line:', error);
            throw error;
        }
    }

    /**
     * Emetti token (Payment da issuer)
     */
    async issueTokens(destination, currencyCode, amount) {
        try {
            const wallet = walletService.getCurrentWallet();
            
            // Formatta currency code
            const formattedCurrency = this.formatCurrencyCode(currencyCode);

            // Crea transazione Payment
            const paymentTx = {
                TransactionType: 'Payment',
                Account: wallet.address,
                Destination: destination,
                Amount: {
                    currency: formattedCurrency,
                    issuer: wallet.address,
                    value: amount.toString()
                }
            };

            console.log('🔄 Emissione token...', paymentTx);

            // Invia transazione
            const response = await xrplService.submitTransaction(paymentTx, wallet);
            
            if (response.result.engine_result !== 'tesSUCCESS') {
                throw new Error(`Errore emissione token: ${response.result.engine_result}`);
            }

            return {
                hash: response.result.tx_json.hash,
                from: wallet.address,
                to: destination,
                currency: currencyCode,
                amount: parseFloat(amount)
            };

        } catch (error) {
            console.error('❌ Errore emissione token:', error);
            throw error;
        }
    }

    /**
     * Trasferisce token tra account
     */
    async transferToken(fromWallet, toAddress, currencyCode, amount, memo = '') {
        try {
            // Validazione input
            if (!isValidClassicAddress(toAddress)) {
                throw new Error('Indirizzo destinazione non valido');
            }

            if (!currencyCode || amount <= 0) {
                throw new Error('Currency code e amount richiesti');
            }

            // Trova token info
            const tokenInfo = await this.getTokenInfo(currencyCode);
            if (!tokenInfo) {
                throw new Error(`Token ${currencyCode} non trovato`);
            }

            // Verifica saldo
            const balance = await this.getTokenBalance(fromWallet.address, currencyCode);
            if (balance.balance < amount) {
                throw new Error(`Saldo insufficiente. Disponibile: ${balance.balance}, Richiesto: ${amount}`);
            }

            // Formatta currency code
            const formattedCurrency = this.formatCurrencyCode(currencyCode);

            // Crea transazione Payment
            const paymentTx = {
                TransactionType: 'Payment',
                Account: fromWallet.address,
                Destination: toAddress,
                Amount: {
                    currency: formattedCurrency,
                    issuer: tokenInfo.issuer,
                    value: amount.toString()
                }
            };

            // Aggiungi memo se specificato
            if (memo) {
                paymentTx.Memos = [{
                    Memo: {
                        MemoData: convertStringToHex(memo),
                        MemoType: convertStringToHex('text/plain')
                    }
                }];
            }

            console.log('🔄 Trasferimento token...', paymentTx);

            // Invia transazione
            const response = await xrplService.submitTransaction(paymentTx, fromWallet);
            
            if (response.result.engine_result !== 'tesSUCCESS') {
                throw new Error(`Errore trasferimento: ${response.result.engine_result}`);
            }

            const transfer = {
                hash: response.result.tx_json.hash,
                from: fromWallet.address,
                to: toAddress,
                currency: currencyCode,
                amount: parseFloat(amount),
                memo,
                timestamp: new Date().toISOString()
            };

            // Emetti evento
            this.emit('tokenTransferred', transfer);

            return transfer;

        } catch (error) {
            console.error('❌ Errore trasferimento token:', error);
            throw error;
        }
    }

    /**
     * Ottieni informazioni token
     */
    async getTokenInfo(currencyCode) {
        try {
            // Cerca nei token creati
            for (const token of this.tokens.values()) {
                if (token.currencyCode === currencyCode) {
                    return token;
                }
            }

            // Se non trovato localmente, cerca su XRPL
            // (implementazione semplificata)
            return null;

        } catch (error) {
            console.error('❌ Errore recupero info token:', error);
            throw error;
        }
    }

    /**
     * Ottieni saldo token per un account
     */
    async getTokenBalance(address, currencyCode) {
        try {
            if (!isValidClassicAddress(address)) {
                throw new Error('Indirizzo non valido');
            }

            // Trova token info
            const tokenInfo = await this.getTokenInfo(currencyCode);
            if (!tokenInfo) {
                throw new Error(`Token ${currencyCode} non trovato`);
            }

            // Richiedi account lines
            const response = await xrplService.client.request({
                command: 'account_lines',
                account: address,
                ledger_index: 'validated'
            });

            const lines = response.result.lines;
            const formattedCurrency = this.formatCurrencyCode(currencyCode);
            
            // Trova la line per questo token
            const tokenLine = lines.find(line => 
                line.currency === formattedCurrency && 
                line.account === tokenInfo.issuer
            );

            if (!tokenLine) {
                return {
                    currency: currencyCode,
                    balance: 0,
                    limit: 0,
                    issuer: tokenInfo.issuer,
                    hasLine: false
                };
            }

            return {
                currency: currencyCode,
                balance: parseFloat(tokenLine.balance),
                limit: parseFloat(tokenLine.limit),
                issuer: tokenInfo.issuer,
                hasLine: true,
                qualityIn: tokenLine.quality_in,
                qualityOut: tokenLine.quality_out
            };

        } catch (error) {
            console.error('❌ Errore saldo token:', error);
            throw error;
        }
    }

    /**
     * Lista tutti i token creati
     */
    getCreatedTokens() {
        return Array.from(this.tokens.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Lista token per issuer
     */
    getTokensByIssuer(issuerAddress) {
        return Array.from(this.tokens.values())
            .filter(token => token.issuer === issuerAddress)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Ottieni trust lines per un account
     */
    async getAccountTrustLines(address) {
        try {
            if (!isValidClassicAddress(address)) {
                throw new Error('Indirizzo non valido');
            }

            const response = await xrplService.client.request({
                command: 'account_lines',
                account: address,
                ledger_index: 'validated'
            });

            return response.result.lines.map(line => ({
                currency: line.currency,
                issuer: line.account,
                balance: parseFloat(line.balance),
                limit: parseFloat(line.limit),
                qualityIn: line.quality_in,
                qualityOut: line.quality_out
            }));

        } catch (error) {
            console.error('❌ Errore trust lines:', error);
            throw error;
        }
    }

    /**
     * Formatta currency code per XRPL
     */
    formatCurrencyCode(code) {
        if (code.length === 3) {
            // Standard currency code (es. USD, EUR)
            return code.toUpperCase();
        } else {
            // Custom currency code - converti in hex
            return convertStringToHex(code).padEnd(40, '0');
        }
    }

    /**
     * Decodifica currency code da XRPL
     */
    decodeCurrencyCode(hexCode) {
        if (hexCode.length === 3) {
            return hexCode;
        } else {
            try {
                return convertHexToString(hexCode).replace(/\0/g, '');
            } catch (error) {
                return hexCode;
            }
        }
    }

    /**
     * Genera ID token unico
     */
    generateTokenId() {
        return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validazione dati token
     */
    validateTokenData(tokenData) {
        const { currencyCode, totalSupply, transferFee } = tokenData;

        if (!currencyCode || currencyCode.length < this.tokenConfig.minCurrencyCodeLength) {
            throw new Error(`Currency code deve essere almeno ${this.tokenConfig.minCurrencyCodeLength} caratteri`);
        }

        if (currencyCode.length > this.tokenConfig.maxCurrencyCodeLength) {
            throw new Error(`Currency code non può superare ${this.tokenConfig.maxCurrencyCodeLength} caratteri`);
        }

        if (!totalSupply || totalSupply <= 0) {
            throw new Error('Total supply deve essere maggiore di 0');
        }

        if (transferFee && (transferFee < 0 || transferFee > this.tokenConfig.maxTransferFee)) {
            throw new Error(`Transfer fee deve essere tra 0 e ${this.tokenConfig.maxTransferFee}`);
        }
    }

    /**
     * Ottieni statistiche tokenizzazione
     */
    getTokenizationStats() {
        const tokens = Array.from(this.tokens.values());
        
        return {
            totalTokens: tokens.length,
            totalSupply: tokens.reduce((sum, token) => sum + token.totalSupply, 0),
            activeTokens: tokens.filter(token => token.status === 'active').length,
            recentTokens: tokens.filter(token => {
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return new Date(token.createdAt) > dayAgo;
            }).length,
            tokensByNetwork: tokens.reduce((acc, token) => {
                const network = token.metadata.network || 'unknown';
                acc[network] = (acc[network] || 0) + 1;
                return acc;
            }, {})
        };
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
        this.tokens.clear();
        this.trustLines.clear();
        this.eventListeners.clear();
        console.log('✅ Cleanup tokenization service completato');
    }
}

// Esporta istanza singleton
const tokenizationService = new TokenizationService();
export default tokenizationService;

