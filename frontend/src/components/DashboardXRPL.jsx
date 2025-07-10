import React, { useState, useEffect } from 'react';
import xrplService from '../services/xrplService';
import XRPLWallet from './XRPLWallet';
import AssetTokenizer from './AssetTokenizer';

const DashboardXRPL = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [walletData, setWalletData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    if (user && user.address) {
      setWalletData(user);
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    if (!user?.address) return;
    
    try {
      setIsLoading(true);
      
      // Carica bilancio
      const currentBalance = await xrplService.getBalance(user.address);
      setBalance(currentBalance);
      
      // Carica transazioni
      const txHistory = await xrplService.getTransactionHistory(user.address, 10);
      setTransactions(txHistory);
      
      // Carica token creati
      const savedTokens = localStorage.getItem(`tokens_${user.address}`);
      if (savedTokens) {
        setTokens(JSON.parse(savedTokens));
      }
      
      // Info network
      setNetworkInfo(xrplService.getNetworkInfo());
      
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletChange = (newWallet) => {
    setWalletData(newWallet);
    if (newWallet) {
      loadWalletData();
    }
  };

  const handleTokenCreated = (tokenData) => {
    setTokens(prev => [...prev, tokenData]);
    loadWalletData(); // Refresh data
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'wallet', name: 'Wallet', icon: '💼' },
    { id: 'tokenize', name: 'Tokenize', icon: '🪙' },
    { id: 'trading', name: 'Trading', icon: '📈' },
    { id: 'analytics', name: 'Analytics', icon: '📋' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo e titolo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SolCraft Nexus</h1>
                <p className="text-sm text-gray-500">XRPL Asset Tokenization Platform</p>
              </div>
            </div>
            
            {/* Status e profilo */}
            <div className="flex items-center space-x-4">
              {/* Network Status */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${networkInfo?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-700">
                  {networkInfo?.network || 'Disconnected'}
                </span>
              </div>
              
              {/* Wallet Info */}
              {walletData && (
                <div className="text-sm text-gray-600">
                  <div className="font-mono">{formatAddress(walletData.address)}</div>
                  <div className="text-xs">{balance.toFixed(6)} XRP</div>
                </div>
              )}
              
              {/* Logout */}
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
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
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">XRP</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">XRP Balance</div>
                    <div className="text-2xl font-bold text-gray-900">{balance.toFixed(6)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🪙</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Tokens Created</div>
                    <div className="text-2xl font-bold text-gray-900">{tokens.length}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Total Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(tokens.reduce((sum, token) => sum + parseFloat(token.valuation || 0), 0))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-500">Transactions</div>
                    <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                </div>
                <div className="p-6">
                  {transactions.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No transactions found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.slice(0, 5).map((tx, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">TX</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {tx.tx.TransactionType}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(tx.tx.date)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {tx.tx.Amount && (
                              <div className="text-sm font-medium text-gray-900">
                                {typeof tx.tx.Amount === 'string' 
                                  ? `${xrplService.dropsToXrp(tx.tx.Amount)} XRP`
                                  : `${tx.tx.Amount.value} ${tx.tx.Amount.currency}`
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Created Tokens */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Your Tokens</h3>
                </div>
                <div className="p-6">
                  {tokens.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No tokens created yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tokens.slice(0, 3).map((token) => (
                        <div key={token.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-xs font-bold">{token.tokenCode}</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {token.assetName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {parseInt(token.totalSupply).toLocaleString()} tokens
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(token.valuation)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <XRPLWallet 
            onWalletChange={handleWalletChange}
            initialNetwork={networkInfo?.network || 'testnet'}
          />
        )}

        {/* Tokenize Tab */}
        {activeTab === 'tokenize' && (
          <AssetTokenizer 
            wallet={walletData}
            onTokenCreated={handleTokenCreated}
          />
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trading Coming Soon</h3>
              <p className="text-gray-600">DEX trading functionality will be available soon</p>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-600">Advanced analytics and reporting features will be available soon</p>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-gray-700">Loading wallet data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardXRPL;

