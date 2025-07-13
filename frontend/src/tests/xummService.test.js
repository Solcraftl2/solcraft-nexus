/**
 * Test Suite - XUMM Service
 * Test automatici per verificare la connessione e le funzionalità XUMM
 */

import { XummService } from '../services/xummService.js';

// Mock del DOM per test
global.window = {
  open: jest.fn(),
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

// Mock di XUMM SDK
jest.mock('xumm-sdk', () => {
  return {
    Xumm: jest.fn().mockImplementation(() => ({
      payload: {
        create: jest.fn(),
        subscribe: jest.fn(),
        get: jest.fn()
      }
    }))
  };
});

describe('XummService', () => {
  let xummService;
  
  beforeEach(() => {
    xummService = new XummService();
    jest.clearAllMocks();
  });

  describe('Inizializzazione', () => {
    test('dovrebbe inizializzare con API Key corretta', () => {
      expect(xummService.apiKey).toBe('0695236b-a4d2-4bd3-a01b-383693245968');
      expect(xummService.isConnected).toBe(false);
      expect(xummService.currentAccount).toBe(null);
    });

    test('dovrebbe creare istanza XUMM SDK', () => {
      expect(xummService.xumm).toBeDefined();
    });
  });

  describe('Connessione Wallet', () => {
    test('dovrebbe creare payload di connessione corretto', async () => {
      // Mock payload response
      const mockPayload = {
        uuid: 'test-uuid-123',
        refs: { qr_png: 'https://test-qr.png' },
        next: { always: 'https://test-deeplink.com' }
      };

      const mockSubscribeResult = {
        account: 'rTestAccount123456789',
        user_token: 'test-user-token-123'
      };

      xummService.xumm.payload.create.mockResolvedValue(mockPayload);
      xummService.xumm.payload.subscribe.mockImplementation((uuid, callback) => {
        // Simula evento di firma
        const event = { data: { signed: true } };
        callback(event);
        return Promise.resolve(mockSubscribeResult);
      });

      const result = await xummService.connectWallet();

      expect(result.success).toBe(true);
      expect(result.account).toBe('rTestAccount123456789');
      expect(result.userToken).toBe('test-user-token-123');
      expect(xummService.isConnected).toBe(true);
    });

    test('dovrebbe gestire rifiuto connessione', async () => {
      const mockPayload = {
        uuid: 'test-uuid-123',
        refs: { qr_png: 'https://test-qr.png' },
        next: { always: 'https://test-deeplink.com' }
      };

      xummService.xumm.payload.create.mockResolvedValue(mockPayload);
      xummService.xumm.payload.subscribe.mockImplementation((uuid, callback) => {
        // Simula rifiuto
        const event = { data: { signed: false } };
        callback(event);
        return Promise.reject(new Error('Connessione rifiutata dall\'utente'));
      });

      const result = await xummService.connectWallet();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connessione rifiutata');
      expect(xummService.isConnected).toBe(false);
    });

    test('dovrebbe aprire deeplink su mobile', async () => {
      // Mock mobile user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      const mockPayload = {
        uuid: 'test-uuid-123',
        refs: { qr_png: 'https://test-qr.png' },
        next: { always: 'https://test-deeplink.com' }
      };

      xummService.xumm.payload.create.mockResolvedValue(mockPayload);
      xummService.xumm.payload.subscribe.mockResolvedValue({
        account: 'rTestAccount123456789',
        user_token: 'test-token'
      });

      await xummService.connectWallet();

      expect(window.open).toHaveBeenCalledWith('https://test-deeplink.com', '_blank');
    });
  });

  describe('Creazione Transazioni', () => {
    beforeEach(() => {
      // Setup connessione mock
      xummService.isConnected = true;
      xummService.currentAccount = 'rTestAccount123456789';
    });

    test('dovrebbe creare transazione tokenizzazione', async () => {
      const tokenData = {
        currencyCode: 'SOL',
        issuer: 'rIssuerTest123456789',
        amount: 1000
      };

      const mockPayload = {
        uuid: 'token-uuid-123',
        refs: { qr_png: 'https://token-qr.png' },
        next: { always: 'https://token-deeplink.com' }
      };

      xummService.xumm.payload.create.mockResolvedValue(mockPayload);

      const result = await xummService.createTokenizationTransaction(tokenData);

      expect(result.success).toBe(true);
      expect(result.uuid).toBe('token-uuid-123');
      expect(xummService.xumm.payload.create).toHaveBeenCalledWith({
        txjson: {
          TransactionType: 'TrustSet',
          Account: 'rTestAccount123456789',
          LimitAmount: {
            currency: 'SOL',
            issuer: 'rIssuerTest123456789',
            value: '1000'
          }
        },
        options: {
          submit: true,
          expire: 10,
          return_url: {
            app: 'https://solcraft-nexus.vercel.app/dashboard?token=created',
            web: 'https://solcraft-nexus.vercel.app/dashboard?token=created'
          }
        }
      });
    });

    test('dovrebbe fallire se wallet non connesso', async () => {
      xummService.isConnected = false;
      xummService.currentAccount = null;

      const result = await xummService.createTokenizationTransaction({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Wallet non connesso');
    });
  });

  describe('Verifica Transazioni', () => {
    test('dovrebbe verificare stato transazione', async () => {
      const mockTransactionData = {
        meta: {
          signed: true,
          resolved: true,
          resolved_at: '2024-01-01T12:00:00Z'
        },
        response: {
          txid: 'test-tx-hash-123',
          account: 'rTestAccount123456789'
        }
      };

      xummService.xumm.payload.get.mockResolvedValue(mockTransactionData);

      const result = await xummService.checkTransactionStatus('test-uuid');

      expect(result.signed).toBe(true);
      expect(result.resolved).toBe(true);
      expect(result.txid).toBe('test-tx-hash-123');
    });
  });

  describe('Pagamenti', () => {
    beforeEach(() => {
      xummService.isConnected = true;
      xummService.currentAccount = 'rTestAccount123456789';
    });

    test('dovrebbe creare pagamento XRP', async () => {
      const mockPayload = {
        uuid: 'payment-uuid-123',
        refs: { qr_png: 'https://payment-qr.png' },
        next: { always: 'https://payment-deeplink.com' }
      };

      xummService.xumm.payload.create.mockResolvedValue(mockPayload);

      const result = await xummService.createPayment('rDestination123', 10, 'XRP');

      expect(result.success).toBe(true);
      expect(xummService.xumm.payload.create).toHaveBeenCalledWith({
        txjson: {
          TransactionType: 'Payment',
          Account: 'rTestAccount123456789',
          Destination: 'rDestination123',
          Amount: '10000000' // 10 XRP in drops
        },
        options: {
          submit: true,
          expire: 10
        }
      });
    });

    test('dovrebbe creare pagamento token', async () => {
      const mockPayload = {
        uuid: 'token-payment-uuid-123',
        refs: { qr_png: 'https://token-payment-qr.png' },
        next: { always: 'https://token-payment-deeplink.com' }
      };

      xummService.xumm.payload.create.mockResolvedValue(mockPayload);

      const result = await xummService.createPayment('rDestination123', 100, 'SOL');

      expect(result.success).toBe(true);
      expect(xummService.xumm.payload.create).toHaveBeenCalledWith({
        txjson: {
          TransactionType: 'Payment',
          Account: 'rTestAccount123456789',
          Destination: 'rDestination123',
          Amount: {
            currency: 'SOL',
            issuer: 'rIssuerAddressHere',
            value: '100'
          }
        },
        options: {
          submit: true,
          expire: 10
        }
      });
    });
  });

  describe('Disconnessione', () => {
    test('dovrebbe disconnettere wallet', () => {
      xummService.isConnected = true;
      xummService.currentAccount = 'rTestAccount123456789';
      xummService.userToken = 'test-token';

      const result = xummService.disconnect();

      expect(result.success).toBe(true);
      expect(xummService.isConnected).toBe(false);
      expect(xummService.currentAccount).toBe(null);
      expect(xummService.userToken).toBe(null);
    });
  });

  describe('Utilità', () => {
    test('dovrebbe rilevare dispositivo mobile', () => {
      // Test desktop
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });
      expect(xummService.isMobile()).toBe(false);

      // Test mobile
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      expect(xummService.isMobile()).toBe(true);
    });

    test('dovrebbe restituire informazioni account', () => {
      xummService.isConnected = true;
      xummService.currentAccount = 'rTestAccount123456789';
      xummService.userToken = 'test-token';

      const info = xummService.getAccountInfo();

      expect(info.isConnected).toBe(true);
      expect(info.account).toBe('rTestAccount123456789');
      expect(info.userToken).toBe('test-token');
      expect(info.network).toBe('mainnet');
    });
  });
});

