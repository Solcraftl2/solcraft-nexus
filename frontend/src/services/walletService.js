/**
 * Wallet Service Reale per Solcraft Nexus
 * Gestisce connessioni wallet reali (XUMM, Crossmark) con popup di autorizzazione
 * Implementazione basata sui code samples XRPL ufficiali
 */

import { isValidClassicAddress, dropsToXrp } from 'xrpl';
import xrplService from './xrplService.js';

class WalletService {
    constructor() {
        this.currentWallet = null;
        this.isConnected = false;
        this.eventListeners = new Map();
        this.connectionAttempts = 0;
        this.maxRetries = 3;
        
        // Configurazione wallet supportati
        this.supportedWallets = {
            xumm: {
                name: 'XUMM',
                icon: '/icons/xumm.png',
                available: false
            },
            crossmark: {
                name: 'Crossmark',
                icon: '/icons/crossmark.png',
                available: false
            }
        };
        
        // Verifica wallet disponibili all'avvio
        this.checkAvailableWallets();
    }

    /**
     * Verifica wallet disponibili
     */
    async checkAvailableWallets() {
        try {
            // Verifica XUMM
            if (window.xumm) {
                this.supportedWallets.xumm.available = true;
                console.log('✅ XUMM disponibile');
            }
            
            // Verifica Crossmark
            if (window.crossmark) {
                this.supportedWallets.crossmark.available = true;
                console.log('✅ Crossmark disponibile');
            }
            
            // Se nessun wallet è disponibile, mostra istruzioni
            if (!this.supportedWallets.xumm.available && !this.supportedWallets.crossmark.available) {
                console.warn('⚠️ Nessun wallet XRPL disponibile. Installa XUMM o Crossmark.');
            }
            
        } catch (error) {
            console.error('❌ Errore verifica wallet:', error);
        }
    }

    /**
     * Connessione XUMM con popup reale
     */
    async connectXUMM() {
        try {
            console.log('🔄 Connessione XUMM...');
            
            if (!window.xumm) {
                throw new Error('XUMM non disponibile. Installa l\'app XUMM e riprova.');
            }

            // Assicurati che XRPL Service sia connesso
            if (!xrplService.isConnected()) {
                await xrplService.connect();
            }

            // Richiedi autorizzazione XUMM (questo mostrerà il popup)
            const authorization = await window.xumm.authorize();
            
            if (!authorization || !authorization.account) {
                throw new Error('Autorizzazione XUMM rifiutata dall\'utente');
            }

            const address = authorization.account;
            
            // Valida indirizzo
            if (!isValidClassicAddress(address)) {
                throw new Error('Indirizzo wallet non valido');
            }

            // Recupera dettagli account da XRPL
            const accountDetails = await this.getAccountDetails(address);
            
            // Crea oggetto wallet
            const wallet = {
                address: address,
                type: 'xumm',
                name: 'XUMM Wallet',
                isConnected: true,
                connectedAt: new Date().toISOString(),
                ...accountDetails
            };

            // Salva wallet corrente
            this.currentWallet = wallet;
            this.isConnected = true;
            this.connectionAttempts = 0;

            // Salva in localStorage per persistenza
            localStorage.setItem('solcraft_wallet', JSON.stringify({
                address: wallet.address,
                type: wallet.type,
                connectedAt: wallet.connectedAt
            }));

            // Emetti evento connessione
            this.emit('walletConnected', wallet);

            console.log('✅ XUMM connesso:', address);
            return wallet;

        } catch (error) {
            this.connectionAttempts++;
            console.error('❌ Errore connessione XUMM:', error);
            
            // Emetti evento errore
            this.emit('connectionError', {
                wallet: 'xumm',
                error: error.message,
                attempts: this.connectionAttempts
            });
            
            throw error;
        }
    }

