/**
 * Asset Management Service per Solcraft Nexus
 * Gestisce asset tokenizzati, metadata e ownership tracking
 * Implementazione avanzata per gestione completa degli asset
 */

import { convertStringToHex, convertHexToString } from 'xrpl';
import xrplService from './xrplService.js';
import walletService from './walletService.js';
import tokenizationService from './xrplTokenizationService.js';

class AssetManagementService {
    constructor() {
        this.assets = new Map();
        this.assetMetadata = new Map();
        this.ownershipHistory = new Map();
        this.eventListeners = new Map();
        
        // Configurazione asset
        this.assetConfig = {
            maxMetadataSize: 1024 * 10, // 10KB
            supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            maxFileSize: 1024 * 1024 * 5, // 5MB
            ipfsGateway: 'https://ipfs.io/ipfs/'
        };
    }

    /**
     * Crea un nuovo asset tokenizzato
     */
    async createAsset(assetData) {
        try {
            const {
                name,
                description,
                category,
                value,
                currency = 'USD',
                metadata,
                files = [],
                tokenData
            } = assetData;

            // Validazione input
            this.validateAssetData(assetData);

            const wallet = walletService.getCurrentWallet();
            if (!wallet) {
                throw new Error('Wallet non connesso');
            }

            console.log('🔄 Creazione asset:', name);

            // Step 1: Upload files e metadata
            const uploadedFiles = await this.uploadAssetFiles(files);
            const metadataHash = await this.uploadMetadata({
                ...metadata,
                files: uploadedFiles,
                createdBy: wallet.address,
                createdAt: new Date().toISOString()
            });

            // Step 2: Crea token per l'asset
            const token = await tokenizationService.createToken({
                ...tokenData,
                metadata: {
                    ...tokenData.metadata,
                    assetId: this.generateAssetId(),
                    metadataHash,
                    assetType: 'tokenized_asset'
                }
            });

            // Step 3: Crea record asset
            const asset = {
                id: this.generateAssetId(),
                name,
                description,
                category,
                value,
                currency,
                owner: wallet.address,
                token: {
                    currencyCode: token.currencyCode,
                    issuer: token.issuer,
                    totalSupply: token.totalSupply
                },
                metadata: {
                    ...metadata,
                    files: uploadedFiles,
                    metadataHash
                },
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Salva asset
            this.assets.set(asset.id, asset);
            this.assetMetadata.set(asset.id, metadata);

            // Inizializza ownership history
            this.ownershipHistory.set(asset.id, [{
                owner: wallet.address,
                timestamp: new Date().toISOString(),
                transactionType: 'creation',
                transactionHash: token.transactions.payment
            }]);

            // Emetti evento
            this.emit('assetCreated', asset);

            console.log('✅ Asset creato:', asset.id);
            return asset;

        } catch (error) {
            console.error('❌ Errore creazione asset:', error);
            throw error;
        }
    }

    /**
     * Trasferisce ownership di un asset
     */
    async transferAsset(assetId, newOwner, transferData = {}) {
        try {
            const asset = this.assets.get(assetId);
            if (!asset) {
                throw new Error(`Asset ${assetId} non trovato`);
            }

            const wallet = walletService.getCurrentWallet();
            if (!wallet) {
                throw new Error('Wallet non connesso');
            }

            if (asset.owner !== wallet.address) {
                throw new Error('Non sei il proprietario di questo asset');
            }

            console.log('🔄 Trasferimento asset:', assetId);

            // Trasferisci token associato
            const tokenTransfer = await tokenizationService.transferToken(
                wallet,
                newOwner,
                asset.token.currencyCode,
                asset.token.totalSupply,
                transferData.memo
            );

            // Aggiorna ownership
            const previousOwner = asset.owner;
            asset.owner = newOwner;
            asset.updatedAt = new Date().toISOString();

            // Aggiorna ownership history
            const history = this.ownershipHistory.get(assetId) || [];
            history.push({
                previousOwner,
                newOwner,
                timestamp: new Date().toISOString(),
                transactionType: 'transfer',
                transactionHash: tokenTransfer.hash,
                transferData
            });
            this.ownershipHistory.set(assetId, history);

            // Salva asset aggiornato
            this.assets.set(assetId, asset);

            // Emetti evento
            this.emit('assetTransferred', {
                assetId,
                previousOwner,
                newOwner,
                transactionHash: tokenTransfer.hash
            });

            console.log('✅ Asset trasferito:', assetId);
            return {
                asset,
                transfer: tokenTransfer
            };

        } catch (error) {
            console.error('❌ Errore trasferimento asset:', error);
            throw error;
        }
    }

    /**
     * Aggiorna metadata di un asset
     */
    async updateAssetMetadata(assetId, newMetadata) {
        try {
            const asset = this.assets.get(assetId);
            if (!asset) {
                throw new Error(`Asset ${assetId} non trovato`);
            }

            const wallet = walletService.getCurrentWallet();
            if (!wallet) {
                throw new Error('Wallet non connesso');
            }

            if (asset.owner !== wallet.address) {
                throw new Error('Non sei il proprietario di questo asset');
            }

            // Valida nuova metadata
            this.validateMetadata(newMetadata);

            // Upload nuova metadata
            const metadataHash = await this.uploadMetadata({
                ...newMetadata,
                updatedBy: wallet.address,
                updatedAt: new Date().toISOString(),
                previousHash: asset.metadata.metadataHash
            });

            // Aggiorna asset
            asset.metadata = {
                ...asset.metadata,
                ...newMetadata,
                metadataHash
            };
            asset.updatedAt = new Date().toISOString();

            // Salva modifiche
            this.assets.set(assetId, asset);
            this.assetMetadata.set(assetId, asset.metadata);

            // Emetti evento
            this.emit('assetMetadataUpdated', {
                assetId,
                metadata: asset.metadata,
                metadataHash
            });

            console.log('✅ Metadata asset aggiornata:', assetId);
            return asset;

        } catch (error) {
            console.error('❌ Errore aggiornamento metadata:', error);
            throw error;
        }
    }

    /**
     * Recupera informazioni complete di un asset
     */
    async getAssetDetails(assetId) {
        try {
            const asset = this.assets.get(assetId);
            if (!asset) {
                throw new Error(`Asset ${assetId} non trovato`);
            }

            // Recupera token info aggiornata
            const tokenInfo = await tokenizationService.getTokenInfo(asset.token.currencyCode);
            
            // Recupera ownership history
            const ownershipHistory = this.ownershipHistory.get(assetId) || [];
            
            // Recupera saldo token corrente del proprietario
            const tokenBalance = await tokenizationService.getTokenBalance(
                asset.owner,
                asset.token.currencyCode
            );

            return {
                ...asset,
                token: {
                    ...asset.token,
                    ...tokenInfo,
                    currentBalance: tokenBalance.balance
                },
                ownershipHistory,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Errore recupero dettagli asset:', error);
            throw error;
        }
    }

    /**
     * Lista asset per proprietario
     */
    getAssetsByOwner(ownerAddress) {
        try {
            const assets = Array.from(this.assets.values())
                .filter(asset => asset.owner === ownerAddress)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return assets;

        } catch (error) {
            console.error('❌ Errore recupero asset per proprietario:', error);
            throw error;
        }
    }

    /**
     * Cerca asset per categoria
     */
    getAssetsByCategory(category) {
        try {
            const assets = Array.from(this.assets.values())
                .filter(asset => asset.category === category)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return assets;

        } catch (error) {
            console.error('❌ Errore ricerca per categoria:', error);
            throw error;
        }
    }

    /**
     * Ricerca asset con filtri
     */
    searchAssets(filters = {}) {
        try {
            let assets = Array.from(this.assets.values());

            // Applica filtri
            if (filters.owner) {
                assets = assets.filter(asset => asset.owner === filters.owner);
            }

            if (filters.category) {
                assets = assets.filter(asset => asset.category === filters.category);
            }

            if (filters.status) {
                assets = assets.filter(asset => asset.status === filters.status);
            }

            if (filters.minValue) {
                assets = assets.filter(asset => asset.value >= filters.minValue);
            }

            if (filters.maxValue) {
                assets = assets.filter(asset => asset.value <= filters.maxValue);
            }

            if (filters.currency) {
                assets = assets.filter(asset => asset.currency === filters.currency);
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                assets = assets.filter(asset => 
                    asset.name.toLowerCase().includes(searchTerm) ||
                    asset.description.toLowerCase().includes(searchTerm)
                );
            }

            // Ordinamento
            const sortBy = filters.sortBy || 'createdAt';
            const sortOrder = filters.sortOrder || 'desc';
            
            assets.sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];
                
                if (sortOrder === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });

            // Paginazione
            if (filters.limit) {
                const offset = filters.offset || 0;
                assets = assets.slice(offset, offset + filters.limit);
            }

            return assets;

        } catch (error) {
            console.error('❌ Errore ricerca asset:', error);
            throw error;
        }
    }

