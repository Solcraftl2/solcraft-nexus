export default class CoinGeckoAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async connect() {
    return true;
  }
}