    /**
     * Connessione Crossmark con popup reale
     */
    async connectCrossmark() {
        try {
            console.log('🔄 Connessione Crossmark...');
            
            if (!window.crossmark) {
                throw new Error('Crossmark non disponibile. Installa l\'estensione Crossmark e riprova.');
            }

            // Assicurati che XRPL Service sia connesso
            if (!xrplService.isConnected()) {
                await xrplService.connect();
            }

            // Richiedi connessione Crossmark (questo mostrerà il popup)
            const response = await window.crossmark.signIn();
            
            if (!response || !response.response || !response.response.account) {
                throw new Error('Connessione Crossmark rifiutata dall\'utente');
            }

            const address = response.response.account;
            
            // Valida indirizzo
            if (!isValidClassicAddress(address)) {
                throw new Error('Indirizzo wallet non valido');
            }

            // Recupera dettagli account da XRPL
            const accountDetails = await this.getAccountDetails(address);
            
            // Crea oggetto wallet
            const wallet = {
                address: address,
                type: 'crossmark',
                name: 'Crossmark Wallet',
                isConnected: true,
                connectedAt: new Date().toISOString(),
                ...accountDetails
            };

            // Salva wallet corrente
            this.currentWallet = wallet;
            this.isConnected = true;
            this.connectionAttempts = 0;

            // Salva in localStorage per persistenza
            localStorage.setItem('solcraft_wallet', JSON.stringify({
                address: wallet.address,
                type: wallet.type,
                connectedAt: wallet.connectedAt
            }));

            // Emetti evento connessione
            this.emit('walletConnected', wallet);

            console.log('✅ Crossmark connesso:', address);
            return wallet;

        } catch (error) {
            this.connectionAttempts++;
            console.error('❌ Errore connessione Crossmark:', error);
            
            // Emetti evento errore
            this.emit('connectionError', {
                wallet: 'crossmark',
                error: error.message,
                attempts: this.connectionAttempts
            });
            
            throw error;
        }
    }

    /**
     * Recupera dettagli account da XRPL
     */
    async getAccountDetails(address) {
        try {
            // Recupera informazioni account
            const accountInfo = await xrplService.getAccountInfo(address);
            const balance = await xrplService.getAccountBalance(address);
            const reserve = await xrplService.getReserveRequirement(balance.ownerCount);

            return {
                balanceXRP: balance.balanceXRP,
                balanceDrops: balance.balanceDrops,
                availableBalanceXRP: balance.balanceXRP - reserve.totalReserve,
                reserveXRP: reserve.totalReserve,
                ownerCount: balance.ownerCount,
                sequence: accountInfo.Sequence,
                previousTxnID: accountInfo.PreviousTxnID,
                accountFlags: accountInfo.Flags,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Errore recupero dettagli account:', error);
            
            // Ritorna valori di default se non riesce a recuperare i dettagli
            return {
                balanceXRP: 0,
                balanceDrops: '0',
                availableBalanceXRP: 0,
                reserveXRP: 10, // Reserve di default
                ownerCount: 0,
                sequence: 0,
                lastUpdated: new Date().toISOString()
            };
        }
    }

    /**
     * Aggiorna dettagli wallet corrente
     */
    async refreshWalletDetails() {
        try {
            if (!this.currentWallet) {
                throw new Error('Nessun wallet connesso');
            }

            const updatedDetails = await this.getAccountDetails(this.currentWallet.address);
            
            // Aggiorna wallet corrente
            this.currentWallet = {
                ...this.currentWallet,
                ...updatedDetails
            };

            // Emetti evento aggiornamento
            this.emit('walletUpdated', this.currentWallet);

            return this.currentWallet;

        } catch (error) {
            console.error('❌ Errore aggiornamento wallet:', error);
            throw error;
        }
    }

    /**
     * Disconnessione wallet
     */
    async disconnect() {
        try {
            if (!this.isConnected) {
                console.log('ℹ️ Nessun wallet connesso');
                return;
            }

            const previousWallet = this.currentWallet;

            // Reset stato
            this.currentWallet = null;
            this.isConnected = false;
            this.connectionAttempts = 0;

            // Rimuovi da localStorage
            localStorage.removeItem('solcraft_wallet');

            // Disconnetti da wallet specifico
            if (previousWallet?.type === 'xumm' && window.xumm) {
                try {
                    await window.xumm.logout();
                } catch (error) {
                    console.warn('⚠️ Errore logout XUMM:', error);
                }
            }

            // Emetti evento disconnessione
            this.emit('walletDisconnected', previousWallet);

            console.log('✅ Wallet disconnesso');

        } catch (error) {
            console.error('❌ Errore disconnessione:', error);
            throw error;
        }
    }

    /**
     * Ripristina connessione da localStorage
     */
    async restoreConnection() {
        try {
            const savedWallet = localStorage.getItem('solcraft_wallet');
            
            if (!savedWallet) {
                return null;
            }

            const walletData = JSON.parse(savedWallet);
            
            // Verifica se il wallet è ancora disponibile
            if (walletData.type === 'xumm' && !window.xumm) {
                localStorage.removeItem('solcraft_wallet');
                return null;
            }
            
            if (walletData.type === 'crossmark' && !window.crossmark) {
                localStorage.removeItem('solcraft_wallet');
                return null;
            }

            // Verifica se la connessione è ancora valida (max 24 ore)
            const connectedAt = new Date(walletData.connectedAt);
            const now = new Date();
            const hoursDiff = (now - connectedAt) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                localStorage.removeItem('solcraft_wallet');
                return null;
            }

            // Recupera dettagli aggiornati
            const accountDetails = await this.getAccountDetails(walletData.address);
            
            // Ripristina wallet
            const wallet = {
                address: walletData.address,
                type: walletData.type,
                name: walletData.type === 'xumm' ? 'XUMM Wallet' : 'Crossmark Wallet',
                isConnected: true,
                connectedAt: walletData.connectedAt,
                restoredAt: new Date().toISOString(),
                ...accountDetails
            };

            this.currentWallet = wallet;
            this.isConnected = true;

            console.log('✅ Connessione wallet ripristinata:', wallet.address);
            return wallet;

        } catch (error) {
            console.error('❌ Errore ripristino connessione:', error);
            localStorage.removeItem('solcraft_wallet');
            return null;
        }
    }

