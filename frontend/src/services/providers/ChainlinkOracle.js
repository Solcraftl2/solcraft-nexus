export default class ChainlinkOracle {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async connect() {
    return true;
  }
}
