/**
 * XRPL Real Tokenization Service
 * Implementazione REALE per tokenizzazione asset su XRPL usando Multi-Purpose Token (MPT)
 * Sostituisce completamente le simulazioni con transazioni blockchain vere
 */

import { Client, Wallet, xrplToDrops, dropsToXrpl } from 'xrpl';

class XRPLTokenizationService {
    constructor() {
        // Configurazione XRPL Client per Mainnet/Testnet
        this.client = new Client(process.env.VITE_XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233');
        this.isConnected = false;
        
        // Account Issuer configurato per tokenizzazione
        this.issuerWallet = null;
        this.issuerAddress = process.env.VITE_ISSUER_ADDRESS;
        this.issuerSecret = null; // moved to backend
    }

    /**
     * Connessione al network XRPL
     */
    async connect() {
        try {
            if (!this.isConnected) {
                await this.client.connect();
                this.isConnected = true;
                console.log('✅ Connesso a XRPL network');
            }
            
            // Issuer wallet is managed server-side
            
            return true;
        } catch (error) {
            console.error('❌ Errore connessione XRPL:', error);
            throw new Error(`Connessione XRPL fallita: ${error.message}`);
        }
    }

    /**
     * Disconnessione dal network XRPL
     */
    async disconnect() {
        try {
            if (this.isConnected) {
                await this.client.disconnect();
                this.isConnected = false;
                console.log('✅ Disconnesso da XRPL network');
            }
        } catch (error) {
            console.error('❌ Errore disconnessione XRPL:', error);
        }
    }

    /**
     * Crea un nuovo Multi-Purpose Token (MPT) per asset immobiliare
     * IMPLEMENTAZIONE REALE - sostituisce simulazione
     */
    async createRealEstateToken(assetData) {
        try {
            await this.connect();
            

            // Validazione dati asset
            this.validateAssetData(assetData);

            // Preparazione metadata immutabile per MPT
            const metadata = this.prepareAssetMetadata(assetData);
            
            // Costruzione transazione MPTokenIssuanceCreate REALE
            const transaction = {
                TransactionType: 'MPTokenIssuanceCreate',
                Account: this.issuerAddress,
                MPTokenMetadata: this.encodeMetadata(metadata),
                MaximumAmount: assetData.totalSupply.toString(),
                TransferFee: this.calculateTransferFee(assetData.transferFeePercent || 0.5),
                Flags: this.calculateMPTFlags(assetData)
            };

            // Firma e invio tramite backend
            console.log('🚀 Invio transazione MPT via backend...');
            const result = await this.signAndSubmitTransaction(transaction);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                // Estrazione MPT Issuance ID dalla transazione
                const mptIssuanceId = this.extractMPTIssuanceId(result);
                
                // Creazione record token reale
                const tokenRecord = {
                    mptIssuanceId,
                    transactionHash: result.result.hash,
                    issuerAddress: this.issuerAddress,
                    metadata,
                    assetData,
                    createdAt: new Date().toISOString(),
                    status: 'active',
                    ledgerIndex: result.result.ledger_index
                };

                console.log('✅ Token MPT creato con successo:', mptIssuanceId);
                return tokenRecord;
            } else {
                throw new Error(`Transazione fallita: ${result.result.meta.TransactionResult}`);
            }

        } catch (error) {
            console.error('❌ Errore creazione token reale:', error);
            throw new Error(`Tokenizzazione fallita: ${error.message}`);
        }
    }

    /**
     * Prepara metadata immutabile per asset immobiliare
     */
    prepareAssetMetadata(assetData) {
        return {
            Name: `${assetData.name} Token`,
            Identifier: assetData.symbol,
            AssetType: 'Real Estate',
            Location: assetData.location,
            Description: assetData.description,
            FaceValue: assetData.faceValue,
            TotalSupply: assetData.totalSupply,
            Currency: assetData.currency || 'EUR',
            IssueDate: new Date().toISOString().split('T')[0],
            Jurisdiction: assetData.jurisdiction || 'Italy',
            RegulatoryCompliance: 'EU MiFID II, GDPR',
            SecurityType: 'Real Estate Token',
            Issuer: 'SolCraft Nexus',
            ExternalUrl: `https://solcraft-nexus.vercel.app/assets/${assetData.symbol}`,
            LegalDocuments: assetData.legalDocuments || [],
            Valuation: {
                amount: assetData.valuation,
                currency: assetData.currency || 'EUR',
                date: new Date().toISOString().split('T')[0],
                valuator: assetData.valuator || 'Certified Appraiser'
            }
        };
    }

    /**
     * Codifica metadata in formato hex per XRPL
     */
    encodeMetadata(metadata) {
        const jsonString = JSON.stringify(metadata);
        return Buffer.from(jsonString, 'utf8').toString('hex').toUpperCase();
    }

    /**
     * Calcola transfer fee per MPT (in formato XRPL)
     */
    calculateTransferFee(percentFee) {
        // XRPL transfer fee: 1000000000 = 0%, 2000000000 = 100%
        // Formula: 1000000000 + (percentFee * 10000000)
        return Math.floor(1000000000 + (percentFee * 10000000));
    }

