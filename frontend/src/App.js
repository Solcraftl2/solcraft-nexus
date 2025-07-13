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
    <>
      {/* Error/Success Messages */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center">
            <span className="mr-2">❌</span>
            <div className="flex-1">
              <p className="font-semibold">Connection Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            <div className="flex-1">
              <p className="font-semibold">Success!</p>
              <p className="text-sm text-green-600 whitespace-pre-line">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-green-400 hover:text-green-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-white">
        {/* Professional Navigation */}
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-gray-900">
                  Solcraft Nexus
                </div>
                <div className="ml-4 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
                  Professional RWA Platform
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#analytics" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Analytics</a>
                <a href="#assets" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Assets</a>
                <a href="#marketplace" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Marketplace</a>
                <a href="#platform" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Platform</a>
                {connectedWallet ? (
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600 font-medium">
                      {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleOpenPortal}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                  >
                    View Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section - RWA.xyz style */}
      <section className="bg-white pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              Every tokenized asset,<br />
              <span className="text-blue-600">in one place.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Investors, issuers, and service providers use Solcraft Nexus to understand tokenized asset markets.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={handleOpenPortal}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-200"
              >
                View Analytics
              </button>
              <a
                href="#platform"
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                List Your Asset
              </a>
            </div>

            {/* Professional hero image */}
            <div className="relative mb-16">
              <img
                src="/api/placeholder/800/400"
                alt="Professional tokenization platform interface"
                className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-lg text-gray-600 mb-8">
              <strong>Trusted by institutions, investors, and media companies.</strong>
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60">
            {trustedPartners.map((partner, index) => (
              <div key={index} className="flex justify-center">
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  className="h-12 w-auto grayscale hover:grayscale-0 transition-all duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section id="analytics" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Solcraft Nexus is a purpose-built platform for understanding tokenization across public blockchains
            </h2>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {displayStats.tvl || '$245.3M'}
              </div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
                TOTAL VALUE LOCKED
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {displayStats.tracked || '850+'}
              </div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
                ASSETS TRACKED
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {displayStats.projects || '120+'}
              </div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
                ACTIVE PROJECTS
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {displayStats.transactions || '1.2M+'}
              </div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
                TRANSACTIONS
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {displayStats.users || '45.3K'}
              </div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
                USERS
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {displayStats.assets || '2.8K'}
              </div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
                ASSETS
              </div>
            </div>
          </div>

          {/* Platform Screenshot */}
          <div className="text-center">
            <img
              src="/api/placeholder/1200/600"
              alt="Solcraft Nexus platform interface"
              className="w-full max-w-6xl mx-auto rounded-xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Target Audience Cards */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Made for digital asset teams, token investors, and asset issuers
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                View Analytics ↗
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Discover both institutional and startup activity across asset classes and blockchain networks
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                API & Data Downloads ↗
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Power your research or investment platform with our API and data downloads
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                List Your Company ↗
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Integrate your assets into the leading data platform to access the largest institutional audience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Asset Classes */}
      <section id="assets" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Asset Classes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional tokenization across multiple asset classes with institutional-grade compliance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {assetClasses.map((asset, index) => (
              <div key={index} className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all duration-200">
                <div className="text-4xl mb-4">{asset.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{asset.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{asset.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Volume:</span>
                    <span className="font-semibold text-blue-600">{asset.volume}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Projects:</span>
                    <span className="font-semibold text-gray-900">{asset.projects}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our latest articles & research
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <img
                src="/api/placeholder/400/200"
                alt="Article preview"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="text-sm text-blue-600 font-medium mb-2">RESEARCH</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  The Future of Asset Tokenization
                </h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive analysis of tokenization trends and institutional adoption
                </p>
                <div className="text-sm text-gray-500">5 minutes read</div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <img
                src="/api/placeholder/400/200"
                alt="Article preview"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="text-sm text-blue-600 font-medium mb-2">ANALYSIS</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Real Estate Tokenization Report
                </h3>
                <p className="text-gray-600 mb-4">
                  Market insights and regulatory developments in property tokenization
                </p>
                <div className="text-sm text-gray-500">8 minutes read</div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <img
                src="/api/placeholder/400/200"
                alt="Article preview"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="text-sm text-blue-600 font-medium mb-2">GUIDE</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Getting Started with Tokenization
                </h3>
                <p className="text-gray-600 mb-4">
                  Step-by-step guide to tokenizing your first asset on our platform
                </p>
                <div className="text-sm text-gray-500">10 minutes read</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">
                Solcraft Nexus
              </div>
              <p className="text-gray-400 mb-6">
                The industry-standard data platform for tokenized real-world assets (RWAs). 
                Used by institutions, regulators, investors, and asset issuers.
              </p>
              <div className="text-sm text-gray-500">
                Contact: team@solcraft-nexus.com
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <div className="space-y-2">
                <a href="#about" className="text-gray-400 hover:text-white block transition-colors">About</a>
                <a href="#careers" className="text-gray-400 hover:text-white block transition-colors">Careers</a>
                <a href="#privacy" className="text-gray-400 hover:text-white block transition-colors">Privacy Policy</a>
                <a href="#terms" className="text-gray-400 hover:text-white block transition-colors">Terms of Use</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <div className="space-y-2">
                <a href="#dashboard" className="text-gray-400 hover:text-white block transition-colors">View Dashboard</a>
                <a href="#api" className="text-gray-400 hover:text-white block transition-colors">Data Downloads & API</a>
                <a href="#citations" className="text-gray-400 hover:text-white block transition-colors">Media & Citations</a>
                <a href="#community" className="text-gray-400 hover:text-white block transition-colors">Community Chat</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">For Issuers</h4>
              <div className="space-y-2">
                <a href="#list" className="text-gray-400 hover:text-white block transition-colors">List Your Assets</a>
                <a href="#contact" className="text-gray-400 hover:text-white block transition-colors">Contact Team</a>
                <a href="#twitter" className="text-gray-400 hover:text-white block transition-colors">X / Twitter</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>Copyright © Castle Labs, Inc. dba Solcraft Nexus</p>
          </div>
        </div>
      </footer>

      {/* Professional Wallet Connection Modal */}
      {walletModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full mx-4 border border-gray-200 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Connect Your Wallet</h3>
            <p className="text-gray-600 text-center mb-6">Connect to start tokenizing and trading assets</p>
            <div className="space-y-4">
              <button
                onClick={() => connectWallet('XUMM')}
                disabled={loading}
                className="w-full bg-blue-600 text-white p-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                <span className="mr-2">📱</span>
                XUMM Wallet
                <span className="ml-2 text-xs">(Recommended)</span>
              </button>
              <button
                onClick={() => connectWallet('Crossmark')}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 p-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                <span className="mr-2">✅</span>
                Crossmark
                <span className="ml-2 text-xs">(Browser Extension)</span>
              </button>
              <button
                onClick={() => connectWallet('Web3Auth')}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 p-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                <span className="mr-2">🔐</span>
                Web3Auth (Social)
                <span className="ml-2 text-xs">(Coming Soon)</span>
              </button>
            </div>
            <button
              onClick={() => setWalletModalOpen(false)}
              disabled={loading}
              className="w-full mt-6 border border-gray-300 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            {loading && (
              <div className="mt-4 text-center text-gray-600 text-sm">
                ⏳ Connecting wallet... Please wait.
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
