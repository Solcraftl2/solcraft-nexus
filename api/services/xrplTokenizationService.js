import { Client, Wallet } from 'xrpl';

class XRPLTokenizationService {
  constructor() {
    this.client = new Client(process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233');
    this.isConnected = false;
    this.issuerWallet = null;
    this.issuerAddress = process.env.ISSUER_ADDRESS;
    this.issuerSecret = process.env.ISSUER_SECRET;
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
    if (this.issuerSecret && !this.issuerWallet) {
      this.issuerWallet = Wallet.fromSeed(this.issuerSecret);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async createRealEstateToken(assetData) {
    try {
      await this.connect();

      if (!this.issuerWallet) {
        throw new Error('Issuer wallet non configurato');
      }

      this.validateAssetData(assetData);
      const metadata = this.prepareAssetMetadata(assetData);

      const tx = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: this.issuerWallet.address,
        MPTokenMetadata: this.encodeMetadata(metadata),
        MaximumAmount: assetData.totalSupply.toString(),
        TransferFee: this.calculateTransferFee(assetData.transferFeePercent || 0.5),
        Flags: this.calculateMPTFlags(assetData)
      };

      const prepared = await this.client.autofill(tx);
      const signed = this.issuerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Transazione fallita: ${result.result.meta.TransactionResult}`);
      }

      const mptIssuanceId = this.extractMPTIssuanceId(result);

      return {
        mptIssuanceId,
        transactionHash: result.result.hash,
        issuerAddress: this.issuerWallet.address,
        metadata,
        assetData,
        createdAt: new Date().toISOString(),
        status: 'active',
        ledgerIndex: result.result.ledger_index
      };
    } catch (error) {
      throw new Error(`Tokenizzazione fallita: ${error.message}`);
    }
  }

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

  encodeMetadata(metadata) {
    const json = JSON.stringify(metadata);
    return Buffer.from(json, 'utf8').toString('hex').toUpperCase();
  }

  calculateTransferFee(percentFee) {
    return Math.floor(1000000000 + percentFee * 10000000);
  }

  calculateMPTFlags(assetData) {
    let flags = 0;
    if (assetData.transferable !== false) flags |= 0x00000001;
    if (assetData.burnable === true) flags |= 0x00000002;
    if (assetData.onlyXRP === true) flags |= 0x00000004;
    return flags;
  }

  extractMPTIssuanceId(txResult) {
    const nodes = txResult.result.meta.CreatedNodes;
    const mptNode = nodes.find(n => n.CreatedNode && n.CreatedNode.LedgerEntryType === 'MPToken');
    if (!mptNode) {
      throw new Error('MPT Issuance ID non trovato nella transazione');
    }
    return mptNode.CreatedNode.LedgerIndex;
  }

  validateAssetData(assetData) {
    const required = ['name', 'symbol', 'location', 'faceValue', 'totalSupply'];
    for (const f of required) {
      if (!assetData[f]) {
        throw new Error(`Campo obbligatorio mancante: ${f}`);
      }
    }
    if (assetData.totalSupply <= 0) throw new Error('Total supply deve essere maggiore di 0');
    if (assetData.faceValue <= 0) throw new Error('Face value deve essere maggiore di 0');
    if (assetData.symbol.length > 20) throw new Error('Symbol deve essere massimo 20 caratteri');
  }
}

const xrplTokenizationService = new XRPLTokenizationService();
export default xrplTokenizationService;
export { xrplTokenizationService as tokenizationService };