    /**
     * Calcola flags per MPT basati su configurazione asset
     */
    calculateMPTFlags(assetData) {
        let flags = 0;

        // Flag standard per asset immobiliari
        if (assetData.transferable !== false) flags |= 0x00000001; // Transferable
        if (assetData.burnable === true) flags |= 0x00000002; // Burnable
        if (assetData.onlyXRP === true) flags |= 0x00000004; // OnlyXRP

        return flags;
    }

    /**
     * Richiede al backend la firma e l'invio di una transazione
     */
    async signAndSubmitTransaction(transaction) {
        try {
            const response = await fetch('/api/xrpl/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transaction })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Signing failed');
            }
            return data;
        } catch (error) {
            console.error('❌ Errore firma backend:', error);
            throw error;
        }
    }

    /**
     * Estrae MPT Issuance ID dalla transazione
     */
    extractMPTIssuanceId(transactionResult) {
        try {
            const createdNodes = transactionResult.result.meta.CreatedNodes;
            const mptNode = createdNodes.find(node => 
                node.CreatedNode && node.CreatedNode.LedgerEntryType === 'MPToken'
            );
            
            if (mptNode) {
                return mptNode.CreatedNode.LedgerIndex;
            }
            
            throw new Error('MPT Issuance ID non trovato nella transazione');
        } catch (error) {
            console.error('❌ Errore estrazione MPT ID:', error);
            throw error;
        }
    }

    /**
     * Valida dati asset prima della tokenizzazione
     */
    validateAssetData(assetData) {
        const required = ['name', 'symbol', 'location', 'faceValue', 'totalSupply'];
        
        for (const field of required) {
            if (!assetData[field]) {
                throw new Error(`Campo obbligatorio mancante: ${field}`);
            }
        }

        if (assetData.totalSupply <= 0) {
            throw new Error('Total supply deve essere maggiore di 0');
        }

        if (assetData.faceValue <= 0) {
            throw new Error('Face value deve essere maggiore di 0');
        }

        if (assetData.symbol.length > 20) {
            throw new Error('Symbol deve essere massimo 20 caratteri');
        }
    }

    /**
     * Invia token MPT a un account destinatario
     */
    async sendMPTTokens(mptIssuanceId, destinationAddress, amount) {
        try {
            await this.connect();

            const transaction = {
                TransactionType: 'MPTokenAuthorize',
                Account: this.issuerAddress,
                MPTokenIssuanceID: mptIssuanceId,
                Holder: destinationAddress,
                Amount: amount.toString()
            };

            const result = await this.signAndSubmitTransaction(transaction);

            if (result.result.meta.TransactionResult === 'tesSUCCESS') {
                console.log('✅ Token MPT inviati con successo');
                return {
                    success: true,
                    transactionHash: result.result.hash,
                    amount,
                    destinationAddress
                };
            } else {
                throw new Error(`Invio fallito: ${result.result.meta.TransactionResult}`);
            }

        } catch (error) {
            console.error('❌ Errore invio token:', error);
            throw error;
        }
    }

    /**
     * Ottiene informazioni su un MPT esistente
     */
    async getMPTInfo(mptIssuanceId) {
        try {
            await this.connect();

            const response = await this.client.request({
                command: 'ledger_entry',
                mptoken: mptIssuanceId
            });

            if (response.result && response.result.node) {
                const mptData = response.result.node;
                
                // Decodifica metadata se presente
                let metadata = null;
                if (mptData.MPTokenMetadata) {
                    try {
                        const decodedHex = Buffer.from(mptData.MPTokenMetadata, 'hex').toString('utf8');
                        metadata = JSON.parse(decodedHex);
                    } catch (e) {
                        console.warn('⚠️ Impossibile decodificare metadata:', e);
                    }
                }

                return {
                    mptIssuanceId,
                    issuer: mptData.Issuer,
                    maximumAmount: mptData.MaximumAmount,
                    outstandingAmount: mptData.OutstandingAmount || '0',
                    transferFee: mptData.TransferFee,
                    flags: mptData.Flags,
                    metadata,
                    sequence: mptData.Sequence
                };
            } else {
                throw new Error('MPT non trovato');
            }

        } catch (error) {
            console.error('❌ Errore recupero info MPT:', error);
            throw error;
        }
    }

    /**
     * Lista tutti i token MPT emessi dall'issuer
     */
    async getIssuerMPTs() {
        try {
            await this.connect();

            const response = await this.client.request({
                command: 'account_objects',
                account: this.issuerAddress,
                type: 'mptoken'
            });

            const mptTokens = response.result.account_objects || [];
            
            // Processa ogni token per includere metadata decodificata
            const processedTokens = await Promise.all(
                mptTokens.map(async (token) => {
                    try {
                        const fullInfo = await this.getMPTInfo(token.index);
                        return fullInfo;
                    } catch (error) {
                        console.warn('⚠️ Errore processing token:', token.index, error);
                        return null;
                    }
                })
            );

            return processedTokens.filter(token => token !== null);

        } catch (error) {
            console.error('❌ Errore recupero MPT issuer:', error);
            throw error;
        }
    }
}

// Istanza singleton del servizio
const xrplTokenizationService = new XRPLTokenizationService();

export default xrplTokenizationService;

// Export delle funzioni principali per uso diretto
export {
    xrplTokenizationService as tokenizationService
};

