import React, { useState, useEffect } from 'react';
import { 
  riskCategories, 
  availableRiskTokens, 
  riskLayers,
  revenueStreams,
  marketData 
} from '../data/insuranceData';
import oracleService from '../services/oracleService';

const RiskMarketplace = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRiskLayer, setSelectedRiskLayer] = useState('all');
  const [sortBy, setSortBy] = useState('yield_desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [userPortfolio, setUserPortfolio] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [oracleStatus, setOracleStatus] = useState(null);
  const [triggerEvents, setTriggerEvents] = useState([]);
  const [monitoredTokens, setMonitoredTokens] = useState(new Set());

  // Initialize oracle service and monitoring
  useEffect(() => {
    const initializeOracle = async () => {
      try {
        const status = oracleService.getStatus();
        setOracleStatus(status);
        
        // Start monitoring all available tokens
        availableRiskTokens.forEach(token => {
          if (!monitoredTokens.has(token.id)) {
            startTokenMonitoring(token);
          }
        });
        
      } catch (error) {
        console.error('Failed to initialize oracle service:', error);
      }
    };

    initializeOracle();

    // Update oracle status periodically
    const statusInterval = setInterval(() => {
      const status = oracleService.getStatus();
      setOracleStatus(status);
    }, 30000);

    return () => {
      clearInterval(statusInterval);
      // Cleanup subscriptions
      monitoredTokens.forEach(tokenId => {
        oracleService.unsubscribeTrigger(tokenId);
      });
    };
  }, []);

  // Start monitoring a specific token
  const startTokenMonitoring = (token) => {
    const handleTriggerEvent = (triggerResult) => {
      console.log(`🚨 Trigger event for ${token.name}:`, triggerResult);
      
      const event = {
        id: Date.now(),
        tokenId: token.id,
        tokenName: token.name,
        triggerResult,
        timestamp: new Date(),
        severity: triggerResult.isTriggered ? 'high' : 'low'
      };
      
      setTriggerEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
    };

    oracleService.subscribeTrigger(token.id, token.trigger, handleTriggerEvent);
    setMonitoredTokens(prev => new Set([...prev, token.id]));
  };

  // Stop monitoring a specific token
  const stopTokenMonitoring = (tokenId) => {
    oracleService.unsubscribeTrigger(tokenId);
    setMonitoredTokens(prev => {
      const newSet = new Set(prev);
      newSet.delete(tokenId);
      return newSet;
    });
  };

  // Filter and sort tokens
  const filteredTokens = availableRiskTokens
    .filter(token => {
      const categoryMatch = selectedCategory === 'all' || token.category === selectedCategory;
      const layerMatch = selectedRiskLayer === 'all' || token.risk_layer === selectedRiskLayer;
      const searchMatch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.description.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && layerMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'yield_desc': return b.yield_rate - a.yield_rate;
        case 'yield_asc': return a.yield_rate - b.yield_rate;
        case 'liquidity_desc': return b.liquidity_score - a.liquidity_score;
        case 'maturity_asc': return new Date(a.maturity_date) - new Date(b.maturity_date);
        case 'size_desc': return b.total_value - a.total_value;
        default: return 0;
      }
    });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryInfo = (categoryId) => {
    return riskCategories.find(cat => cat.id === categoryId);
  };

  const getProgressPercentage = (tokensSold, tokensAvailable) => {
    return (tokensSold / tokensAvailable) * 100;
  };

  const handleInvest = (token) => {
    setSelectedToken(token);
    setShowInvestModal(true);
  };

  const handleAddToWatchlist = (tokenId) => {
    if (!watchlist.includes(tokenId)) {
      setWatchlist([...watchlist, tokenId]);
    }
  };

  const handleRemoveFromWatchlist = (tokenId) => {
    setWatchlist(watchlist.filter(id => id !== tokenId));
  };

  const calculateCommission = (amount, token) => {
    const category = getCategoryInfo(token.category);
    return amount * category.commission_rate;
  };

  const renderTokenCard = (token) => {
    const category = getCategoryInfo(token.category);
    const progress = getProgressPercentage(token.tokens_sold, token.tokens_available);
    const isInWatchlist = watchlist.includes(token.id);

    return (
      <div key={token.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{token.name}</h3>
              <p className="text-sm text-gray-600">{token.issuer}</p>
            </div>
          </div>
          <button
            onClick={() => isInWatchlist ? handleRemoveFromWatchlist(token.id) : handleAddToWatchlist(token.id)}
            className={`p-2 rounded-full ${isInWatchlist ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'} hover:bg-yellow-200 transition-colors`}
          >
            ⭐
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Rendimento Annuo</p>
            <p className="text-xl font-bold text-green-700">{formatPercentage(token.yield_rate)}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Liquidità</p>
            <p className="text-xl font-bold text-blue-700">{token.liquidity_score}/100</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4">{token.description}</p>

        {/* Risk Info */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <p className="text-xs text-gray-600 font-medium mb-1">TRIGGER PARAMETRICO</p>
          <p className="text-sm text-gray-800">{token.trigger.description}</p>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">Probabilità: {formatPercentage(token.trigger.probability)}</span>
            <span className="text-xs text-gray-500">Fonte: {token.trigger.data_source}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Sottoscrizione</span>
            <span>{formatPercentage(progress / 100)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(token.tokens_sold * token.token_price)} raccolti</span>
            <span>{formatCurrency(token.total_value)} totale</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-gray-500">Scadenza:</span>
            <span className="ml-2 font-medium">{formatDate(token.maturity_date)}</span>
          </div>
          <div>
            <span className="text-gray-500">Geografia:</span>
            <span className="ml-2 font-medium">{token.geography}</span>
          </div>
          <div>
            <span className="text-gray-500">Layer:</span>
            <span className="ml-2 font-medium capitalize">{token.risk_layer}</span>
          </div>
          <div>
            <span className="text-gray-500">Performance YTD:</span>
            <span className="ml-2 font-medium text-green-600">{formatPercentage(token.performance_ytd)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => handleInvest(token)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Investi
          </button>
          <button
            onClick={() => setSelectedToken(token)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Dettagli
          </button>
        </div>
      </div>
    );
  };

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="font-bold text-lg mb-4">Filtri e Ricerca</h3>
      
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cerca per nome, emittente o descrizione..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria Rischio</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tutte le categorie</option>
            {riskCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Layer di Rischio</label>
          <select
            value={selectedRiskLayer}
            onChange={(e) => setSelectedRiskLayer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tutti i layer</option>
            {riskLayers.map(layer => (
              <option key={layer.id} value={layer.id}>
                {layer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ordina per</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="yield_desc">Rendimento (Alto → Basso)</option>
            <option value="yield_asc">Rendimento (Basso → Alto)</option>
            <option value="liquidity_desc">Liquidità (Alta → Bassa)</option>
            <option value="maturity_asc">Scadenza (Vicina → Lontana)</option>
            <option value="size_desc">Dimensione (Grande → Piccola)</option>
          </select>
        </div>
      </div>

      {/* Quick Category Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tutti
        </button>
        {riskCategories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id 
                ? 'text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedCategory === category.id ? category.color : undefined
            }}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMarketOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Totale AUM</h3>
        <p className="text-3xl font-bold">{formatCurrency(availableRiskTokens.reduce((sum, token) => sum + token.total_value, 0))}</p>
        <p className="text-blue-100 text-sm mt-1">Across {availableRiskTokens.length} risk tokens</p>
      </div>
      
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Rendimento Medio</h3>
        <p className="text-3xl font-bold">
          {formatPercentage(availableRiskTokens.reduce((sum, token) => sum + token.yield_rate, 0) / availableRiskTokens.length)}
        </p>
        <p className="text-green-100 text-sm mt-1">Weighted average yield</p>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Categorie Attive</h3>
        <p className="text-3xl font-bold">{riskCategories.length}</p>
        <p className="text-purple-100 text-sm mt-1">Risk categories available</p>
      </div>
      
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Liquidità Media</h3>
        <p className="text-3xl font-bold">
          {Math.round(availableRiskTokens.reduce((sum, token) => sum + token.liquidity_score, 0) / availableRiskTokens.length)}
        </p>
        <p className="text-orange-100 text-sm mt-1">Average liquidity score</p>
      </div>
    </div>
  );

  const renderInvestmentModal = () => {
    if (!showInvestModal || !selectedToken) return null;

    const category = getCategoryInfo(selectedToken.category);
    const commission = calculateCommission(parseFloat(investmentAmount) || 0, selectedToken);
    const totalCost = (parseFloat(investmentAmount) || 0) + commission;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Investi in {selectedToken.name}</h3>
            <button
              onClick={() => setShowInvestModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Importo investimento (EUR)</p>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              placeholder={`Min. ${formatCurrency(category.min_investment)}`}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {investmentAmount && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Investimento:</span>
                <span>{formatCurrency(parseFloat(investmentAmount))}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Commissione SolCraft ({formatPercentage(category.commission_rate)}):</span>
                <span>{formatCurrency(commission)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Totale:</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Dettagli Investimento</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Rendimento atteso: {formatPercentage(selectedToken.yield_rate)} annuo</p>
              <p>• Scadenza: {formatDate(selectedToken.maturity_date)}</p>
              <p>• Rischio trigger: {formatPercentage(selectedToken.trigger.probability)} annuo</p>
              <p>• Liquidità: {selectedToken.liquidity_score}/100</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowInvestModal(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
            >
              Annulla
            </button>
            <button
              onClick={() => {
                // Handle investment logic here
                setShowInvestModal(false);
                setInvestmentAmount('');
              }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
              disabled={!investmentAmount || parseFloat(investmentAmount) < category.min_investment}
            >
              Conferma Investimento
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛡️ Marketplace Rischi Tokenizzati</h1>
              <p className="text-gray-600">Orchestratore zero-risk per investimenti in rischi assicurativi</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'browse' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Esplora Rischi
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'portfolio' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Il Mio Portfolio
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'analytics' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'browse' && (
          <>
            {renderMarketOverview()}
            {renderFilters()}
            
            <div className="mb-4">
              <p className="text-gray-600">
                Trovati {filteredTokens.length} token di rischio
                {selectedCategory !== 'all' && ` nella categoria ${getCategoryInfo(selectedCategory)?.name}`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTokens.map(renderTokenCard)}
            </div>
          </>
        )}

        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Il Mio Portfolio Rischi</h2>
            <p className="text-gray-600">Portfolio in sviluppo - Funzionalità disponibili dopo il primo investimento</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Analytics Avanzate</h2>
            <p className="text-gray-600">Dashboard analytics in sviluppo - Metriche di performance e risk assessment</p>
          </div>
        )}
      </div>

      {renderInvestmentModal()}
    </div>
  );
};

export default RiskMarketplace;

