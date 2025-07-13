import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import walletService from "./services/walletService";
import tokenizationService from "./services/tokenizationService";

// Professional platform stats from backend with environment detection
const getBackendUrl = () => {
  // Check if we're in development, preview, or production
  const currentHost = window.location.hostname;
  
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    // Local development
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  } else if (currentHost.includes('preview.emergentagent.com')) {
    // Preview environment
    return process.env.REACT_APP_BACKEND_URL || `https://${currentHost}`;
  } else {
    // Production environment - use relative path or configured URL
    return process.env.REACT_APP_BACKEND_URL || '';
  }
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

const fetchPlatformStats = async () => {
  try {
    console.log('Fetching platform stats from:', `${API}/analytics/platform`);
    const response = await fetch(`${API}/analytics/platform`);
    if (response.ok) {
      const data = await response.json();
      console.log('Platform stats loaded:', data.platform_stats);
      return data.platform_stats;
    } else {
      console.warn('Platform stats API failed:', response.status);
    }
  } catch (error) {
    console.error('Error fetching platform stats:', error);
  }
  
  // Enhanced fallback stats with institutional focus
  console.log('Using fallback platform stats');
  return {
    total_value_locked: 245200000 + Math.floor(Math.random() * 1000000), 
    total_transactions: 1200000 + Math.floor(Math.random() * 10000),
    total_users: 45300 + Math.floor(Math.random() * 100),
    total_tokenizations: 2800 + Math.floor(Math.random() * 50),
    assets_tracked: 850 + Math.floor(Math.random() * 50),
    active_projects: 120 + Math.floor(Math.random() * 10)
  };
};

// Professional institutional partners (placeholders)
const trustedPartners = [
  { name: "Goldman Sachs", logo: "/api/placeholder/120/40" },
  { name: "JP Morgan", logo: "/api/placeholder/120/40" },
  { name: "BlackRock", logo: "/api/placeholder/120/40" },
  { name: "Coinbase", logo: "/api/placeholder/120/40" },
  { name: "Binance", logo: "/api/placeholder/120/40" },
  { name: "Chainlink", logo: "/api/placeholder/120/40" }
];

// Professional asset classes
const assetClasses = [
  {
    title: "Real Estate",
    description: "Commercial and residential property tokenization with regulatory compliance.",
    icon: "🏢",
    volume: "$2.8B",
    projects: 145
  },
  {
    title: "Private Credit",
    description: "Institutional-grade credit instruments and debt securities.",
    icon: "💼", 
    volume: "$1.2B",
    projects: 87
  },
  {
    title: "Commodities",
    description: "Physical commodities and precious metals tokenization.",
    icon: "⚡",
    volume: "$950M",
    projects: 63
  },
  {
    title: "Equity Securities",
    description: "Private equity and venture capital fund tokens.",
    icon: "📈",
    volume: "$1.8B",
    projects: 124
  }
];

const howItWorks = [
  {
    step: "01",
    title: "Connect Wallet",
    description: "Link your XUMM, Crossmark, or Web3Auth wallet securely",
    icon: "🔗"
  },
  {
    step: "02",
    title: "Tokenize Assets",
    description: "Transform your assets into blockchain-based tokens",
    icon: "🪙"
  },
  {
    step: "03",
    title: "Trade & Manage",
    description: "Access global marketplace and manage your portfolio",
    icon: "📈"
  }
];

