import { Client, Wallet } from 'xrpl';

class XRPLTokenizationService {
  constructor() {
    this.server = process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233';
    this.client = new Client(this.server);
    this.isConnected = false;
    this.issuerSecret = process.env.ISSUER_SECRET || null;
    this.issuerWallet = this.issuerSecret ? Wallet.fromSeed(this.issuerSecret) : null;
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
    if (!this.issuerWallet && this.issuerSecret) {
      this.issuerWallet = Wallet.fromSeed(this.issuerSecret);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  encodeMetadata(metadata) {
    return Buffer.from(JSON.stringify(metadata), 'utf8').toString('hex').toUpperCase();
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

  extractMPTIssuanceId(result) {
    const createdNodes = result.result.meta.CreatedNodes || [];
    const mptNode = createdNodes.find(
      (n) => n.CreatedNode && n.CreatedNode.LedgerEntryType === 'MPToken'
    );
    if (mptNode) {
      return mptNode.CreatedNode.LedgerIndex;
    }
    throw new Error('MPT Issuance ID not found');
  }

  prepareAssetMetadata(data) {
    return {
      Name: `${data.name} Token`,
      Identifier: data.symbol,
      AssetType: data.assetType || 'Real Estate',
      Location: data.location,
      Description: data.description,
      FaceValue: data.faceValue,
      TotalSupply: data.totalSupply,
      Currency: data.currency || 'USD',
      IssueDate: new Date().toISOString().split('T')[0],
      Jurisdiction: data.jurisdiction || 'Unknown',
      RegulatoryCompliance: 'Generated via API',
      SecurityType: 'MPT',
      Issuer: 'SolCraft Nexus',
      ExternalUrl: data.externalUrl || '',
      LegalDocuments: data.legalDocuments || [],
      Valuation: {
        amount: data.valuation || data.faceValue,
        currency: data.currency || 'USD',
        date: new Date().toISOString().split('T')[0],
        valuator: data.valuator || 'Automated'
      }
    };
  }

  async createToken(assetData) {
    await this.connect();
    if (!this.issuerWallet) throw new Error('Issuer wallet not configured');

    const metadata = this.prepareAssetMetadata(assetData);
    const tx = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: this.issuerWallet.address,
      MPTokenMetadata: this.encodeMetadata(metadata),
      MaximumAmount: assetData.totalSupply.toString(),
      TransferFee: this.calculateTransferFee(assetData.transferFeePercent || 0),
      Flags: this.calculateMPTFlags(assetData)
    };

    const prepared = await this.client.autofill(tx);
    const signed = this.issuerWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta && result.result.meta.TransactionResult === 'tesSUCCESS') {
      return {
        success: true,
        mptIssuanceId: this.extractMPTIssuanceId(result),
        transactionHash: result.result.hash,
        ledgerIndex: result.result.ledger_index,
        issuerAddress: this.issuerWallet.address,
        metadata
      };
    }

    throw new Error(result.result.meta ? result.result.meta.TransactionResult : 'Transaction failed');
  }
}

const xrplTokenizationService = new XRPLTokenizationService();
export default xrplTokenizationService;