// Test di integrazione
describe('XummService - Test Integrazione', () => {
  test('dovrebbe completare flusso completo connessione + transazione', async () => {
    const xummService = new XummService();
    
    // Mock connessione
    xummService.xumm.payload.create
      .mockResolvedValueOnce({
        uuid: 'connect-uuid',
        refs: { qr_png: 'connect-qr' },
        next: { always: 'connect-deeplink' }
      })
      .mockResolvedValueOnce({
        uuid: 'tx-uuid',
        refs: { qr_png: 'tx-qr' },
        next: { always: 'tx-deeplink' }
      });

    xummService.xumm.payload.subscribe.mockResolvedValue({
      account: 'rTestAccount123456789',
      user_token: 'test-token'
    });

    // 1. Connessione
    const connectResult = await xummService.connectWallet();
    expect(connectResult.success).toBe(true);

    // 2. Transazione
    const txResult = await xummService.createTokenizationTransaction({
      currencyCode: 'SOL',
      amount: 1000
    });
    expect(txResult.success).toBe(true);

    // 3. Verifica stato
    xummService.xumm.payload.get.mockResolvedValue({
      meta: { signed: true, resolved: true },
      response: { txid: 'test-hash' }
    });

    const statusResult = await xummService.checkTransactionStatus('tx-uuid');
    expect(statusResult.signed).toBe(true);
  });
});