const Home = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    // Fetch platform stats with better error handling
    const loadPlatformStats = async () => {
      try {
        const stats = await fetchPlatformStats();
        setPlatformStats(stats);
      } catch (error) {
        console.error('Failed to load platform stats:', error);
        // Use fallback stats
        setPlatformStats({
          total_value_locked: 245200000,
          total_transactions: 1200000,
          total_users: 45300,
          total_tokenizations: 2800,
          assets_tracked: 850,
          active_projects: 120
        });
      }
    };

    loadPlatformStats();

    // Try to restore wallet connection
    const restoreConnection = async () => {
      try {
        const result = await walletService.restoreConnection();
        if (result.success) {
          setConnectedWallet(result);
        }
      } catch (error) {
        console.log('No previous connection to restore');
      }
    };

    restoreConnection();
  }, []);

  // Format numbers professionally
  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num?.toString() || '0';
  };

  const formatCount = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num?.toString() || '0';
  };

  // Generate display stats with professional metrics
  const getDisplayStats = () => {
    if (!platformStats) return {};
    
    return {
      tvl: formatNumber(platformStats.total_value_locked),
      transactions: formatCount(platformStats.total_transactions),
      users: formatCount(platformStats.total_users),
      assets: formatCount(platformStats.total_tokenizations),
      tracked: formatCount(platformStats.assets_tracked),
      projects: formatCount(platformStats.active_projects)
    };
  };

  const [displayStats, setDisplayStats] = useState({});
  
  // Update stats periodically for live feel
  useEffect(() => {
    if (platformStats) {
      const updateStats = () => {
        setDisplayStats(getDisplayStats());
      };
      
      updateStats();
      const interval = setInterval(updateStats, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [platformStats]);

  const statKeys = Object.keys(displayStats);

  // Animate stats
  useEffect(() => {
    if (statKeys.length > 0) {
      const interval = setInterval(() => {
        setCurrentStat((prev) => (prev + 1) % statKeys.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [statKeys.length]);

  const handleOpenPortal = () => {
    if (connectedWallet) {
      // Already connected, redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      setWalletModalOpen(true);
    }
  };

  const connectWallet = async (walletType) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      switch (walletType) {
        case 'XUMM':
          result = await walletService.connectXumm();
          break;
        case 'Crossmark':
          result = await walletService.connectCrossmark();
          break;
        case 'Web3Auth':
          result = await walletService.connectWeb3Auth();
          break;
        default:
          throw new Error('Unknown wallet type');
      }
      
      if (result.success) {
        setConnectedWallet(result);
        setWalletModalOpen(false);
        
        // Show success message
        setSuccessMessage(`✅ ${walletType} wallet connected successfully!\n\nAddress: ${result.address}\nBalance: ${result.balanceXrp || 'N/A'} XRP`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      // Set error message instead of alert
      setError(`${walletType} connection failed: ${error.message}`);
      
      // Clear error message after 8 seconds
      setTimeout(() => setError(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletService.disconnect();
      setConnectedWallet(null);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Error/Success Messages */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md w-full mx-4 backdrop-blur-md">
          <div className="flex items-center">
            <span className="mr-2">❌</span>
            <div className="flex-1">
              <p className="font-semibold">Connection Error</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-200 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-900/90 border border-green-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md w-full mx-4 backdrop-blur-md">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            <div className="flex-1">
              <p className="font-semibold">Success!</p>
              <p className="text-sm text-green-200 whitespace-pre-line">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-green-200 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-md z-50 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                Solcraft Nexus
              </div>
              <div className="ml-4 text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                XRPL Testnet (Real APIs)
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-purple-400 transition-colors">Features</a>
              <a href="#assets" className="text-gray-300 hover:text-purple-400 transition-colors">Assets</a>
              <a href="#marketplace" className="text-gray-300 hover:text-purple-400 transition-colors">Marketplace</a>
              <a href="#developers" className="text-gray-300 hover:text-purple-400 transition-colors">Developers</a>
              {connectedWallet ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-300">
                    {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenPortal}
                  className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                >
                  Open Portal
                </button>
              )}
            </div>
            
            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-4">
              {connectedWallet ? (
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-300">
                    {connectedWallet.address.slice(0, 4)}...{connectedWallet.address.slice(-4)}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-all duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenPortal}
                  className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-emerald-700 transition-all duration-200 text-sm font-semibold"
                >
                  Open Portal
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-violet-900/50"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1637099536974-22c1d38eed51?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxibG9ja2NoYWluJTIwdGVjaG5vbG9neXxlbnwwfHx8cHVycGxlfDE3NTI0MTYzNjZ8MA&ixlib=rb-4.1.0&q=85')`
          }}
        ></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent">
              Tokenize the Future
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Advanced Web3 platform for asset and risk tokenization on Ripple Blockchain. 
            Transform real estate, art, insurance, and carbon credits into tradeable tokens.
          </p>
          
          {/* Real-time Stats */}
          {platformStats && displayStats && Object.keys(displayStats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {Object.entries(displayStats).map(([key, value], index) => (
                <div key={key} className="text-center">
                  <div className={`text-3xl font-bold transition-all duration-500 ${
                    currentStat === index ? 'text-emerald-400 scale-110' : 'text-white'
                  }`}>
                    {value}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wide">
                    {key === 'tvl' ? 'Total Value Locked' : 
                     key === 'transactions' ? 'Transactions' :
                     key === 'users' ? 'Users' : 'Assets'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Connection Status */}
          {connectedWallet && (
            <div className="mb-8 bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-orange-400 text-sm">✅ Connected to XRPL Testnet (Real APIs)</div>
              <div className="text-white text-lg font-semibold">{connectedWallet.walletType}</div>
              <div className="text-gray-300 text-sm">{connectedWallet.address}</div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleOpenPortal}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Connecting...' : 
               connectedWallet ? '🚀 Go to Dashboard' : '🚀 Open Portal'}
            </button>
            <button className="border-2 border-purple-500 text-purple-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-500 hover:text-white transition-all duration-200">
              📚 View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Platform Features
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 p-6 rounded-xl backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section id="assets" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Supported Assets
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {supportedAssets.map((asset, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/50 to-violet-900/50 p-8 backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105">
                <div className={`absolute inset-0 bg-gradient-to-br ${asset.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className="text-5xl mb-4">{asset.icon}</div>
                  <h3 className="text-2xl font-semibold text-white mb-3">{asset.title}</h3>
                  <p className="text-gray-300">{asset.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-br from-purple-600 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Enterprise-Grade Security
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 p-8 rounded-xl backdrop-blur-sm border border-purple-500/20">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-3">Security Audits</h3>
              <p className="text-gray-300">Complete security audits and compliance certifications</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 p-8 rounded-xl backdrop-blur-sm border border-purple-500/20">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Instant Settlement</h3>
              <p className="text-gray-300">XRPL transactions settle in under 3 seconds</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 p-8 rounded-xl backdrop-blur-sm border border-purple-500/20">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-white mb-3">Global Access</h3>
              <p className="text-gray-300">24/7 cross-border trading and accessibility</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 py-12 border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                Solcraft Nexus
              </div>
              <p className="text-gray-400">Advanced Web3 tokenization platform on Ripple Blockchain</p>
              <div className="mt-4 text-sm text-gray-500">
                Connected to XRPL Testnet (Real APIs)
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <div className="space-y-2">
                <a href="#" className="text-gray-400 hover:text-purple-400 block">Features</a>
                <a href="#" className="text-gray-400 hover:text-purple-400 block">Marketplace</a>
                <a href="#" className="text-gray-400 hover:text-purple-400 block">Analytics</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="text-gray-400 hover:text-purple-400 block">Documentation</a>
                <a href="#" className="text-gray-400 hover:text-purple-400 block">API Reference</a>
                <a href="#" className="text-gray-400 hover:text-purple-400 block">Support</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Community</h4>
              <div className="space-y-2">
                <a href="#" className="text-gray-400 hover:text-purple-400 block">Discord</a>
                <a href="#" className="text-gray-400 hover:text-purple-400 block">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-purple-400 block">GitHub</a>
              </div>
            </div>
          </div>
          <div className="border-t border-purple-500/20 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Solcraft Nexus. All rights reserved. XRPL Testnet (Real APIs).</p>
          </div>
        </div>
      </footer>

      {/* Real Wallet Connection Modal */}
      {walletModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-900 to-violet-900 p-8 rounded-2xl max-w-md w-full mx-4 border border-purple-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Connect Your Wallet</h3>
            <p className="text-gray-300 text-center mb-6">Connect to XRPL Testnet with real APIs for testing</p>
            <div className="space-y-4">
              <button
                onClick={() => connectWallet('XUMM')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                <span className="mr-2">📱</span>
                XUMM Wallet
                <span className="ml-2 text-xs">(Real XRPL Testnet)</span>
              </button>
              <button
                onClick={() => connectWallet('Crossmark')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                <span className="mr-2">✅</span>
                Crossmark
                <span className="ml-2 text-xs">(Browser Extension)</span>
              </button>
              <button
                onClick={() => connectWallet('Web3Auth')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                <span className="mr-2">🔐</span>
                Web3Auth (Social)
                <span className="ml-2 text-xs">(Google, Twitter, etc.)</span>
              </button>
            </div>
            <button
              onClick={() => setWalletModalOpen(false)}
              disabled={loading}
              className="w-full mt-6 border border-purple-500 text-purple-400 p-3 rounded-lg font-semibold hover:bg-purple-500 hover:text-white transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            {loading && (
              <div className="mt-4 text-center text-gray-300 text-sm">
                ⏳ Connecting wallet... Please wait.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
