const assert = require('assert');
const {
  initializeXRPL,
  disconnectXRPL,
  createWallet,
  createTrustLine,
  sendXRPPayment,
  walletFromSeed
} = require('../api/config/xrpl.js');

(async () => {
  try {
    await initializeXRPL();
    const client = require('../api/config/xrpl.js').getXRPLClient();

    // Create issuer and distribution wallets
    const issuer = await client.fundWallet();
    const distributor = await client.fundWallet();

    const issuerWallet = walletFromSeed(issuer.wallet.seed);
    const distWallet = walletFromSeed(distributor.wallet.seed);

    // Create trust line
    const trustRes = await createTrustLine(
      distWallet,
      'TST',
      issuerWallet.address,
      '1000'
    );
    assert.ok(trustRes.hash);

    // Issue token payment
    const payRes = await sendXRPPayment(
      issuerWallet,
      distWallet.address,
      { currency: 'TST', issuer: issuerWallet.address, value: '1000' }
    );
    assert.ok(payRes.hash);

    console.log('Test completed successfully');
    await disconnectXRPL();
    process.exit(0);
  } catch (err) {
    console.error(err);
    await disconnectXRPL().catch(() => {});
    process.exit(1);
  }
})();
