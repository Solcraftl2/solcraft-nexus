import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client, Wallet } from 'xrpl';

const TESTNET = 'wss://s.altnet.rippletest.net:51233';

test('MPTCreate transaction on XRPL Testnet', async () => {
  const client = new Client(TESTNET);
  await client.connect();
  const { wallet } = await client.fundWallet();
  const tx = {
    TransactionType: 'MPTokenIssuanceCreate',
    Account: wallet.address,
    MPTokenMetadata: Buffer.from('{}').toString('hex').toUpperCase(),
    MaximumAmount: '1'
  };
  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  assert.equal(result.result.meta.TransactionResult, 'tesSUCCESS');
  await client.disconnect();
});
