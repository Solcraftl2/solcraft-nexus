import { tokenizationService } from '../../frontend/src/services/xrplTokenizationService.js';
import { Client, Wallet } from 'xrpl';

jest.setTimeout(60000);

describe('XRPL token creation flow', () => {
  test('creates a token on XRPL testnet', async () => {
    const client = new Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();
    const { wallet } = await client.fundWallet();

    process.env.VITE_ISSUER_SECRET = wallet.seed;
    process.env.VITE_ISSUER_ADDRESS = wallet.address;
    process.env.VITE_XRPL_SERVER = 'wss://s.altnet.rippletest.net:51233';

    const token = await tokenizationService.createRealEstateToken({
      name: 'TestAsset',
      symbol: 'TST',
      location: 'Test',
      faceValue: 100,
      totalSupply: 1
    });

    expect(token).toHaveProperty('mptIssuanceId');
    await tokenizationService.disconnect();
    await client.disconnect();
  });
});
