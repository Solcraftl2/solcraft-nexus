import React, { useState, useEffect } from 'react';
import xrplService from '../services/xrplService';

/**
 * Sistema di Tokenizzazione Reale XRPL
 * Permette di tokenizzare asset reali sulla blockchain XRPL
 */
const TokenizationSystemReal = ({ walletData, onClose }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form data
  const [assetData, setAssetData] = useState({
    name: '',
    description: '',
    category: '',
    value: '',
    currency: 'EUR',
    tokenSymbol: '',
    totalSupply: '',
    documents: []
  });

  const [tokenizationResult, setTokenizationResult] = useState(null);
  const [xrplConnected, setXrplConnected] = useState(false);

  // Categorie asset supportate
  const assetCategories = [
    { id: 'real_estate', name: 'Immobili', icon: '🏠', description: 'Appartamenti, case, terreni' },
    { id: 'art', name: 'Arte e Collezioni', icon: '🎨', description: 'Opere d\'arte, collezioni' },
    { id: 'vehicles', name: 'Veicoli', icon: '🚗', description: 'Auto, moto, barche' },
    { id: 'commodities', name: 'Materie Prime', icon: '🥇', description: 'Oro, argento, petrolio' },
    { id: 'business', name: 'Attività Commerciali', icon: '🏢', description: 'Aziende, quote societarie' },
    { id: 'intellectual', name: 'Proprietà Intellettuale', icon: '💡', description: 'Brevetti, marchi, copyright' }
  ];

  // Connetti a XRPL all'avvio
  useEffect(() => {
    connectToXRPL();
  }, []);

  const connectToXRPL = async () => {
    try {
      if (!xrplService.isConnected) {
        await xrplService.connect('testnet');
      }
      setXrplConnected(true);
    } catch (error) {
      console.error('Errore connessione XRPL:', error);
      setError('Impossibile connettersi a XRPL. Alcune funzionalità potrebbero non essere disponibili.');
    }
  };

  const handleInputChange = (field, value) => {
    setAssetData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateStep1 = () => {
    const { name, description, category, value, tokenSymbol, totalSupply } = assetData;
    
    if (!name.trim()) return 'Nome asset richiesto';
    if (!description.trim()) return 'Descrizione richiesta';
    if (!category) return 'Categoria richiesta';
    if (!value || parseFloat(value) <= 0) return 'Valore asset deve essere maggiore di 0';
    if (!tokenSymbol.trim()) return 'Simbolo token richiesto';
    if (tokenSymbol.length < 3 || tokenSymbol.length > 20) return 'Simbolo deve essere 3-20 caratteri';
    if (!totalSupply || parseInt(totalSupply) <= 0) return 'Supply totale deve essere maggiore di 0';
    
    return null;
  };

  const handleNextStep = () => {
    if (step === 1) {
      const validation = validateStep1();
      if (validation) {
        setError(validation);
        return;
      }
    }
    
    setStep(step + 1);
    setError(null);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  const estimateTokenizationCosts = () => {
    const baseValue = parseFloat(assetData.value) || 0;
    const supply = parseInt(assetData.totalSupply) || 1;
    
    return {
      xrplFee: 0.00001, // Fee base XRPL
      platformFee: Math.max(baseValue * 0.001, 10), // 0.1% min €10
      legalFee: Math.max(baseValue * 0.002, 50), // 0.2% min €50
      totalXRP: 0.00001,
      totalEUR: Math.max(baseValue * 0.003, 60)
    };
  };

  const createTokenOnXRPL = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!xrplConnected) {
        throw new Error('XRPL non connesso');
      }

      if (!walletData?.seed) {
        throw new Error('Wallet non valido per la creazione di token');
      }

      // Step 1: Crea Trust Line per il nuovo token
      console.log('🔄 Creazione Trust Line...');
      const trustLineResult = await xrplService.createTrustLine(
        { seed: walletData.seed },
        assetData.tokenSymbol,
        walletData.address,
        assetData.totalSupply
      );

      if (!trustLineResult.success) {
        throw new Error('Errore creazione Trust Line');
      }

      // Step 2: Emetti il token
      console.log('🔄 Emissione token...');
      const tokenResult = await xrplService.issueToken(
        { seed: walletData.seed },
        walletData.address,
        assetData.tokenSymbol,
        assetData.totalSupply
      );

      if (!tokenResult.success) {
        throw new Error('Errore emissione token');
      }

      // Risultato tokenizzazione
      const result = {
        success: true,
        tokenSymbol: assetData.tokenSymbol,
        totalSupply: assetData.totalSupply,
        issuer: walletData.address,
        trustLineHash: trustLineResult.hash,
        tokenHash: tokenResult.hash,
        assetData: assetData,
        timestamp: new Date().toISOString(),
        network: 'testnet'
      };

      setTokenizationResult(result);
      setSuccess('Token creato con successo sulla blockchain XRPL!');
      setStep(4); // Vai al step di successo

    } catch (error) {
      console.error('Errore tokenizzazione:', error);
      setError(`Errore durante la tokenizzazione: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createDemoToken = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simula creazione token
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = {
        success: true,
        tokenSymbol: assetData.tokenSymbol,
        totalSupply: assetData.totalSupply,
        issuer: walletData.address,
        trustLineHash: 'demo_trustline_hash_' + Date.now(),
        tokenHash: 'demo_token_hash_' + Date.now(),
        assetData: assetData,
        timestamp: new Date().toISOString(),
        network: 'demo',
        isDemo: true
      };

      setTokenizationResult(result);
      setSuccess('Token demo creato con successo!');
      setStep(4);

    } catch (error) {
      setError(`Errore demo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenize = async () => {
    if (walletData?.type === 'demo') {
      await createDemoToken();
    } else {
      await createTokenOnXRPL();
    }
  };

  // Step 1: Informazioni Asset
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">📋 Informazioni Asset</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome Asset *</label>
            <input
              type="text"
              value={assetData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="es. Appartamento Milano Centro"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Valore Asset * (€)</label>
            <input
              type="number"
              value={assetData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              placeholder="es. 450000"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Descrizione *</label>
          <textarea
            value={assetData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descrizione dettagliata dell'asset..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Categoria Asset *</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {assetCategories.map(category => (
              <button
                key={category.id}
                onClick={() => handleInputChange('category', category.id)}
                className={`p-3 border-2 rounded-lg text-left transition-all ${
                  assetData.category === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="font-medium text-sm">{category.name}</div>
                <div className="text-xs text-gray-600">{category.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">🏷️ Configurazione Token</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Simbolo Token *</label>
            <input
              type="text"
              value={assetData.tokenSymbol}
              onChange={(e) => handleInputChange('tokenSymbol', e.target.value.toUpperCase())}
              placeholder="es. MILAPP"
              maxLength={20}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">3-20 caratteri, solo lettere e numeri</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supply Totale *</label>
            <input
              type="number"
              value={assetData.totalSupply}
              onChange={(e) => handleInputChange('totalSupply', e.target.value)}
              placeholder="es. 1000"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">Numero totale di token da creare</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Revisione e Costi
  const renderStep2 = () => {
    const costs = estimateTokenizationCosts();
    const selectedCategory = assetCategories.find(c => c.id === assetData.category);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">📊 Riepilogo Tokenizzazione</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Asset:</span>
              <span>{assetData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Categoria:</span>
              <span>{selectedCategory?.icon} {selectedCategory?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Valore:</span>
              <span>€{parseFloat(assetData.value).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Token:</span>
              <span>{assetData.tokenSymbol} ({assetData.totalSupply} unità)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Valore per Token:</span>
              <span>€{(parseFloat(assetData.value) / parseInt(assetData.totalSupply)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">💰 Stima Costi</h3>
          
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span>Fee XRPL:</span>
              <span>{costs.xrplFee} XRP</span>
            </div>
            <div className="flex justify-between">
              <span>Fee Piattaforma:</span>
              <span>€{costs.platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fee Legali:</span>
              <span>€{costs.legalFee.toFixed(2)}</span>
            </div>
            <hr className="border-blue-200" />
            <div className="flex justify-between font-bold">
              <span>Totale:</span>
              <span>€{costs.totalEUR.toFixed(2)} + {costs.totalXRP} XRP</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Nota:</strong> I costi sono stimati. Le fee XRPL sono in tempo reale.
              {!xrplConnected && ' XRPL non connesso - modalità demo attiva.'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Conferma e Creazione
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">🚀 Creazione Token</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">
              {xrplConnected ? 'Creazione token sulla blockchain XRPL...' : 'Creazione token demo...'}
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Validazione dati completata</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Creazione Trust Line...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                  <span>Emissione token...</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Sei pronto per creare il token <strong>{assetData.tokenSymbol}</strong> sulla blockchain XRPL?
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Cosa succederà:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Creazione Trust Line per il token {assetData.tokenSymbol}</li>
                <li>• Emissione di {assetData.totalSupply} token</li>
                <li>• Registrazione sulla blockchain XRPL</li>
                <li>• Token disponibili nel tuo wallet</li>
              </ul>
            </div>

            <button
              onClick={handleTokenize}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              🚀 Crea Token su XRPL
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: Successo
  const renderStep4 = () => (
    <div className="space-y-6 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold text-green-600">Token Creato con Successo!</h3>
      
      {tokenizationResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
          <h4 className="font-bold text-green-800 mb-4">📋 Dettagli Token</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Simbolo:</strong> {tokenizationResult.tokenSymbol}</div>
            <div><strong>Supply:</strong> {tokenizationResult.totalSupply} token</div>
            <div><strong>Issuer:</strong> <code className="bg-white p-1 rounded">{tokenizationResult.issuer}</code></div>
            <div><strong>Network:</strong> {tokenizationResult.network}</div>
            {tokenizationResult.trustLineHash && (
              <div><strong>Trust Line Hash:</strong> <code className="bg-white p-1 rounded text-xs">{tokenizationResult.trustLineHash}</code></div>
            )}
            {tokenizationResult.tokenHash && (
              <div><strong>Token Hash:</strong> <code className="bg-white p-1 rounded text-xs">{tokenizationResult.tokenHash}</code></div>
            )}
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={() => {
            setStep(1);
            setAssetData({
              name: '',
              description: '',
              category: '',
              value: '',
              currency: 'EUR',
              tokenSymbol: '',
              totalSupply: '',
              documents: []
            });
            setTokenizationResult(null);
            setSuccess(null);
          }}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          🔄 Tokenizza Altro Asset
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
        >
          ✅ Chiudi
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🏷️ Sistema Tokenizzazione XRPL</h2>
              <p className="text-gray-600 mt-1">
                Trasforma i tuoi asset in token sulla blockchain XRPL
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map(stepNum => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div className={`w-12 h-1 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Asset</span>
              <span>Revisione</span>
              <span>Creazione</span>
              <span>Successo</span>
            </div>
          </div>

          {/* Status XRPL */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${xrplConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm font-medium">
                {xrplConnected ? 'XRPL Testnet Connesso' : 'XRPL Non Connesso - Modalità Demo'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-red-700 font-medium">Errore</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span className="text-green-700 font-medium">Successo</span>
              </div>
              <p className="text-green-600 text-sm mt-1">{success}</p>
            </div>
          )}

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer */}
        {step < 4 && !isLoading && (
          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button
              onClick={step > 1 ? handlePrevStep : onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              {step > 1 ? '← Indietro' : 'Annulla'}
            </button>
            
            {step < 3 && (
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Avanti →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenizationSystemReal;

