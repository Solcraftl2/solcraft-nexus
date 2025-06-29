// Tokenization service wrapper that delegates all operations to backend API
import apiService from './apiService.js';

class XRPLTokenizationService {
  async createRealEstateToken(assetData) {
    return apiService.tokenizeAsset(assetData);
  }

  async sendMPTTokens(mptId, destinationAddress, amount) {
    return apiService.transferToken({ mptId, recipient: destinationAddress, amount });
  }

  async getMPTInfo(mptId) {
    return apiService.getTokenDetails(mptId);
  }

  async getIssuerMPTs() {
    return apiService.getTokens();
  }
}

const xrplTokenizationService = new XRPLTokenizationService();
export default xrplTokenizationService;
export { xrplTokenizationService as tokenizationService };
