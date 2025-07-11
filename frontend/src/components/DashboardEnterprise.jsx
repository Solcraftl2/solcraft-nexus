import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import WalletConnectionReal from './WalletConnectionReal';
import TokenizationSystem from './TokenizationSystem';

/**
 * Dashboard Enterprise per SolCraft Nexus
 * Design professionale ispirato a piattaforme finanziarie di alto livello
 */
const DashboardEnterprise = ({ walletData, onDisconnect }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTokenization, setShowTokenization] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState(null);

  useEffect(() => {
    if (walletData) {
      loadDashboardData();
    }
  }, [walletData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carica dati portfolio
      const portfolioResponse = await apiService.getPortfolio(walletData.address);
      setPortfolioData(portfolioResponse.data);

      // Carica transazioni recenti
      const transactionsResponse = await apiService.getTransactions(walletData.address, { limit: 10 });
      setTransactions(transactionsResponse.data);

      // Carica token posseduti
      const tokensResponse = await apiService.getUserTokens(walletData.address);
      setTokens(tokensResponse.data);

      // Carica dati di mercato
      const marketResponse = await apiService.getMarketData();
      setMarketData(marketResponse.data);

    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatXRP = (amount) => {
    return `${parseFloat(amount).toLocaleString()} XRP`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '➡️';
  };

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
    { id: 'transactions', label: 'Transazioni', icon: '📋' },
    { id: 'tokens', label: 'Token', icon: '🪙' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  const quickActions = [
    {
      id: 'send',
      label: 'Invia',
      icon: '📤',
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => console.log('Invia')
    },
    {
      id: 'receive',
      label: 'Ricevi',
      icon: '📥',
      color: 'bg-green-600 hover:bg-green-700',
      action: () => console.log('Ricevi')
    },
    {
      id: 'tokenize',
      label: 'Tokenizza',
      icon: '🏗️',
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => setShowTokenization(true)
    },
    {
      id: 'trade',
      label: 'Scambia',
      icon: '🔄',
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => console.log('Scambia')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valore Totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {portfolioData ? formatCurrency(portfolioData.totalValue) : formatCurrency(125750)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">💰</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">+12.5%</span>
            <span className="text-gray-500 text-sm ml-2">vs mese scorso</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bilancio XRP</p>
              <p className="text-2xl font-bold text-gray-900">
                {walletData ? formatXRP(walletData.balance) : formatXRP(2450)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">⚡</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">+8.2%</span>
            <span className="text-gray-500 text-sm ml-2">24h</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Asset Tokenizzati</p>
              <p className="text-2xl font-bold text-gray-900">
                {tokens.length || 7}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">🏗️</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-blue-600 text-sm font-medium">+2 nuovi</span>
            <span className="text-gray-500 text-sm ml-2">questa settimana</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rendimento</p>
              <p className="text-2xl font-bold text-gray-900">+15.8%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">📈</span>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">Annualizzato</span>
            <span className="text-gray-500 text-sm ml-2">YTD</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`${action.color} text-white p-4 rounded-lg transition-colors flex flex-col items-center space-y-2`}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transazioni Recenti</h3>
          <div className="space-y-4">
            {(transactions.length > 0 ? transactions : [
              { id: 1, type: 'send', amount: -150, currency: 'XRP', to: 'rN7n...8kL2', timestamp: Date.now() - 3600000 },
              { id: 2, type: 'receive', amount: 500, currency: 'XRP', from: 'rM4k...9pQ1', timestamp: Date.now() - 7200000 },
              { id: 3, type: 'tokenize', amount: 0, asset: 'Appartamento Milano', timestamp: Date.now() - 86400000 }
            ]).slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'send' ? 'bg-red-100' : tx.type === 'receive' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <span className="text-sm">
                      {tx.type === 'send' ? '📤' : tx.type === 'receive' ? '📥' : '🏗️'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.type === 'send' ? 'Invio' : tx.type === 'receive' ? 'Ricezione' : 'Tokenizzazione'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {tx.amount !== 0 && (
                    <p className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                    </p>
                  )}
                  {tx.asset && (
                    <p className="text-sm text-gray-500">{tx.asset}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mercato XRPL</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">XRP</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">XRP/EUR</p>
                  <p className="text-sm text-gray-500">Ripple</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">€0.52</p>
                <p className="text-sm text-green-600">+8.2%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">BTC</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">BTC/EUR</p>
                  <p className="text-sm text-gray-500">Bitcoin</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">€42,150</p>
                <p className="text-sm text-red-600">-2.1%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">ETH</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">ETH/EUR</p>
                  <p className="text-sm text-gray-500">Ethereum</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">€2,890</p>
                <p className="text-sm text-green-600">+5.7%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocazione Portfolio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Immobiliare</span>
              <span className="font-medium">65%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Crypto</span>
              <span className="font-medium">25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Altri Asset</span>
              <span className="font-medium">10%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Tokenizzati</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Asset</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Valore</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Token</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rendimento</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">🏢</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Appartamento Milano</p>
                      <p className="text-sm text-gray-500">Via Brera, 15</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">Immobiliare</td>
                <td className="py-3 px-4 font-medium">€450,000</td>
                <td className="py-3 px-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">MILAPP</span>
                </td>
                <td className="py-3 px-4 text-green-600 font-medium">+12.5%</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600">🎨</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Collezione Arte</p>
                      <p className="text-sm text-gray-500">Opere contemporanee</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">Arte</td>
                <td className="py-3 px-4 font-medium">€85,000</td>
                <td className="py-3 px-4">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">ARTCOL</span>
                </td>
                <td className="py-3 px-4 text-green-600 font-medium">+18.2%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SolCraft Nexus</h1>
                  <p className="text-sm text-gray-500">Enterprise XRPL Platform</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🟢</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{walletData?.name || 'Demo Wallet'}</p>
                  <p className="text-xs text-gray-500">
                    {walletData?.address ? `${walletData.address.slice(0, 8)}...${walletData.address.slice(-6)}` : 'Demo Mode'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowWalletModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cambia Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'portfolio' && renderPortfolio()}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutte le Transazioni</h3>
            <p className="text-gray-500">Funzionalità in sviluppo...</p>
          </div>
        )}
        {activeTab === 'tokens' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestione Token</h3>
            <p className="text-gray-500">Funzionalità in sviluppo...</p>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Avanzate</h3>
            <p className="text-gray-500">Funzionalità in sviluppo...</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showWalletModal && (
        <WalletConnectionReal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onConnect={(wallet) => {
            setShowWalletModal(false);
            window.location.reload(); // Ricarica per aggiornare i dati
          }}
        />
      )}

      {showTokenization && (
        <TokenizationSystem
          walletData={walletData}
          onClose={() => setShowTokenization(false)}
        />
      )}
    </div>
  );
};

export default DashboardEnterprise;

