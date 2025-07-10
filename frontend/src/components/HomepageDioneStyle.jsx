import React from 'react';

const HomepageDioneStyle = ({ onOpenPortal }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">
            SolCraft Nexus
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#about" className="text-gray-700 hover:text-gray-900 transition-colors">
              About
            </a>
            <a href="#contact" className="text-gray-700 hover:text-gray-900 transition-colors">
              Contact
            </a>
          </div>
          <div className="text-sm text-gray-600">
            For Institutions
          </div>
        </div>
      </nav>

      {/* Hero Section 1 - Gradient Background */}
      <section className="min-h-screen relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-200 via-blue-300 to-purple-400"></div>
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Bringing global assets on-chain.
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onOpenPortal}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 border-2 border-green-600"
                >
                  Open Portal
                </button>
                <button className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <p className="text-xl text-gray-700 leading-relaxed">
                SolCraft Nexus is a purpose-built tokenization platform, 
                setting regulatory standards to integrate real-world assets 
                with blockchain technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section 2 - Network Pattern Background */}
      <section className="min-h-screen relative overflow-hidden bg-gray-100">
        {/* Network Pattern Background */}
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-20" viewBox="0 0 1000 1000">
            {/* Network nodes and connections */}
            <defs>
              <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="2" fill="#374151" opacity="0.5"/>
                <line x1="50" y1="50" x2="150" y2="50" stroke="#374151" strokeWidth="1" opacity="0.3"/>
                <line x1="50" y1="50" x2="50" y2="150" stroke="#374151" strokeWidth="1" opacity="0.3"/>
                <line x1="50" y1="50" x2="100" y2="100" stroke="#374151" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network)"/>
            
            {/* Animated network nodes */}
            <g className="animate-pulse">
              <circle cx="200" cy="200" r="8" fill="#374151" opacity="0.6"/>
              <circle cx="400" cy="150" r="6" fill="#374151" opacity="0.4"/>
              <circle cx="600" cy="300" r="10" fill="#374151" opacity="0.8"/>
              <circle cx="800" cy="250" r="7" fill="#374151" opacity="0.5"/>
              <circle cx="300" cy="400" r="9" fill="#374151" opacity="0.7"/>
              <circle cx="700" cy="500" r="5" fill="#374151" opacity="0.3"/>
            </g>
            
            {/* Connection lines */}
            <g stroke="#374151" strokeWidth="2" opacity="0.3">
              <line x1="200" y1="200" x2="400" y2="150"/>
              <line x1="400" y1="150" x2="600" y2="300"/>
              <line x1="600" y1="300" x2="800" y2="250"/>
              <line x1="300" y1="400" x2="600" y2="300"/>
              <line x1="700" y1="500" x2="800" y2="250"/>
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Platform for Tokenized Assets.
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onOpenPortal}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 border-2 border-green-600"
                >
                  Open Portal
                </button>
                <button className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <p className="text-xl text-gray-700 leading-relaxed">
                Transform real estate, equity, and financial assets into 
                digital tokens. Access liquidity, fractional ownership, 
                and automated yield distribution through XRPL technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional tokenization platform with enterprise-grade security and compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Real Estate Tokenization
              </h3>
              <p className="text-gray-600">
                Convert properties into digital tokens for fractional ownership and enhanced liquidity
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                XRPL Security
              </h3>
              <p className="text-gray-600">
                Enterprise-grade security with XRP Ledger technology for fast and secure transactions
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Automated Yields
              </h3>
              <p className="text-gray-600">
                Automatic distribution of dividends and returns directly to your wallet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ACCESS THE SOLCRAFT PORTAL
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join the revolution of asset tokenization. Connect your wallet and start 
            tokenizing your real-world assets today.
          </p>
          <button
            onClick={onOpenPortal}
            className="px-12 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 text-lg"
          >
            Open Portal
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SolCraft Nexus</h3>
              <p className="text-gray-400">
                Professional tokenization platform for real-world assets
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Tokenization</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Portfolio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Marketplace</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SolCraft Nexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomepageDioneStyle;

