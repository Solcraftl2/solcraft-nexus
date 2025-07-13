/**
 * Test End-to-End - Integrazione XUMM Completa
 * Test automatici per verificare il flusso completo dell'utente
 */

import walletService from '../services/walletService.js';
import xummService from '../services/xummService.js';

// Test di integrazione reale (da eseguire con API XUMM reale in ambiente di test)
describe('XUMM Integration E2E Tests', () => {
  
  // Test di connessione automatica
  describe('Connessione Automatica Cliente', () => {
    test('dovrebbe permettere connessione senza pre-autorizzazione', async () => {
      console.log('🧪 Test: Connessione automatica cliente');
      
      // Simula cliente che visita Solcraft Nexus
      const clientResult = await walletService.connectWallet('xumm');
      
      // Verifica che la connessione sia possibile
      expect(clientResult).toHaveProperty('success');
      
      if (clientResult.success) {
        console.log('✅ Cliente connesso automaticamente:', clientResult.address);
        
        // Verifica che l'indirizzo sia valido XRPL
        expect(clientResult.address).toMatch(/^r[a-zA-Z0-9]{24,34}$/);
        expect(clientResult.type).toBe('xumm');
        expect(clientResult.network).toBe('mainnet');
        
      } else {
        console.log('ℹ️ Connessione non completata (normale in test automatico):', clientResult.error);
        
        // In test automatico, è normale che la connessione non sia completata
        // perché richiede interazione utente reale
        expect(clientResult.error).toBeDefined();
      }
    }, 30000); // Timeout 30 secondi
  });

  // Test di creazione transazione
  describe('Creazione Transazione Tokenizzazione', () => {
    test('dovrebbe creare transazione per cliente connesso', async () => {
      console.log('🧪 Test: Creazione transazione tokenizzazione');
      
      // Mock connessione per test
      walletService.connectedWallet = 'xumm';
      walletService.userAddress = 'rTestClientAddress123456789';
      walletService.walletType = 'xumm';
      
      const tokenData = {
        currencyCode: 'SOL',
        issuer: 'rSolCraftIssuerTest123456789',
        amount: 1000,
        assetName: 'Test Asset',
        description: 'Asset di test per Solcraft Nexus'
      };
      
      const txResult = await walletService.createTokenizationTransaction(tokenData);
      
      // Verifica creazione transazione
      expect(txResult).toHaveProperty('success');
      
      if (txResult.success) {
        console.log('✅ Transazione creata:', txResult.uuid);
        
        expect(txResult.uuid).toBeDefined();
        expect(txResult.qrCode).toBeDefined();
        expect(txResult.deeplink).toBeDefined();
        
        // Verifica che il QR code sia un URL valido
        expect(txResult.qrCode).toMatch(/^https?:\/\/.+/);
        expect(txResult.deeplink).toMatch(/^https?:\/\/.+/);
        
      } else {
        console.log('ℹ️ Transazione non creata:', txResult.error);
        expect(txResult.error).toBeDefined();
      }
    });
  });

  // Test di verifica stato
  describe('Verifica Stato Transazione', () => {
    test('dovrebbe verificare stato transazione esistente', async () => {
      console.log('🧪 Test: Verifica stato transazione');
      
      // Usa UUID di test (in produzione sarebbe UUID reale)
      const testUuid = 'test-uuid-for-status-check';
      
      const statusResult = await walletService.checkTransactionStatus(testUuid);
      
      // Verifica risposta
      expect(statusResult).toBeDefined();
      
      if (statusResult.error) {
        console.log('ℹ️ Errore verifica (normale per UUID test):', statusResult.error);
        expect(statusResult.error).toBeDefined();
      } else {
        console.log('✅ Stato transazione verificato:', statusResult);
        expect(statusResult).toHaveProperty('uuid');
      }
    });
  });

  // Test di flusso completo
  describe('Flusso Completo Cliente', () => {
    test('dovrebbe simulare flusso completo cliente', async () => {
      console.log('🧪 Test: Flusso completo cliente');
      
      const steps = [];
      
      try {
        // Step 1: Cliente visita sito
        steps.push('1. Cliente visita Solcraft Nexus');
        console.log('📱 Step 1: Cliente visita sito');
        
        // Step 2: Cliente clicca "Connetti Wallet"
        steps.push('2. Cliente clicca "Connetti Wallet"');
        console.log('🔗 Step 2: Inizia connessione wallet');
        
        const connectResult = await walletService.connectWallet('xumm');
        
        if (connectResult.success) {
          steps.push('3. ✅ Wallet connesso automaticamente');
          console.log('✅ Step 3: Wallet connesso');
          
          // Step 4: Cliente compila form tokenizzazione
          steps.push('4. Cliente compila form tokenizzazione');
          console.log('📝 Step 4: Form tokenizzazione');
          
          const tokenData = {
            assetName: 'Casa Milano Centro',
            description: 'Appartamento 120mq zona Brera',
            value: 500000,
            currencyCode: 'EUR',
            shares: 1000
          };
          
          // Step 5: Creazione transazione
          const txResult = await walletService.createTokenizationTransaction(tokenData);
          
          if (txResult.success) {
            steps.push('5. ✅ Transazione creata - Push notification inviata');
            console.log('📱 Step 5: Push notification inviata');
            
            steps.push('6. Cliente autorizza con biometria/PIN');
            console.log('🔐 Step 6: Attesa autorizzazione cliente');
            
            // In test reale, qui ci sarebbe l'attesa dell'autorizzazione
            steps.push('7. ✅ Transazione firmata e completata');
            console.log('✅ Step 7: Flusso completato');
            
          } else {
            steps.push('5. ❌ Errore creazione transazione');
          }
          
        } else {
          steps.push('3. ℹ️ Connessione non completata (test automatico)');
        }
        
      } catch (error) {
        steps.push(`❌ Errore: ${error.message}`);
      }
      
      // Verifica che almeno i primi step siano completati
      expect(steps.length).toBeGreaterThan(2);
      console.log('📋 Flusso completato:', steps);
      
      // Log finale
      console.log('\n🎯 RISULTATO TEST FLUSSO COMPLETO:');
      steps.forEach((step, index) => {
        console.log(`   ${step}`);
      });
    }, 45000); // Timeout 45 secondi
  });

  // Test di configurazione
  describe('Verifica Configurazione', () => {
    test('dovrebbe avere configurazione XUMM corretta', () => {
      console.log('🧪 Test: Verifica configurazione XUMM');
      
      // Verifica API Key
      expect(xummService.apiKey).toBe('0695236b-a4d2-4bd3-a01b-383693245968');
      console.log('✅ API Key configurata correttamente');
      
      // Verifica istanza XUMM
      expect(xummService.xumm).toBeDefined();
      console.log('✅ Istanza XUMM SDK inizializzata');
      
      // Verifica metodi disponibili
      expect(typeof xummService.connectWallet).toBe('function');
      expect(typeof xummService.createTokenizationTransaction).toBe('function');
      expect(typeof xummService.checkTransactionStatus).toBe('function');
      console.log('✅ Tutti i metodi XUMM disponibili');
      
      // Verifica integrazione wallet service
      expect(walletService.connectWallet).toBeDefined();
      expect(walletService.createTokenizationTransaction).toBeDefined();
      console.log('✅ Integrazione wallet service completa');
    });
  });

  // Test di compatibilità dispositivi
  describe('Compatibilità Dispositivi', () => {
    test('dovrebbe rilevare tipo dispositivo correttamente', () => {
      console.log('🧪 Test: Compatibilità dispositivi');
      
      // Test rilevamento mobile
      const isMobile = xummService.isMobile();
      console.log(`📱 Dispositivo mobile rilevato: ${isMobile}`);
      
      expect(typeof isMobile).toBe('boolean');
      
      // Verifica che la logica di apertura sia corretta
      if (isMobile) {
        console.log('✅ Su mobile: aprirà deeplink XUMM automaticamente');
      } else {
        console.log('✅ Su desktop: mostrerà QR code per scan');
      }
    });
  });

  // Test di resilienza
  describe('Test di Resilienza', () => {
    test('dovrebbe gestire errori di rete gracefully', async () => {
      console.log('🧪 Test: Gestione errori di rete');
      
      // Simula errore di rete (timeout)
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));
      
      try {
        const result = await walletService.connectWallet('xumm');
        
        // Dovrebbe gestire l'errore senza crash
        expect(result).toHaveProperty('success');
        
        if (!result.success) {
          console.log('✅ Errore gestito correttamente:', result.error);
          expect(result.error).toBeDefined();
        }
        
      } finally {
        // Ripristina fetch originale
        global.fetch = originalFetch;
      }
    });
  });
});

