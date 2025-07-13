/**
 * Test Suite - Wallet Service
 * Test automatici per il servizio wallet integrato con XUMM
 */

import { WalletService } from '../services/walletService.js';

// Mock dei servizi dipendenti
jest.mock('../services/xummService.js', () => ({
  connectWallet: jest.fn(),
  createTokenizationTransaction: jest.fn(),
  checkTransactionStatus: jest.fn(),
  createPayment: jest.fn(),
  getAccountBalance: jest.fn(),
  disconnect: jest.fn()
}));

jest.mock('../services/supabaseService.js', () => ({
  registerWallet: jest.fn(),
  updateWalletBalance: jest.fn(),
  getWallet: jest.fn()
}));

// Mock Crossmark
global.window = {
  crossmark: {
    signIn: jest.fn()
  }
};

import xummService from '../services/xummService.js';
import { registerWallet } from '../services/supabaseService.js';

describe('WalletService', () => {
  let walletService;
  
  beforeEach(() => {
    walletService = new WalletService();
    jest.clearAllMocks();
  });

  describe('Inizializzazione', () => {
    test('dovrebbe inizializzare con stato vuoto', () => {
      expect(walletService.isConnected()).toBe(false);
      expect(walletService.getCurrentAddress()).toBe(null);
      expect(walletService.getWalletType()).toBe(null);
    });

    test('dovrebbe supportare event listeners', () => {
      const mockCallback = jest.fn();
      walletService.on('connected', mockCallback);
      
      walletService.emit('connected', { test: 'data' });
      
      expect(mockCallback).toHaveBeenCalledWith({ test: 'data' });
    });
  });

  describe('Connessione XUMM', () => {
    test('dovrebbe connettere wallet XUMM con successo', async () => {
      const mockXummResult = {
        success: true,
        account: 'rTestAccount123456789',
        userToken: 'test-user-token',
        network: 'mainnet',
        qrCode: 'https://test-qr.png',
        deeplink: 'https://test-deeplink.com'
      };

      xummService.connectWallet.mockResolvedValue(mockXummResult);
      registerWallet.mockResolvedValue({ success: true });

      const result = await walletService.connectWallet('xumm');

      expect(result.success).toBe(true);
      expect(result.address).toBe('rTestAccount123456789');
      expect(result.type).toBe('xumm');
      expect(walletService.isConnected()).toBe(true);
      expect(walletService.getCurrentAddress()).toBe('rTestAccount123456789');
      expect(walletService.getWalletType()).toBe('xumm');
      
      // Verifica registrazione in Supabase
      expect(registerWallet).toHaveBeenCalledWith({
        address: 'rTestAccount123456789',
        type: 'xumm',
        network: 'mainnet',
        userToken: 'test-user-token',
        balance: 0,
        metadata: {
          connectedAt: expect.any(String),
          qrCode: 'https://test-qr.png',
          deeplink: 'https://test-deeplink.com'
        }
      });
    });

    test('dovrebbe gestire errore connessione XUMM', async () => {
      xummService.connectWallet.mockResolvedValue({
        success: false,
        error: 'Connessione rifiutata'
      });

      const result = await walletService.connectWallet('xumm');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connessione rifiutata');
      expect(walletService.isConnected()).toBe(false);
    });

    test('dovrebbe continuare anche se Supabase fallisce', async () => {
      const mockXummResult = {
        success: true,
        account: 'rTestAccount123456789',
        userToken: 'test-token',
        network: 'mainnet'
      };

      xummService.connectWallet.mockResolvedValue(mockXummResult);
      registerWallet.mockRejectedValue(new Error('Database error'));

      const result = await walletService.connectWallet('xumm');

      expect(result.success).toBe(true);
      expect(walletService.isConnected()).toBe(true);
    });
  });

  describe('Connessione Crossmark', () => {
    test('dovrebbe connettere wallet Crossmark', async () => {
      const mockCrossmarkResponse = {
        response: {
          account: 'rCrossmarkAccount123456789'
        }
      };

      window.crossmark.signIn.mockResolvedValue(mockCrossmarkResponse);
      registerWallet.mockResolvedValue({ success: true });

      const result = await walletService.connectWallet('crossmark');

      expect(result.success).toBe(true);
      expect(result.address).toBe('rCrossmarkAccount123456789');
      expect(result.type).toBe('crossmark');
      expect(walletService.getWalletType()).toBe('crossmark');
    });

    test('dovrebbe gestire Crossmark non installato', async () => {
      delete window.crossmark;

      const result = await walletService.connectWallet('crossmark');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Crossmark wallet non installato');
    });
  });

  describe('Gestione Transazioni', () => {
    beforeEach(() => {
      // Setup wallet connesso
      walletService.connectedWallet = 'xumm';
      walletService.userAddress = 'rTestAccount123456789';
      walletService.walletType = 'xumm';
    });

    test('dovrebbe creare transazione tokenizzazione', async () => {
      const tokenData = {
        currencyCode: 'SOL',
        amount: 1000,
        issuer: 'rIssuerTest123'
      };

      const mockTxResult = {
        success: true,
        uuid: 'tx-uuid-123',
        qrCode: 'https://tx-qr.png',
        deeplink: 'https://tx-deeplink.com',
        message: 'Transazione creata'
      };

      xummService.createTokenizationTransaction.mockResolvedValue(mockTxResult);

      const result = await walletService.createTokenizationTransaction(tokenData);

      expect(result.success).toBe(true);
      expect(result.uuid).toBe('tx-uuid-123');
      expect(xummService.createTokenizationTransaction).toHaveBeenCalledWith(tokenData);
    });

    test('dovrebbe fallire se wallet non connesso', async () => {
      walletService.connectedWallet = null;
      walletService.userAddress = null;

      const result = await walletService.createTokenizationTransaction({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Wallet non connesso');
    });

    test('dovrebbe verificare stato transazione', async () => {
      const mockStatus = {
        uuid: 'tx-uuid-123',
        signed: true,
        resolved: true,
        txid: 'test-hash-123'
      };

      xummService.checkTransactionStatus.mockResolvedValue(mockStatus);

      const result = await walletService.checkTransactionStatus('tx-uuid-123');

      expect(result.signed).toBe(true);
      expect(result.txid).toBe('test-hash-123');
    });
  });

  describe('Pagamenti', () => {
    beforeEach(() => {
      walletService.connectedWallet = 'xumm';
      walletService.userAddress = 'rTestAccount123456789';
      walletService.walletType = 'xumm';
    });

    test('dovrebbe creare pagamento', async () => {
      const mockPaymentResult = {
        success: true,
        uuid: 'payment-uuid-123',
        qrCode: 'https://payment-qr.png'
      };

      xummService.createPayment.mockResolvedValue(mockPaymentResult);

      const result = await walletService.createPayment('rDestination123', 10, 'XRP');

      expect(result.success).toBe(true);
      expect(xummService.createPayment).toHaveBeenCalledWith('rDestination123', 10, 'XRP');
    });
  });

  describe('Bilancio', () => {
    beforeEach(() => {
      walletService.connectedWallet = 'xumm';
      walletService.userAddress = 'rTestAccount123456789';
      walletService.walletType = 'xumm';
    });

    test('dovrebbe ottenere bilancio wallet', async () => {
      const mockBalance = {
        balance: '100 XRP',
        tokens: [
          { currency: 'SOL', value: '1000' }
        ]
      };

      xummService.getAccountBalance.mockResolvedValue(mockBalance);

      const result = await walletService.getBalance();

      expect(result.balance).toBe('100 XRP');
      expect(result.tokens).toHaveLength(1);
    });
  });

  describe('Disconnessione', () => {
    test('dovrebbe disconnettere wallet XUMM', async () => {
      walletService.connectedWallet = 'xumm';
      walletService.userAddress = 'rTestAccount123456789';
      walletService.walletType = 'xumm';

      xummService.disconnect.mockReturnValue({ success: true });

      const mockCallback = jest.fn();
      walletService.on('disconnected', mockCallback);

      const result = await walletService.disconnect();

      expect(result.success).toBe(true);
      expect(walletService.isConnected()).toBe(false);
      expect(walletService.getCurrentAddress()).toBe(null);
      expect(mockCallback).toHaveBeenCalledWith({ message: 'Wallet disconnesso' });
    });
  });

  describe('Informazioni Wallet', () => {
    test('dovrebbe restituire informazioni wallet', () => {
      walletService.connectedWallet = 'xumm';
      walletService.userAddress = 'rTestAccount123456789';
      walletService.walletType = 'xumm';
      walletService.authToken = 'test-token';

      const info = walletService.getWalletInfo();

      expect(info.isConnected).toBe(true);
      expect(info.address).toBe('rTestAccount123456789');
      expect(info.type).toBe('xumm');
      expect(info.authToken).toBe('test-token');
    });
  });

  describe('Gestione Errori', () => {
    test('dovrebbe gestire tipo wallet non supportato', async () => {
      await expect(walletService.connectWallet('unsupported')).rejects.toThrow('Tipo wallet non supportato');
    });

    test('dovrebbe emettere evento errore', async () => {
      const mockCallback = jest.fn();
      walletService.on('error', mockCallback);

      xummService.connectWallet.mockRejectedValue(new Error('Test error'));

      await expect(walletService.connectWallet('xumm')).rejects.toThrow('Test error');
      expect(mockCallback).toHaveBeenCalledWith({ error: 'Test error' });
    });
  });
});

// Test di integrazione completa
describe('WalletService - Test Integrazione Completa', () => {
  test('dovrebbe completare flusso completo: connessione → tokenizzazione → verifica', async () => {
    const walletService = new WalletService();
    
    // 1. Connessione
    xummService.connectWallet.mockResolvedValue({
      success: true,
      account: 'rTestAccount123456789',
      userToken: 'test-token',
      network: 'mainnet'
    });
    registerWallet.mockResolvedValue({ success: true });

    const connectResult = await walletService.connectWallet('xumm');
    expect(connectResult.success).toBe(true);

    // 2. Tokenizzazione
    xummService.createTokenizationTransaction.mockResolvedValue({
      success: true,
      uuid: 'tx-uuid-123',
      message: 'Transazione creata'
    });

    const tokenResult = await walletService.createTokenizationTransaction({
      currencyCode: 'SOL',
      amount: 1000
    });
    expect(tokenResult.success).toBe(true);

    // 3. Verifica
    xummService.checkTransactionStatus.mockResolvedValue({
      signed: true,
      resolved: true,
      txid: 'final-hash-123'
    });

    const statusResult = await walletService.checkTransactionStatus('tx-uuid-123');
    expect(statusResult.signed).toBe(true);

    // 4. Disconnessione
    xummService.disconnect.mockReturnValue({ success: true });
    const disconnectResult = await walletService.disconnect();
    expect(disconnectResult.success).toBe(true);
  });
});

