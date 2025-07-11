import React, { useState, useEffect } from 'react';

/**
 * Dashboard Professionale Enterprise per SolCraft Nexus
 * Design moderno con layout responsive e funzionalità avanzate
 */
const DashboardProfessionalNew = ({ walletData, onDisconnect, onOpenTokenization }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', message: 'Wallet connesso con successo', time: '2 min fa' },
    { id: 2, type: 'info', message: 'Nuovo token MILAPP disponibile', time: '5 min fa' }
  ]);

  // Dati simulati per la dashboard
  const portfolioData = {
    totalValue: (walletData?.balance * 0.52 || 0) + 125000,
    xrpBalance: walletData?.balance || 0,
    tokensCount: walletData?.tokensCount || 3,
    monthlyGrowth: 12.5,
    weeklyChange: 3.2
  };

  const recentTransactions = [
    { id: 1, type: 'tokenize', asset: 'Appartamento Milano', amount: '€450,000', status: 'completed', time: '2h fa' },
    { id: 2, type: 'transfer', asset: 'MILAPP Token', amount: '100 MILAPP', status: 'pending', time: '4h fa' },
    { id: 3, type: 'trade', asset: 'XRP/EUR', amount: '500 XRP', status: 'completed', time: '1d fa' }
  ];

  const myTokens = [
    { symbol: 'MILAPP', name: 'Milano Apartment', balance: '1000', value: '€450,000', change: '+2.1%' },
    { symbol: 'ARTCOL', name: 'Art Collection', balance: '500', value: '€75,000', change: '+5.8%' },
    { symbol: 'GOLDBAR', name: 'Gold Bars', balance: '250', value: '€125,000', change: '-1.2%' }
  ];

  const marketData = [
    { pair: 'XRP/EUR', price: '€0.52', change: '+3.2%', volume: '€2.1M' },
    { pair: 'MILAPP/XRP', price: '450 XRP', change: '+2.1%', volume: '€125K' },
    { pair: 'ARTCOL/EUR', price: '€150', change: '+5.8%', volume: '€89K' }
  ];

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
            trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{trend.startsWith('+') ? '↗' : '↘'}</span>
            <span>{trend}</span>
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
        case 'trade': return '💱';
        default: return '📊';
      }
    };

    const getStatusColor = (status) => {
      switch(status) {
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
            <p className="font-medium text-gray-900">{transaction.asset}</p>
            <p className="text-sm text-gray-500">{transaction.time}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium text-gray-900">{transaction.amount}</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>
      </div>
    );
  };

  const TokenRow = ({ token }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">{token.symbol.substring(0, 2)}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{token.symbol}</p>
          <p className="text-sm text-gray-500">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">{token.balance} {token.symbol}</p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{token.value}</span>
          <span className={`text-sm ${token.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {token.change}
          </span>
        </div>
      </div>
    </div>
  );

  const MarketRow = ({ market }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div>
        <p className="font-medium text-gray-900">{market.pair}</p>
        <p className="text-sm text-gray-500">Vol: {market.volume}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">{market.price}</p>
        <span className={`text-sm ${market.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {market.change}
        </span>
      </div>
    </div>
  );

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
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  XRPL Testnet
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
                  <span className="text-white text-sm font-bold">W</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{walletData?.type || 'Demo'}</p>
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
                value={`€${portfolioData.totalValue.toLocaleString()}`}
                subtitle="Tutti gli asset"
                icon="💰"
                trend={`+${portfolioData.monthlyGrowth}%`}
                color="green"
              />
              <StatCard
                title="Bilancio XRP"
                value={`${portfolioData.xrpBalance} XRP`}
                subtitle={`≈ €${(portfolioData.xrpBalance * 0.52).toFixed(2)}`}
                icon="💎"
                trend={`+${portfolioData.weeklyChange}%`}
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
                value={`+${portfolioData.monthlyGrowth}%`}
                subtitle="Performance portfolio"
                icon="📈"
                trend={`+${portfolioData.weeklyChange}%`}
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
                  {recentTransactions.slice(0, 3).map(transaction => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Vedi tutte le transazioni →
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">I Miei Token</h2>
                <div className="space-y-2">
                  {myTokens.slice(0, 3).map(token => (
                    <TokenRow key={token.symbol} token={token} />
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
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
              {myTokens.map(token => (
                <TokenRow key={token.symbol} token={token} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Mercato XRPL</h2>
            <div className="space-y-2">
              {marketData.map(market => (
                <MarketRow key={market.pair} market={market} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Tutte le Transazioni</h2>
            <div className="space-y-2">
              {recentTransactions.map(transaction => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardProfessionalNew;

