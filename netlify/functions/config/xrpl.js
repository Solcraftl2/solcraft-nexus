import { createReqRes } from './requestWrapper.js';
import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

// Configurazione XRPL
const XRPL_CONFIG = {
  // Testnet per sviluppo
  TESTNET: {
    server: 'wss://s.altnet.rippletest.net:51233',
    faucet: 'https://faucet.altnet.rippletest.net/accounts'
  },
  
  // Mainnet per produzione
  MAINNET: {
    server: 'wss://xrplcluster.com'
  },
  
  // Configurazione corrente (usa Testnet per sviluppo)
  current: process.env.NODE_ENV === 'production' ? 'MAINNET' : 'TESTNET'
};

// Client XRPL globale
let xrplClient = null;

/**
 * Inizializza connessione XRPL
 */
export async function initializeXRPL() {
  try {
    const config = XRPL_CONFIG[XRPL_CONFIG.current];
    xrplClient = new Client(config.server);
    
    await xrplClient.connect();
    console.log(`✅ Connesso a XRPL ${XRPL_CONFIG.current}: ${config.server}`);
    
    return xrplClient;
  } catch (error) {
    console.error('❌ Errore connessione XRPL:', error);
    throw error;
  }
}

/**
 * Ottieni client XRPL
 */
export function getXRPLClient() {
  if (!xrplClient || !xrplClient.isConnected()) {
    throw new Error('Client XRPL non connesso. Chiamare initializeXRPL() prima.');
  }
  return xrplClient;
}

/**
 * Disconnetti client XRPL
 */
export async function disconnectXRPL() {
  if (xrplClient && xrplClient.isConnected()) {
    await xrplClient.disconnect();
    console.log('🔌 Disconnesso da XRPL');
  }
}

/**
 * Crea nuovo wallet XRPL
 */
export function createWallet() {
  return Wallet.generate();
}

/**
 * Crea wallet da seed
 */
export function walletFromSeed(seed) {
  return Wallet.fromSeed(seed);
}

/**
 * Finanzia account su Testnet
 */
export async function fundTestnetAccount(address) {
  if (XRPL_CONFIG.current !== 'TESTNET') {
    throw new Error('Funding disponibile solo su Testnet');
  }
  
  try {
    const response = await fetch(XRPL_CONFIG.TESTNET.faucet, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: address
      })
    });
    
    if (!response.ok) {
      throw new Error(`Errore funding: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Errore funding account:', error);
    throw error;
  }
}

/**
 * Ottieni informazioni account
 */
export async function getAccountInfo(address) {
  const client = getXRPLClient();
  
  try {
    const response = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated'
    });
    
    return response.result.account_data;
  } catch (error) {
    if (error.data?.error === 'actNotFound') {
      return null; // Account non esiste
    }
    throw error;
  }
}

/**
 * Ottieni bilancio account
 */
export async function getAccountBalance(address) {
  const accountInfo = await getAccountInfo(address);
  
  if (!accountInfo) {
    return {
      xrp: '0',
      tokens: []
    };
  }
  
  // Bilancio XRP
  const xrpBalance = dropsToXrp(accountInfo.Balance);
  
  // Ottieni token (trust lines)
  const client = getXRPLClient();
  const linesResponse = await client.request({
    command: 'account_lines',
    account: address,
    ledger_index: 'validated'
  });
  
  const tokens = linesResponse.result.lines.map(line => ({
    currency: line.currency,
    issuer: line.account,
    balance: line.balance,
    limit: line.limit
  }));
  
  return {
    xrp: xrpBalance,
    tokens: tokens,
    reserve: dropsToXrp(accountInfo.OwnerCount * 2000000 + 1000000) // Base reserve + Owner reserve
  };
}

/**
 * Invia pagamento XRP
 */
export async function sendXRPPayment(fromWallet, toAddress, amount, memo = null) {
  const client = getXRPLClient();
  
  const payment = {
    TransactionType: 'Payment',
    Account: fromWallet.address,
    Destination: toAddress,
    Amount: xrpToDrops(amount.toString())
  };
  
  // Aggiungi memo se fornito
  if (memo) {
    payment.Memos = [{
      Memo: {
        MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase()
      }
    }];
  }
  
  try {
    const prepared = await client.autofill(payment);
    const signed = fromWallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    return {
      success: true,
      hash: result.result.hash,
      validated: result.result.validated,
      meta: result.result.meta
    };
  } catch (error) {
    console.error('❌ Errore invio pagamento:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Crea trust line per token
 */
export async function createTrustLine(wallet, currency, issuer, limit = '1000000000') {
  const client = getXRPLClient();
  
  const trustSet = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: {
      currency: currency,
      issuer: issuer,
      value: limit
    }
  };
  
  try {
    const prepared = await client.autofill(trustSet);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    return {
      success: true,
      hash: result.result.hash,
      validated: result.result.validated
    };
  } catch (error) {
    console.error('❌ Errore creazione trust line:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Ottieni storico transazioni
 */
export async function getAccountTransactions(address, limit = 20) {
  const client = getXRPLClient();
  
  try {
    const response = await client.request({
      command: 'account_tx',
      account: address,
      limit: limit,
      ledger_index_min: -1,
      ledger_index_max: -1
    });
    
    return response.result.transactions.map(tx => ({
      hash: tx.tx.hash,
      type: tx.tx.TransactionType,
      account: tx.tx.Account,
      destination: tx.tx.Destination,
      amount: tx.tx.Amount,
      fee: tx.tx.Fee,
      sequence: tx.tx.Sequence,
      date: tx.tx.date,
      validated: tx.validated,
      meta: tx.meta
    }));
  } catch (error) {
    console.error('❌ Errore recupero transazioni:', error);
    throw error;
  }
}

// Utility functions
export { xrpToDrops, dropsToXrp };

export default {
  initializeXRPL,
  getXRPLClient,
  disconnectXRPL,
  createWallet,
  walletFromSeed,
  fundTestnetAccount,
  getAccountInfo,
  getAccountBalance,
  sendXRPPayment,
  createTrustLine,
  getAccountTransactions,
  xrpToDrops,
  dropsToXrp
};