    /**
     * Ottieni wallet corrente
     */
    getCurrentWallet() {
        return this.currentWallet;
    }

    /**
     * Verifica se wallet è connesso
     */
    isWalletConnected() {
        return this.isConnected && this.currentWallet !== null;
    }

    /**
     * Ottieni wallet supportati
     */
    getSupportedWallets() {
        return this.supportedWallets;
    }

    /**
     * Ottieni wallet disponibili
     */
    getAvailableWallets() {
        return Object.entries(this.supportedWallets)
            .filter(([_, wallet]) => wallet.available)
            .reduce((acc, [key, wallet]) => {
                acc[key] = wallet;
                return acc;
            }, {});
    }

    /**
     * Verifica saldo sufficiente per transazione
     */
    async checkSufficientBalance(amount, includeReserve = true) {
        try {
            if (!this.currentWallet) {
                throw new Error('Nessun wallet connesso');
            }

            const requiredAmount = parseFloat(amount);
            const availableBalance = includeReserve ? 
                this.currentWallet.availableBalanceXRP : 
                this.currentWallet.balanceXRP;

            return {
                sufficient: availableBalance >= requiredAmount,
                available: availableBalance,
                required: requiredAmount,
                difference: availableBalance - requiredAmount
            };

        } catch (error) {
            console.error('❌ Errore verifica saldo:', error);
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
        this.currentWallet = null;
        this.isConnected = false;
        this.eventListeners.clear();
        localStorage.removeItem('solcraft_wallet');
        console.log('✅ Cleanup wallet service completato');
    }
}

// Esporta istanza singleton
const walletService = new WalletService();

// Auto-ripristino connessione all'avvio
walletService.restoreConnection().catch(error => {
    console.warn('⚠️ Impossibile ripristinare connessione wallet:', error);
});

export default walletService;