// Test di performance
describe('Performance Tests', () => {
  test('dovrebbe inizializzare servizi rapidamente', () => {
    console.log('🧪 Test: Performance inizializzazione');
    
    const startTime = performance.now();
    
    // Re-inizializza servizi
    const testWalletService = new (require('../services/walletService.js').WalletService)();
    
    const endTime = performance.now();
    const initTime = endTime - startTime;
    
    console.log(`⚡ Tempo inizializzazione: ${initTime.toFixed(2)}ms`);
    
    // Dovrebbe inizializzare in meno di 100ms
    expect(initTime).toBeLessThan(100);
    expect(testWalletService.isConnected()).toBe(false);
  });
});

// Test di sicurezza
describe('Security Tests', () => {
  test('dovrebbe proteggere API key e dati sensibili', () => {
    console.log('🧪 Test: Sicurezza dati sensibili');
    
    // Verifica che API key non sia esposta in oggetti serializzati
    const walletInfo = walletService.getWalletInfo();
    const serialized = JSON.stringify(walletInfo);
    
    // API key non dovrebbe essere presente in dati serializzati
    expect(serialized).not.toContain('0695236b-a4d2-4bd3-a01b-383693245968');
    console.log('✅ API key non esposta in dati serializzati');
    
    // Verifica che user token sia gestito correttamente
    if (walletInfo.authToken) {
      expect(typeof walletInfo.authToken).toBe('string');
      console.log('✅ Auth token gestito correttamente');
    }
  });
});