    /**
     * Upload files asset
     */
    async uploadAssetFiles(files) {
        try {
            const uploadedFiles = [];

            for (const file of files) {
                // Validazione file
                this.validateFile(file);

                // Simula upload IPFS (in produzione usare servizio IPFS reale)
                const fileHash = await this.uploadToIPFS(file);
                
                uploadedFiles.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    hash: fileHash,
                    url: `${this.assetConfig.ipfsGateway}${fileHash}`,
                    uploadedAt: new Date().toISOString()
                });
            }

            return uploadedFiles;

        } catch (error) {
            console.error('❌ Errore upload files:', error);
            throw error;
        }
    }

    /**
     * Upload metadata
     */
    async uploadMetadata(metadata) {
        try {
            // Validazione metadata
            this.validateMetadata(metadata);

            // Simula upload metadata su IPFS
            const metadataString = JSON.stringify(metadata, null, 2);
            const metadataHash = await this.uploadToIPFS(new Blob([metadataString], { type: 'application/json' }));

            return metadataHash;

        } catch (error) {
            console.error('❌ Errore upload metadata:', error);
            throw error;
        }
    }

    /**
     * Simula upload su IPFS
     */
    async uploadToIPFS(file) {
        try {
            // In produzione, implementare upload reale su IPFS
            // Per ora generiamo un hash simulato
            const content = await this.fileToArrayBuffer(file);
            const hash = await this.generateHash(content);
            
            console.log('📁 File caricato su IPFS (simulato):', hash);
            return hash;

        } catch (error) {
            console.error('❌ Errore upload IPFS:', error);
            throw error;
        }
    }

    /**
     * Converte file in ArrayBuffer
     */
    async fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Genera hash per contenuto
     */
    async generateHash(content) {
        try {
            const hashBuffer = await crypto.subtle.digest('SHA-256', content);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return `Qm${hashHex.substring(0, 44)}`; // Simula formato IPFS
        } catch (error) {
            // Fallback per ambienti senza crypto.subtle
            return `Qm${Math.random().toString(36).substring(2, 46)}`;
        }
    }

    /**
     * Genera ID asset unico
     */
    generateAssetId() {
        return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validazione dati asset
     */
    validateAssetData(assetData) {
        const { name, description, category, value, tokenData } = assetData;

        if (!name || name.length < 3 || name.length > 100) {
            throw new Error('Nome asset deve essere tra 3 e 100 caratteri');
        }

        if (!description || description.length < 10 || description.length > 1000) {
            throw new Error('Descrizione deve essere tra 10 e 1000 caratteri');
        }

        if (!category) {
            throw new Error('Categoria richiesta');
        }

        if (!value || value <= 0) {
            throw new Error('Valore asset deve essere maggiore di 0');
        }

        if (!tokenData || !tokenData.currencyCode) {
            throw new Error('Dati token richiesti');
        }
    }

    /**
     * Validazione file
     */
    validateFile(file) {
        if (!this.assetConfig.supportedFileTypes.includes(file.type)) {
            throw new Error(`Tipo file non supportato: ${file.type}`);
        }

        if (file.size > this.assetConfig.maxFileSize) {
            throw new Error(`File troppo grande: ${file.size} bytes (max ${this.assetConfig.maxFileSize})`);
        }
    }

    /**
     * Validazione metadata
     */
    validateMetadata(metadata) {
        const metadataString = JSON.stringify(metadata);
        
        if (metadataString.length > this.assetConfig.maxMetadataSize) {
            throw new Error(`Metadata troppo grande: ${metadataString.length} bytes (max ${this.assetConfig.maxMetadataSize})`);
        }
    }

    /**
     * Recupera statistiche asset
     */
    getAssetStatistics() {
        try {
            const assets = Array.from(this.assets.values());
            
            const stats = {
                totalAssets: assets.length,
                totalValue: assets.reduce((sum, asset) => sum + asset.value, 0),
                assetsByCategory: {},
                assetsByStatus: {},
                averageValue: 0,
                recentAssets: assets
                    .filter(asset => {
                        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return new Date(asset.createdAt) > dayAgo;
                    }).length
            };

            // Calcola media
            if (stats.totalAssets > 0) {
                stats.averageValue = stats.totalValue / stats.totalAssets;
            }

            // Raggruppa per categoria
            assets.forEach(asset => {
                stats.assetsByCategory[asset.category] = (stats.assetsByCategory[asset.category] || 0) + 1;
                stats.assetsByStatus[asset.status] = (stats.assetsByStatus[asset.status] || 0) + 1;
            });

            return stats;

        } catch (error) {
            console.error('❌ Errore calcolo statistiche:', error);
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
        this.assets.clear();
        this.assetMetadata.clear();
        this.ownershipHistory.clear();
        this.eventListeners.clear();
        console.log('✅ Cleanup asset management service completato');
    }
}

// Esporta istanza singleton
const assetManagementService = new AssetManagementService();
export default assetManagementService;

