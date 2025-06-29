/* eslint-env node */
/* global Buffer, process */
import { Client, Wallet } from 'xrpl'

const DEFAULT_SERVER = process.env.XRPL_SERVER || process.env.XRPL_TESTNET_URL || 'wss://s.altnet.rippletest.net:51233'
const DEFAULT_ISSUER_SECRET = process.env.XRPL_ISSUER_SECRET

export async function issueMPT({ issuerSeed = DEFAULT_ISSUER_SECRET, metadata, maximumAmount, transferFee = 0, flags = 0, assetScale = 0 }) {
  if (!issuerSeed) {
    throw new Error('Issuer seed not provided')
  }
  if (!metadata) {
    throw new Error('Metadata is required')
  }

  const client = new Client(DEFAULT_SERVER)
  try {
    await client.connect()
    const wallet = Wallet.fromSeed(issuerSeed)
    const metadataString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    const metadataHex = Buffer.from(metadataString).toString('hex').toUpperCase()

    const tx = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: wallet.address,
      MPTokenMetadata: metadataHex
    }

    if (maximumAmount) tx.MaximumAmount = maximumAmount.toString()
    if (transferFee > 0) tx.TransferFee = transferFee
    if (flags > 0) tx.Flags = flags
    if (assetScale > 0) tx.AssetScale = assetScale

    const prepared = await client.autofill(tx)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    let mptId = null
    if (result.result.meta && result.result.meta.CreatedNode) {
      const createdNodes = Array.isArray(result.result.meta.CreatedNode)
        ? result.result.meta.CreatedNode
        : [result.result.meta.CreatedNode]
      for (const node of createdNodes) {
        if (node.NewFields && node.NewFields.MPTokenID) {
          mptId = node.NewFields.MPTokenID
          break
        }
      }
    }
    if (!mptId && result.result.meta && result.result.meta.AffectedNodes) {
      for (const node of result.result.meta.AffectedNodes) {
        if (node.CreatedNode && node.CreatedNode.NewFields && node.CreatedNode.NewFields.MPTokenID) {
          mptId = node.CreatedNode.NewFields.MPTokenID
          break
        }
      }
    }

    return {
      success: result.result.meta.TransactionResult === 'tesSUCCESS',
      mptId,
      transactionHash: result.result.hash,
      ledgerIndex: result.result.ledger_index,
      fee: prepared.Fee,
      sequence: prepared.Sequence,
      validated: result.result.validated,
      issuer: wallet.address
    }
  } finally {
    if (client.isConnected()) {
      await client.disconnect()
    }
  }
}
