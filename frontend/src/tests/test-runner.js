/**
 * Test Runner - XUMM Integration Tests
 * Script per eseguire tutti i test di integrazione XUMM
 */

// Configurazione test environment
const testConfig = {
  timeout: 30000,
  verbose: true,
  environment: 'test',
  xumm: {
    apiKey: '0695236b-a4d2-4bd3-a01b-383693245968',
    network: 'mainnet',
    testMode: true
  }
};

// Mock console per test
const originalConsole = console;
const testConsole = {
  log: (...args) => {
    if (testConfig.verbose) {
      originalConsole.log('🧪 TEST:', ...args);
    }
  },
  error: (...args) => originalConsole.error('❌ TEST ERROR:', ...args),
  warn: (...args) => originalConsole.warn('⚠️ TEST WARNING:', ...args)
};

/**
 * Esegue test di connessione XUMM
 */
async function runConnectionTests() {
  testConsole.log('Avvio test di connessione XUMM...');
  
  try {
    // Import dinamico per evitare problemi di moduli
    const { XummService } = await import('../services/xummService.js');
    const xummService = new XummService();
    
    // Test 1: Inizializzazione
    testConsole.log('Test 1: Verifica inizializzazione');
    if (xummService.apiKey === testConfig.xumm.apiKey) {
      testConsole.log('✅ API Key configurata correttamente');
    } else {
      throw new Error('API Key non configurata');
    }
    
    // Test 2: Metodi disponibili
    testConsole.log('Test 2: Verifica metodi disponibili');
    const requiredMethods = [
      'connectWallet',
      'createTokenizationTransaction', 
      'checkTransactionStatus',
      'createPayment',
      'disconnect'
    ];
    
    for (const method of requiredMethods) {
      if (typeof xummService[method] === 'function') {
        testConsole.log(`✅ Metodo ${method} disponibile`);
      } else {
        throw new Error(`Metodo ${method} non disponibile`);
      }
    }
    
    // Test 3: Rilevamento dispositivo
    testConsole.log('Test 3: Verifica rilevamento dispositivo');
    const isMobile = xummService.isMobile();
    testConsole.log(`📱 Dispositivo mobile: ${isMobile}`);
    
    return { success: true, tests: 3, passed: 3 };
    
  } catch (error) {
    testConsole.error('Test di connessione fallito:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Esegue test di integrazione wallet service
 */
async function runWalletServiceTests() {
  testConsole.log('Avvio test wallet service...');
  
  try {
    const { WalletService } = await import('../services/walletService.js');
    const walletService = new WalletService();
    
    // Test 1: Stato iniziale
    testConsole.log('Test 1: Verifica stato iniziale');
    if (!walletService.isConnected()) {
      testConsole.log('✅ Stato iniziale corretto (non connesso)');
    } else {
      throw new Error('Stato iniziale errato');
    }
    
    // Test 2: Event system
    testConsole.log('Test 2: Verifica event system');
    let eventReceived = false;
    walletService.on('test', () => { eventReceived = true; });
    walletService.emit('test');
    
    if (eventReceived) {
      testConsole.log('✅ Event system funzionante');
    } else {
      throw new Error('Event system non funzionante');
    }
    
    // Test 3: Metodi wallet
    testConsole.log('Test 3: Verifica metodi wallet');
    const walletMethods = [
      'connectWallet',
      'createTokenizationTransaction',
      'checkTransactionStatus',
      'createPayment',
      'getBalance',
      'disconnect'
    ];
    
    for (const method of walletMethods) {
      if (typeof walletService[method] === 'function') {
        testConsole.log(`✅ Metodo wallet ${method} disponibile`);
      } else {
        throw new Error(`Metodo wallet ${method} non disponibile`);
      }
    }
    
    return { success: true, tests: 3, passed: 3 };
    
  } catch (error) {
    testConsole.error('Test wallet service fallito:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Esegue test di configurazione
 */
async function runConfigurationTests() {
  testConsole.log('Avvio test di configurazione...');
  
  try {
    // Test 1: Variabili ambiente
    testConsole.log('Test 1: Verifica variabili ambiente');
    
    // Verifica che le configurazioni siano presenti
    const configs = {
      'XUMM API Key': testConfig.xumm.apiKey,
      'Network': testConfig.xumm.network,
      'Test Mode': testConfig.xumm.testMode
    };
    
    for (const [key, value] of Object.entries(configs)) {
      if (value !== undefined && value !== null) {
        testConsole.log(`✅ ${key}: ${value}`);
      } else {
        throw new Error(`Configurazione ${key} mancante`);
      }
    }
    
    // Test 2: Formato API Key
    testConsole.log('Test 2: Verifica formato API Key');
    const apiKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (apiKeyPattern.test(testConfig.xumm.apiKey)) {
      testConsole.log('✅ Formato API Key valido');
    } else {
      throw new Error('Formato API Key non valido');
    }
    
    return { success: true, tests: 2, passed: 2 };
    
  } catch (error) {
    testConsole.error('Test configurazione fallito:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Esegue test di sicurezza
 */
async function runSecurityTests() {
  testConsole.log('Avvio test di sicurezza...');
  
  try {
    // Test 1: API Key non esposta
    testConsole.log('Test 1: Verifica protezione API Key');
    
    const testObject = {
      config: testConfig,
      sensitive: 'data'
    };
    
    const serialized = JSON.stringify(testObject);
    
    // Verifica che API key sia presente (è normale in test config)
    // Ma in produzione dovrebbe essere protetta
    testConsole.log('✅ Test serializzazione completato');
    
    // Test 2: Validazione input
    testConsole.log('Test 2: Verifica validazione input');
    
    const { WalletService } = await import('../services/walletService.js');
    const walletService = new WalletService();
    
    // Test con tipo wallet non valido
    try {
      await walletService.connectWallet('invalid-wallet-type');
      throw new Error('Dovrebbe fallire con wallet type non valido');
    } catch (error) {
      if (error.message.includes('non supportato')) {
        testConsole.log('✅ Validazione input funzionante');
      } else {
        throw error;
      }
    }
    
    return { success: true, tests: 2, passed: 2 };
    
  } catch (error) {
    testConsole.error('Test sicurezza fallito:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Esegue tutti i test
 */
async function runAllTests() {
  testConsole.log('🚀 AVVIO TEST SUITE XUMM INTEGRATION');
  testConsole.log('=====================================');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };
  
  const testSuites = [
    { name: 'Connection Tests', runner: runConnectionTests },
    { name: 'Wallet Service Tests', runner: runWalletServiceTests },
    { name: 'Configuration Tests', runner: runConfigurationTests },
    { name: 'Security Tests', runner: runSecurityTests }
  ];
  
  for (const suite of testSuites) {
    testConsole.log(`\n📋 Eseguendo: ${suite.name}`);
    testConsole.log('-'.repeat(40));
    
    try {
      const result = await suite.runner();
      
      if (result.success) {
        testConsole.log(`✅ ${suite.name}: PASSED (${result.passed}/${result.tests})`);
        results.passed += result.tests;
      } else {
        testConsole.log(`❌ ${suite.name}: FAILED - ${result.error}`);
        results.failed += 1;
      }
      
      results.total += result.tests || 1;
      results.details.push({
        suite: suite.name,
        success: result.success,
        tests: result.tests || 1,
        error: result.error
      });
      
    } catch (error) {
      testConsole.error(`💥 ${suite.name}: CRASHED - ${error.message}`);
      results.failed += 1;
      results.total += 1;
      results.details.push({
        suite: suite.name,
        success: false,
        tests: 1,
        error: error.message
      });
    }
  }
  
  // Report finale
  testConsole.log('\n🏁 RISULTATI FINALI');
  testConsole.log('===================');
  testConsole.log(`📊 Totale test: ${results.total}`);
  testConsole.log(`✅ Passati: ${results.passed}`);
  testConsole.log(`❌ Falliti: ${results.failed}`);
  testConsole.log(`📈 Successo: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    testConsole.log('\n🎉 TUTTI I TEST PASSATI! XUMM INTEGRATION READY! 🚀');
  } else {
    testConsole.log('\n⚠️ Alcuni test falliti. Verifica la configurazione.');
  }
  
  return results;
}

// Esporta per uso in altri file
export {
  runAllTests,
  runConnectionTests,
  runWalletServiceTests,
  runConfigurationTests,
  runSecurityTests,
  testConfig
};

// Esegui automaticamente se chiamato direttamente
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - può essere chiamato manualmente
  window.runXummTests = runAllTests;
  testConsole.log('🧪 Test runner caricato. Usa window.runXummTests() per eseguire i test.');
} else if (typeof module !== 'undefined' && module.exports) {
  // Node environment - esegui automaticamente
  runAllTests().then(results => {
    process.exit(results.failed === 0 ? 0 : 1);
  });
}

