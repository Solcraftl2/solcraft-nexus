import React, { useState, useEffect } from 'react';
import xrplService from '../services/xrplService.js';
import transactionHistoryService from '../services/transactionHistoryService.js';
import assetManagementService from '../services/assetManagementService.js';

/**
 * Dashboard Professionale Enterprise per SolCraft Nexus
 * Versione con integrazione XRPL reale e dati dinamici
 */
const DashboardProfessionalNew = ({ walletData, onDisconnect, onOpenTokenization }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stati per dati reali
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    xrpBalance: 0,
    tokensCount: 0,
    monthlyGrowth: 0,
    weeklyChange: 0
  });
  
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [myTokens, setMyTokens] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Caricamento dati reali all'avvio
  useEffect(() => {
    if (walletData?.address) {
      loadDashboardData();
    }
  }, [walletData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carica dati wallet reali
      const accountInfo = await xrplService.getAccountInfo(walletData.address);
      const balance = parseFloat(accountInfo.Balance) / 1000000; // Converti da drops a XRP

      // Carica token posseduti
      const tokens = await assetManagementService.getUserTokens(walletData.address);
      
      // Carica transazioni recenti
      const transactions = await transactionHistoryService.getTransactionHistory(
        walletData.address, 
        { limit: 10 }
      );

      // Carica dati di mercato
      const market = await xrplService.getMarketData();

      // Calcola valore totale portfolio
      const xrpValue = balance * (market.xrpPrice || 0.52);
      const tokensValue = tokens.reduce((sum, token) => sum + (token.estimatedValue || 0), 0);
      const totalValue = xrpValue + tokensValue;

      // Aggiorna stati
      setPortfolioData({
        totalValue,
        xrpBalance: balance,
        tokensCount: tokens.length,
        monthlyGrowth: calculateGrowth(transactions, 30),
        weeklyChange: calculateGrowth(transactions, 7)
      });

      setMyTokens(tokens);
      setRecentTransactions(transactions.slice(0, 5));
      setMarketData(market.pairs || []);

      // Notifiche basate su eventi reali
      const newNotifications = [];
      if (balance > 0) {
        newNotifications.push({
          id: Date.now(),
          type: 'success',
          message: `Wallet connesso con successo - Bilancio: ${balance.toFixed(2)} XRP`,
          time: 'ora'
        });
      }
      if (tokens.length > 0) {
        newNotifications.push({
          id: Date.now() + 1,
          type: 'info',
          message: `${tokens.length} token trovati nel tuo wallet`,
          time: 'ora'
        });
      }
      setNotifications(newNotifications);

    } catch (error) {
      console.error('❌ Errore caricamento dashboard:', error);
      setError('Errore durante il caricamento dei dati. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (transactions, days) => {
    // Calcola crescita basata su transazioni reali
    const now = new Date();
    const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const recentTxs = transactions.filter(tx => 
      new Date(tx.date) >= pastDate
    );
    
    const totalValue = recentTxs.reduce((sum, tx) => {
      if (tx.type === 'tokenize' || tx.type === 'receive') {
        return sum + (tx.value || 0);
      }
      return sum;
    }, 0);
    
    return totalValue > 0 ? Math.min(totalValue / 1000, 15) : 0; // Cap al 15%
  };

  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatXRP = (amount) => {
    return `${amount.toFixed(2)} XRP`;
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d fa`;
    if (hours > 0) return `${hours}h fa`;
    if (minutes > 0) return `${minutes}m fa`;
    return 'ora';
  };

  const TabButton = ({ id, label, icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  const StatCard = ({ title, value, subtitle, icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <span className={`text-2xl text-${color}-600`}>{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend > 0 ? '↗' : '↘'}</span>
            <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  const TransactionRow = ({ transaction }) => {
    const getTypeIcon = (type) => {
      switch(type) {
        case 'tokenize': return '🏷️';
        case 'transfer': return '📤';
        case 'receive': return '📥';
        case 'trade': return '💱';
        case 'payment': return '💸';
        default: return '📊';
      }
    };

    const getStatusColor = (status) => {
      switch(status) {
        case 'validated': 
        case 'completed': return 'text-green-600 bg-green-50';
        case 'pending': return 'text-yellow-600 bg-yellow-50';
        case 'failed': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    return (
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <span className="text-lg">{getTypeIcon(transaction.type)}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{transaction.description || transaction.type}</p>
            <p className="text-sm text-gray-500">{getRelativeTime(transaction.date)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium text-gray-900">
            {transaction.amount ? formatXRP(transaction.amount) : transaction.value ? formatCurrency(transaction.value) : 'N/A'}
          </p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status || 'completed'}
          </span>
        </div>
      </div>
    );
  };

  const TokenRow = ({ token }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {token.currency ? token.currency.substring(0, 2) : token.symbol?.substring(0, 2) || 'TK'}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{token.currency || token.symbol || 'Token'}</p>
          <p className="text-sm text-gray-500">{token.name || token.description || 'Asset Token'}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">
          {token.balance || token.amount || '0'} {token.currency || token.symbol || ''}
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {token.estimatedValue ? formatCurrency(token.estimatedValue) : 'N/A'}
          </span>
          {token.change && (
            <span className={`text-sm ${token.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {token.change > 0 ? '+' : ''}{token.change.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const MarketRow = ({ market }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div>
        <p className="font-medium text-gray-900">{market.pair || 'XRP/EUR'}</p>
        <p className="text-sm text-gray-500">Vol: {market.volume || 'N/A'}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">{market.price || formatCurrency(0.52)}</p>
        <span className={`text-sm ${(market.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {(market.change || 0) >= 0 ? '+' : ''}{(market.change || 0).toFixed(1)}%
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dati XRPL...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Errore di Caricamento</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Titolo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🚀</span>
                <h1 className="text-xl font-bold text-gray-900">SolCraft Nexus</h1>
              </div>
              <div className="hidden md:block">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  XRPL Mainnet
                </span>
              </div>
            </div>

            {/* Wallet Info e Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifiche */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <span className="text-xl">🔔</span>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Wallet Info */}
              <div className="hidden md:flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {walletData?.type?.charAt(0).toUpperCase() || 'W'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{walletData?.name || walletData?.type || 'Wallet'}</p>
                  <p className="text-gray-500">
                    {walletData?.address?.substring(0, 8)}...{walletData?.address?.substring(-4)}
                  </p>
                </div>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={onDisconnect}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Disconnetti
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-xl shadow-sm">
          <TabButton
            id="overview"
            label="Panoramica"
            icon="📊"
            active={activeTab === 'overview'}
            onClick={setActiveTab}
          />
          <TabButton
            id="tokens"
            label="I Miei Token"
            icon="🏷️"
            active={activeTab === 'tokens'}
            onClick={setActiveTab}
          />
          <TabButton
            id="market"
            label="Mercato"
            icon="📈"
            active={activeTab === 'market'}
            onClick={setActiveTab}
          />
          <TabButton
            id="transactions"
            label="Transazioni"
            icon="📋"
            active={activeTab === 'transactions'}
            onClick={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Valore Totale Portfolio"
                value={formatCurrency(portfolioData.totalValue)}
                subtitle="Tutti gli asset"
                icon="💰"
                trend={portfolioData.monthlyGrowth}
                color="green"
              />
              <StatCard
                title="Bilancio XRP"
                value={formatXRP(portfolioData.xrpBalance)}
                subtitle={formatCurrency(portfolioData.xrpBalance * 0.52)}
                icon="💎"
                trend={portfolioData.weeklyChange}
                color="blue"
              />
              <StatCard
                title="Token Posseduti"
                value={portfolioData.tokensCount}
                subtitle="Asset tokenizzati"
                icon="🏷️"
                color="purple"
              />
              <StatCard
                title="Crescita Mensile"
                value={`${portfolioData.monthlyGrowth > 0 ? '+' : ''}${portfolioData.monthlyGrowth.toFixed(1)}%`}
                subtitle="Performance portfolio"
                icon="📈"
                trend={portfolioData.weeklyChange}
                color="indigo"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={onOpenTokenization}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-2xl">🏷️</span>
                  <div className="text-left">
                    <p className="font-semibold">Tokenizza Asset</p>
                    <p className="text-sm opacity-90">Crea nuovi token</p>
                  </div>
                </button>

                <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105">
                  <span className="text-2xl">💱</span>
                  <div className="text-left">
                    <p className="font-semibold">Trading DEX</p>
                    <p className="text-sm opacity-90">Scambia token</p>
                  </div>
                </button>

                <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105">
                  <span className="text-2xl">📊</span>
                  <div className="text-left">
                    <p className="font-semibold">Analytics</p>
                    <p className="text-sm opacity-90">Analisi dettagliate</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Transazioni Recenti</h2>
                <div className="space-y-2">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.slice(0, 3).map((transaction, index) => (
                      <TransactionRow key={transaction.id || index} transaction={transaction} />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nessuna transazione trovata</p>
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Vedi tutte le transazioni →
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">I Miei Token</h2>
                <div className="space-y-2">
                  {myTokens.length > 0 ? (
                    myTokens.slice(0, 3).map((token, index) => (
                      <TokenRow key={token.id || index} token={token} />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nessun token trovato</p>
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab('tokens')}
                  className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Gestisci tutti i token →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">I Miei Token</h2>
              <button
                onClick={onOpenTokenization}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Tokenizza Asset
              </button>
            </div>
            <div className="space-y-2">
              {myTokens.length > 0 ? (
                myTokens.map((token, index) => (
                  <TokenRow key={token.id || index} token={token} />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏷️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun Token Trovato</h3>
                  <p className="text-gray-500 mb-4">Inizia tokenizzando il tuo primo asset</p>
                  <button
                    onClick={onOpenTokenization}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tokenizza Asset
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Mercato XRPL</h2>
            <div className="space-y-2">
              {marketData.length > 0 ? (
                marketData.map((market, index) => (
                  <MarketRow key={index} market={market} />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Dati di Mercato Non Disponibili</h3>
                  <p className="text-gray-500">I dati di mercato verranno caricati a breve</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Tutte le Transazioni</h2>
            <div className="space-y-2">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <TransactionRow key={transaction.id || index} transaction={transaction} />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna Transazione</h3>
                  <p className="text-gray-500">Le tue transazioni appariranno qui</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardProfessionalNew;

