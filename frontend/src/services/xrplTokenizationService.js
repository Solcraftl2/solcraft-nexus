/**
 * XRPL Tokenization Service
 * Performs tokenization by calling the backend API.
 */

class XRPLTokenizationService {
  async createRealEstateToken(assetData) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/tokenization/create', {
      method: 'POST',
      headers,
      body: JSON.stringify(assetData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Tokenization failed');
    }
    return data;
  }
}

const xrplTokenizationService = new XRPLTokenizationService();
export default xrplTokenizationService;
export { xrplTokenizationService as tokenizationService };
