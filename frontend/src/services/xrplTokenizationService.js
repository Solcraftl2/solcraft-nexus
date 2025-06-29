import apiService from './apiService.js';

/**
 * Wrapper service that delegates tokenization actions to backend APIs.
 */
class XRPLTokenizationService {
  async createRealEstateToken(assetData) {
    return apiService.tokenizeAsset(assetData);
  }

  async sendMPTTokens(mptIssuanceId, destinationAddress, amount) {
    return apiService.transferToken({
      mpt_id: mptIssuanceId,
      recipient: destinationAddress,
      amount,
    });
  }

  async getMPTInfo(mptIssuanceId) {
    return apiService.getTokenDetails(mptIssuanceId);
  }

  async getIssuerMPTs() {
    return apiService.getTokens();
  }
}

const tokenizationService = new XRPLTokenizationService();
export default tokenizationService;
export { tokenizationService };
