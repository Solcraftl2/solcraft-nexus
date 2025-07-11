import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

/**
 * Dashboard Professionale SolCraft Nexus
 * Design enterprise-grade con funzionalità reali
 */
const DashboardProfessional = ({ walletData, onLogout }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [walletData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carica dati portfolio reali
      const portfolioResponse = await apiService.getPortfolio(walletData?.address);
      setPortfolioData(portfolioResponse.data);

      // Carica asset tokenizzati
      const assetsResponse = await apiService.getTokenizedAssets(walletData?.address);
      setAssets(assetsResponse.data);

      // Carica transazioni recenti
      const transactionsResponse = await apiService.getTransactions(walletData?.address);
      setTransactions(transactionsResponse.data);

    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
      // Fallback a dati demo se API non disponibile
      setPortfolioData({
        totalValue: 0,
        xrpBalance: 0,
        tokenizedAssets: 0,
        monthlyReturn: 0,
        protectionLevel: 0
      });
      setAssets([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatXRP = (amount) => {
    return `${amount.toFixed(6)} XRP`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Caricamento Dashboard</h2>
          <p className="text-gray-600">Sincronizzazione con XRPL in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Professionale */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SC</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">SolCraft Nexus</h1>
                <p className="text-sm text-gray-500">Tokenizzazione Professionale</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{walletData?.address?.slice(0, 8)}...{walletData?.address?.slice(-6)}</p>
                <p className="text-xs text-gray-500">Wallet Connesso</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Disconnetti
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Panoramica', icon: '📊' },
              { id: 'assets', label: 'Asset Tokenizzati', icon: '🏢' },
              { id: 'tokenize', label: 'Tokenizza', icon: '⚡' },
              { id: 'marketplace', label: 'Marketplace', icon: '🏪' },
              { id: 'transactions', label: 'Transazioni', icon: '💳' }
            ].map((tab) => (
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
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Valore Totale</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioData?.totalValue || 0)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600 font-medium">+{portfolioData?.monthlyReturn || 0}%</span>
                    <span className="text-gray-500 ml-2">questo mese</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">⚡</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Bilancio XRP</p>
                    <p className="text-2xl font-bold text-gray-900">{formatXRP(portfolioData?.xrpBalance || 0)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-blue-600 font-medium">XRPL Mainnet</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-lg">🏢</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Asset Tokenizzati</p>
                    <p className="text-2xl font-bold text-gray-900">{assets?.length || 0}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-purple-600 font-medium">Attivi</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 text-lg">🛡️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Protezione</p>
                    <p className="text-2xl font-bold text-gray-900">{portfolioData?.protectionLevel || 95}%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-orange-600 font-medium">Enterprise Grade</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Azioni Rapide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('tokenize')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                      <span className="text-blue-600 text-xl">⚡</span>
                    </div>
                    <h4 className="font-medium text-gray-900">Tokenizza Asset</h4>
                    <p className="text-sm text-gray-500 mt-1">Trasforma asset in token XRPL</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200">
                      <span className="text-green-600 text-xl">🏪</span>
                    </div>
                    <h4 className="font-medium text-gray-900">Marketplace</h4>
                    <p className="text-sm text-gray-500 mt-1">Investi in asset tokenizzati</p>
                  </div>
                </button>

                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200">
                      <span className="text-purple-600 text-xl">📊</span>
                    </div>
                    <h4 className="font-medium text-gray-900">Analytics</h4>
                    <p className="text-sm text-gray-500 mt-1">Analisi performance</p>
                  </div>
                </button>

                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200">
                      <span className="text-orange-600 text-xl">⚙️</span>
                    </div>
                    <h4 className="font-medium text-gray-900">Impostazioni</h4>
                    <p className="text-sm text-gray-500 mt-1">Configura account</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Attività Recente</h3>
              <div className="space-y-4">
                {transactions?.length > 0 ? (
                  transactions.slice(0, 5).map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600">💳</span>
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{tx.description}</p>
                          <p className="text-sm text-gray-500">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}{formatXRP(tx.amount)}
                        </p>
                        <p className="text-sm text-gray-500">{tx.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">📋</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Nessuna transazione</h4>
                    <p className="text-gray-500">Le tue transazioni appariranno qui</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tokenize' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tokenizza i Tuoi Asset</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Trasforma i tuoi asset fisici in token digitali sulla blockchain XRPL. 
                Ottieni liquidità immediata e accesso a nuovi mercati.
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-medium text-lg transition-colors">
                Inizia Tokenizzazione
              </button>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">I Miei Asset Tokenizzati</h2>
              <button
                onClick={() => setActiveTab('tokenize')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                + Nuovo Asset
              </button>
            </div>

            {assets?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Attivo
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valore:</span>
                        <span className="font-medium">{formatCurrency(asset.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Token:</span>
                        <span className="font-medium">{asset.tokens} {asset.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rendimento:</span>
                        <span className="font-medium text-green-600">+{asset.yield}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <span className="text-gray-400 text-4xl">🏢</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun Asset Tokenizzato</h3>
                <p className="text-gray-500 mb-6">Inizia a tokenizzare i tuoi asset per sbloccare nuove opportunità</p>
                <button
                  onClick={() => setActiveTab('tokenize')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Tokenizza il Primo Asset
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Marketplace Asset Tokenizzati</h2>
              <p className="text-gray-600 mb-8">Investi in asset tokenizzati da altri utenti della piattaforma</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-800 font-medium">🚧 Marketplace in sviluppo</p>
                <p className="text-blue-600 mt-2">Questa funzionalità sarà disponibile a breve</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Cronologia Transazioni</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Tutte le Transazioni</h3>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Esporta CSV
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {transactions?.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600">💳</span>
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-gray-900">{tx.description}</p>
                            <p className="text-sm text-gray-500">{tx.date}</p>
                            <p className="text-xs text-gray-400">Hash: {tx.hash}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{formatXRP(tx.amount)}
                          </p>
                          <p className="text-sm text-gray-500">{tx.status}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">📋</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Nessuna transazione</h4>
                    <p className="text-gray-500">Le tue transazioni XRPL appariranno qui</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardProfessional;

