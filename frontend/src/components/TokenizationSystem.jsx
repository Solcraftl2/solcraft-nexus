import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

/**
 * Sistema di Tokenizzazione Completo per SolCraft Nexus
 * Permette la tokenizzazione di asset reali su XRPL
 */
const TokenizationSystem = ({ walletData, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [assetData, setAssetData] = useState({
    name: '',
    description: '',
    category: '',
    value: '',
    currency: 'EUR',
    location: '',
    documents: [],
    images: []
  });
  const [tokenData, setTokenData] = useState({
    symbol: '',
    totalSupply: '',
    decimals: 6,
    transferable: true,
    burnable: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [estimatedCosts, setEstimatedCosts] = useState(null);

  const assetCategories = [
    { value: 'real_estate', label: 'Immobiliare', icon: '🏢' },
    { value: 'art', label: 'Arte e Collezionabili', icon: '🎨' },
    { value: 'commodities', label: 'Materie Prime', icon: '🥇' },
    { value: 'vehicles', label: 'Veicoli', icon: '🚗' },
    { value: 'equipment', label: 'Macchinari', icon: '⚙️' },
    { value: 'intellectual', label: 'Proprietà Intellettuale', icon: '💡' },
    { value: 'bonds', label: 'Obbligazioni', icon: '📊' },
    { value: 'other', label: 'Altro', icon: '📦' }
  ];

  const steps = [
    { id: 1, title: 'Dettagli Asset', description: 'Informazioni base dell\'asset' },
    { id: 2, title: 'Configurazione Token', description: 'Parametri del token XRPL' },
    { id: 3, title: 'Verifica e Costi', description: 'Revisione finale e stima costi' },
    { id: 4, title: 'Tokenizzazione', description: 'Creazione token su XRPL' }
  ];

  useEffect(() => {
    if (currentStep === 3 && assetData.value && tokenData.symbol) {
      calculateEstimatedCosts();
    }
  }, [currentStep, assetData.value, tokenData.totalSupply]);

  const calculateEstimatedCosts = async () => {
    try {
      const response = await apiService.estimateTokenizationCosts({
        assetValue: parseFloat(assetData.value),
        tokenSupply: parseFloat(tokenData.totalSupply),
        category: assetData.category
      });
      
      setEstimatedCosts(response.data);
    } catch (error) {
      console.error('Errore calcolo costi:', error);
    }
  };

  const handleAssetDataChange = (field, value) => {
    setAssetData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleTokenDataChange = (field, value) => {
    setTokenData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateStep1 = () => {
    if (!assetData.name.trim()) {
      setError('Nome asset richiesto');
      return false;
    }
    if (!assetData.description.trim()) {
      setError('Descrizione asset richiesta');
      return false;
    }
    if (!assetData.category) {
      setError('Categoria asset richiesta');
      return false;
    }
    if (!assetData.value || parseFloat(assetData.value) <= 0) {
      setError('Valore asset deve essere maggiore di 0');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!tokenData.symbol.trim()) {
      setError('Simbolo token richiesto');
      return false;
    }
    if (tokenData.symbol.length < 3 || tokenData.symbol.length > 20) {
      setError('Simbolo token deve essere tra 3 e 20 caratteri');
      return false;
    }
    if (!tokenData.totalSupply || parseFloat(tokenData.totalSupply) <= 0) {
      setError('Supply totale deve essere maggiore di 0');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError(null);
    
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const executeTokenization = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Prepara i dati per la tokenizzazione
      const tokenizationRequest = {
        wallet: walletData,
        asset: assetData,
        token: tokenData,
        costs: estimatedCosts
      };

      // Esegui tokenizzazione tramite API backend
      const response = await apiService.createToken(tokenizationRequest);
      
      if (!response.success) {
        throw new Error(response.error || 'Errore durante la tokenizzazione');
      }

      setSuccess({
        tokenId: response.data.tokenId,
        txHash: response.data.transactionHash,
        tokenAddress: response.data.tokenAddress,
        explorerUrl: response.data.explorerUrl
      });

      setCurrentStep(5); // Step di successo
      
    } catch (error) {
      console.error('Errore tokenizzazione:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome Asset *
        </label>
        <input
          type="text"
          value={assetData.name}
          onChange={(e) => handleAssetDataChange('name', e.target.value)}
          placeholder="es. Appartamento Milano Centro"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrizione *
        </label>
        <textarea
          value={assetData.description}
          onChange={(e) => handleAssetDataChange('description', e.target.value)}
          placeholder="Descrizione dettagliata dell'asset..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria Asset *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {assetCategories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleAssetDataChange('category', category.value)}
              className={`p-3 border-2 rounded-lg text-left transition-colors ${
                assetData.category === category.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl mr-2">{category.icon}</span>
                <span className="font-medium">{category.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valore Asset *
          </label>
          <input
            type="number"
            value={assetData.value}
            onChange={(e) => handleAssetDataChange('value', e.target.value)}
            placeholder="100000"
            min="0"
            step="0.01"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valuta
          </label>
          <select
            value={assetData.currency}
            onChange={(e) => handleAssetDataChange('currency', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="XRP">XRP</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ubicazione
        </label>
        <input
          type="text"
          value={assetData.location}
          onChange={(e) => handleAssetDataChange('location', e.target.value)}
          placeholder="es. Milano, Italia"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Simbolo Token *
        </label>
        <input
          type="text"
          value={tokenData.symbol}
          onChange={(e) => handleTokenDataChange('symbol', e.target.value.toUpperCase())}
          placeholder="es. MILAPP"
          maxLength={20}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          3-20 caratteri, solo lettere e numeri
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supply Totale *
        </label>
        <input
          type="number"
          value={tokenData.totalSupply}
          onChange={(e) => handleTokenDataChange('totalSupply', e.target.value)}
          placeholder="1000000"
          min="1"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Numero totale di token da creare
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Decimali
        </label>
        <select
          value={tokenData.decimals}
          onChange={(e) => handleTokenDataChange('decimals', parseInt(e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={0}>0 (Nessun decimale)</option>
          <option value={2}>2 (es. 100.25)</option>
          <option value={6}>6 (Standard XRPL)</option>
          <option value={8}>8 (Come Bitcoin)</option>
          <option value={18}>18 (Come Ethereum)</option>
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Token Trasferibile</h4>
            <p className="text-sm text-gray-500">I token possono essere trasferiti tra utenti</p>
          </div>
          <button
            onClick={() => handleTokenDataChange('transferable', !tokenData.transferable)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              tokenData.transferable ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                tokenData.transferable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Token Bruciabile</h4>
            <p className="text-sm text-gray-500">I token possono essere distrutti permanentemente</p>
          </div>
          <button
            onClick={() => handleTokenDataChange('burnable', !tokenData.burnable)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              tokenData.burnable ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                tokenData.burnable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo Asset</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Nome:</span>
            <span className="font-medium">{assetData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Categoria:</span>
            <span className="font-medium">
              {assetCategories.find(c => c.value === assetData.category)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Valore:</span>
            <span className="font-medium">{formatCurrency(parseFloat(assetData.value || 0))}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo Token</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Simbolo:</span>
            <span className="font-medium">{tokenData.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Supply Totale:</span>
            <span className="font-medium">{parseInt(tokenData.totalSupply || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Decimali:</span>
            <span className="font-medium">{tokenData.decimals}</span>
          </div>
        </div>
      </div>

      {estimatedCosts && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Costi Stimati</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Commissione XRPL:</span>
              <span className="font-medium">{estimatedCosts.xrplFee} XRP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commissione Piattaforma:</span>
              <span className="font-medium">{formatCurrency(estimatedCosts.platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Verifica Asset:</span>
              <span className="font-medium">{formatCurrency(estimatedCosts.verificationFee)}</span>
            </div>
            <div className="border-t border-blue-200 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Totale:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(estimatedCosts.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      {isProcessing ? (
        <>
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <h3 className="text-xl font-semibold text-gray-900">Tokenizzazione in Corso</h3>
          <p className="text-gray-600">
            Stiamo creando il tuo token su XRPL. Questo processo può richiedere alcuni minuti.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Non chiudere questa finestra durante il processo
            </p>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-gray-900">Pronto per la Tokenizzazione</h3>
          <p className="text-gray-600">
            Conferma per procedere con la creazione del token su XRPL
          </p>
          <button
            onClick={executeTokenization}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-medium text-lg transition-colors"
          >
            🚀 Avvia Tokenizzazione
          </button>
        </>
      )}
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-green-600 text-2xl">✅</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Tokenizzazione Completata!</h3>
      <p className="text-gray-600">
        Il tuo asset è stato tokenizzato con successo su XRPL
      </p>
      
      {success && (
        <div className="bg-green-50 rounded-lg p-6 text-left">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Token ID:</label>
              <p className="text-sm text-gray-900 font-mono">{success.tokenId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Transaction Hash:</label>
              <p className="text-sm text-gray-900 font-mono break-all">{success.txHash}</p>
            </div>
            {success.explorerUrl && (
              <div>
                <a
                  href={success.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  🔗 Visualizza su XRPL Explorer
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
      >
        Chiudi
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sistema di Tokenizzazione</h2>
              <p className="text-gray-600 mt-1">Trasforma il tuo asset in token XRPL</p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2">
              <h3 className="font-medium text-gray-900">{steps[currentStep - 1]?.title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep - 1]?.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderSuccess()}
        </div>

        {/* Footer */}
        {currentStep < 4 && (
          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || isProcessing}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Indietro
            </button>
            <button
              onClick={nextStep}
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {currentStep === 3 ? 'Conferma' : 'Avanti'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenizationSystem;

