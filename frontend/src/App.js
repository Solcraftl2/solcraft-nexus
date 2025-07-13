import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock data for demonstration
const mockStats = {
  tvl: "$245.2M",
  transactions: "1.2M+",
  users: "45.3K",
  assets: "2.8K"
};

const supportedAssets = [
  {
    icon: "🏠",
    title: "Real Estate",
    description: "Tokenize property investments with instant liquidity",
    color: "from-blue-500 to-purple-600"
  },
  {
    icon: "🎨",
    title: "Art & Collectibles",
    description: "Transform artistic assets into tradeable NFTs",
    color: "from-pink-500 to-orange-500"
  },
  {
    icon: "🛡️",
    title: "Insurance & Risk",
    description: "Tokenize policies, guarantees, and risk instruments",
    color: "from-green-500 to-blue-500"
  },
  {
    icon: "🌱",
    title: "Carbon Credits",
    description: "Trade sustainability tokens for environmental impact",
    color: "from-green-400 to-emerald-600"
  },
  {
    icon: "🚗",
    title: "Physical Assets",
    description: "Commodities and tangible asset tokenization",
    color: "from-yellow-500 to-red-500"
  }
];

const features = [
  {
    icon: "🪙",
    title: "Advanced Tokenization",
    description: "Asset-backed tokens following XRPL best practices with complete metadata management"
  },
  {
    icon: "💸",
    title: "Native XRP Payments",
    description: "Instant cross-border transactions with optimized fee management"
  },
  {
    icon: "📊",
    title: "Real-time Analytics",
    description: "Portfolio dashboard with performance metrics and risk assessment"
  },
  {
    icon: "🏛️",
    title: "Integrated Marketplace",
    description: "P2P trading, liquidity pools, and secure escrow services"
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
  const statKeys = Object.keys(mockStats);

  const helloWorldApi = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log(response.data.message);
    } catch (e) {
      console.error(e, `errored out requesting / api`);
    }
  };

  useEffect(() => {
    helloWorldApi();
  }, []);

  // Animate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % statKeys.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenPortal = () => {
    setWalletModalOpen(true);
  };

  const connectWallet = (walletType) => {
    console.log(`Connecting to ${walletType}...`);
    // TODO: Implement actual wallet connection
    setWalletModalOpen(false);
    alert(`${walletType} wallet connection will be implemented in next phase`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-md z-50 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                Solcraft Nexus
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-purple-400 transition-colors">Features</a>
              <a href="#assets" className="text-gray-300 hover:text-purple-400 transition-colors">Assets</a>
              <a href="#marketplace" className="text-gray-300 hover:text-purple-400 transition-colors">Marketplace</a>
              <a href="#developers" className="text-gray-300 hover:text-purple-400 transition-colors">Developers</a>
              <button
                onClick={handleOpenPortal}
                className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
              >
                Open Portal
              </button>
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
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {Object.entries(mockStats).map(([key, value], index) => (
              <div key={key} className="text-center">
                <div className={`text-3xl font-bold transition-all duration-500 ${
                  currentStat === index ? 'text-emerald-400 scale-110' : 'text-white'
                }`}>
                  {value}
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">
                  {key === 'tvl' ? 'Total Value Locked' : key}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleOpenPortal}
              className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
            >
              🚀 Open Portal
            </button>
            <button className="border-2 border-purple-500 text-purple-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-500 hover:text-white transition-all duration-200">
              📚 Learn More
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
            <p>&copy; 2024 Solcraft Nexus. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Wallet Connection Modal */}
      {walletModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-900 to-violet-900 p-8 rounded-2xl max-w-md w-full mx-4 border border-purple-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Connect Your Wallet</h3>
            <div className="space-y-4">
              <button
                onClick={() => connectWallet('XUMM')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
              >
                <span className="mr-2">📱</span>
                XUMM Wallet
              </button>
              <button
                onClick={() => connectWallet('Crossmark')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center"
              >
                <span className="mr-2">✅</span>
                Crossmark
              </button>
              <button
                onClick={() => connectWallet('Web3Auth')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center"
              >
                <span className="mr-2">🔐</span>
                Web3Auth (Social)
              </button>
            </div>
            <button
              onClick={() => setWalletModalOpen(false)}
              className="w-full mt-6 border border-purple-500 text-purple-400 p-3 rounded-lg font-semibold hover:bg-purple-500 hover:text-white transition-all duration-200"
            >
              Cancel
            </button>
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
