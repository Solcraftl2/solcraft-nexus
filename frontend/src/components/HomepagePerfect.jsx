import React, { useState } from 'react';

const HomepagePerfect = ({ onOpenPortal }) => {
  const [activePortalTab, setActivePortalTab] = useState('staking');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6">
        <div className="flex items-center space-x-8">
          <div className="text-2xl font-bold text-black">SolCraft Nexus</div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-black">For Institutions</a>
          </nav>
        </div>
        <button 
          onClick={onOpenPortal}
          className="px-6 py-2 border-2 border-green-500 text-green-500 rounded-full hover:bg-green-50 transition-colors"
        >
          Open Portal
        </button>
      </header>

      {/* Hero Section */}
      <section className="px-8 py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-black mb-8 leading-tight">
          Bringing global assets on-chain.
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto">
          Odyssey is a purpose-built RWA Layer 1, setting regulatory standards to integrate 
          crypto with the real estate and investment sectors.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={onOpenPortal}
            className="px-8 py-4 border-2 border-green-500 text-green-500 rounded-full hover:bg-green-50 transition-colors text-lg font-medium"
          >
            Open Portal
          </button>
          <button className="px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-lg font-medium">
            Learn More
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-20 relative overflow-hidden">
        {/* Network Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 1000 600">
            {/* Network nodes and connections */}
            <defs>
              <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </radialGradient>
            </defs>
            {/* Nodes */}
            <circle cx="100" cy="100" r="4" fill="url(#nodeGradient)" />
            <circle cx="300" cy="150" r="6" fill="url(#nodeGradient)" />
            <circle cx="500" cy="80" r="5" fill="url(#nodeGradient)" />
            <circle cx="700" cy="200" r="4" fill="url(#nodeGradient)" />
            <circle cx="900" cy="120" r="5" fill="url(#nodeGradient)" />
            <circle cx="200" cy="300" r="4" fill="url(#nodeGradient)" />
            <circle cx="400" cy="350" r="6" fill="url(#nodeGradient)" />
            <circle cx="600" cy="280" r="5" fill="url(#nodeGradient)" />
            <circle cx="800" cy="400" r="4" fill="url(#nodeGradient)" />
            {/* Connections */}
            <line x1="100" y1="100" x2="300" y2="150" stroke="url(#nodeGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="300" y1="150" x2="500" y2="80" stroke="url(#nodeGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="500" y1="80" x2="700" y2="200" stroke="url(#nodeGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="700" y1="200" x2="900" y2="120" stroke="url(#nodeGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="200" y1="300" x2="400" y2="350" stroke="url(#nodeGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="400" y1="350" x2="600" y2="280" stroke="url(#nodeGradient)" strokeWidth="1" opacity="0.3" />
            <line x1="600" y1="280" x2="800" y2="400" stroke="url(#nodeGradient)" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-semibold text-gray-500 mb-4 tracking-wider">OUR FEATURES</p>
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2">
              <h2 className="text-5xl md:text-7xl font-bold text-black mb-8 leading-tight">
                PermissionLess<br />
                Chain<br />
                for<br />
                Permissioned<br />
                Apps.
              </h2>
            </div>
            <div className="lg:w-1/2 flex flex-col gap-4">
              <button 
                onClick={onOpenPortal}
                className="px-8 py-4 border-2 border-green-500 text-green-500 rounded-full hover:bg-green-50 transition-colors text-lg font-medium"
              >
                Open Portal
              </button>
              <button className="px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-lg font-medium">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Three Columns Section */}
      <section className="px-8 py-20">
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-4">Interoperability</h3>
            <p className="text-gray-600">
              Odyssey is an EVM compatible chain, making cross chain asset transfers easy with all popular networks.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-4">Hybrid</h3>
            <p className="text-gray-600">
              Odyssey is a permissionless chain, but with our Infi-Nets, we allow permissioned use cases as well.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 mb-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-4">Decentralized</h3>
            <p className="text-gray-600">
              A higher validator count enables us to maintain a greater degree of decentralization. The DPoS model allows us to incentivize the community as well.
            </p>
          </div>
        </div>
      </section>

      {/* Portal Section */}
      <section className="px-8 py-20 bg-gradient-to-br from-purple-400 via-purple-500 to-blue-500 text-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold mb-4 tracking-wider opacity-90">ACCESS THE SOLCRAFT PORTAL</p>
          <h2 className="text-5xl md:text-6xl font-bold mb-12 leading-tight">
            Simplify your crypto investments with SolCraft's Asset Portal.
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4">
              <div className="space-y-4">
                {[
                  { id: 'validators', label: 'Validators', icon: '✓' },
                  { id: 'nft', label: 'NFT', icon: '🖼️' },
                  { id: 'bridge', label: 'Token Bridge', icon: '🔗' },
                  { id: 'staking', label: 'Staking', icon: '💰' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePortalTab(tab.id)}
                    className={`w-full p-4 text-left rounded-lg transition-colors ${
                      activePortalTab === tab.id 
                        ? 'bg-white bg-opacity-20 border-2 border-white' 
                        : 'bg-white bg-opacity-10 hover:bg-opacity-15'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="lg:w-3/4">
              <div className="bg-white bg-opacity-10 rounded-lg p-8 backdrop-blur-sm">
                {activePortalTab === 'staking' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-4">Staking</h3>
                    <p className="text-lg opacity-90">
                      Stake your $SOLCRAFT tokens to earn rewards and participate in governance.
                    </p>
                  </div>
                )}
                {activePortalTab === 'validators' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-4">Validators</h3>
                    <p className="text-lg opacity-90">
                      Secure the network and earn rewards by running a validator node.
                    </p>
                  </div>
                )}
                {activePortalTab === 'nft' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-4">NFT</h3>
                    <p className="text-lg opacity-90">
                      Trade and manage tokenized real estate and asset NFTs.
                    </p>
                  </div>
                )}
                {activePortalTab === 'bridge' && (
                  <div>
                    <h3 className="text-3xl font-bold mb-4">Token Bridge</h3>
                    <p className="text-lg opacity-90">
                      Bridge assets seamlessly across different blockchain networks.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Section */}
      <section className="px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold text-gray-500 mb-4 tracking-wider">ACCESS THE SOLCRAFT PORTAL</p>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-5xl md:text-6xl font-bold text-black mb-8 leading-tight">
                $SOLCRAFT Token: Powering the Future of on-chain assets
              </h2>
              <button className="px-8 py-4 border-2 border-green-500 text-green-500 rounded-full hover:bg-green-50 transition-colors text-lg font-medium mb-8">
                Buy $SOLCRAFT
              </button>
              <p className="text-xl text-gray-600">
                Odyssey is a purpose-built RWA Layer 1, setting regulatory standards to integrate 
                crypto with the real estate and investment sectors.
              </p>
            </div>
            <div className="lg:w-1/2">
              {/* Spiral/Vortex Image Placeholder */}
              <div className="w-full h-96 bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 rounded-full opacity-80 flex items-center justify-center">
                <div className="w-3/4 h-3/4 bg-gradient-to-br from-purple-500 via-pink-400 to-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-1/2 h-1/2 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-16 space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-black mb-2">What are the options to buy $SOLCRAFT?</h3>
              <p className="text-gray-600">
                You can buy $SOLCRAFT using your credit/debit card or you can check the Buy on Exchange section to 
                see the list of exchanges that support $SOLCRAFT.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-black mb-2">What is the price of each $SOLCRAFT token?</h3>
              <p className="text-gray-600">
                Price per $SOLCRAFT is 0.000915103990000001
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold text-black mb-2">What is the fee for buying $SOLCRAFT?</h3>
              <p className="text-gray-600">
                We do not charge any fee. However, depending on whether you are buying using a card or 
                exchange, you might be subjected to the 3rd party's service fee and transaction fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-8 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-black mb-12">Meet our team</h2>
          <div className="flex gap-4 mb-8">
            <button className="px-6 py-3 border-2 border-green-500 text-green-500 rounded-lg font-medium">
              Team
            </button>
            <button className="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:border-green-500 hover:text-green-500 transition-colors">
              Advisors
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Brandon Kokoski', role: 'Vice President' },
              { name: 'Maxim Prishchepo', role: 'CTO / Head of Blockchain' },
              { name: 'Azeem Saifi', role: 'Senior Development Manager' }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-gray-300 rounded-lg mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-black">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-black mb-12">SolCraft in the News</h2>
          <div className="flex justify-between items-center mb-8">
            <button className="px-8 py-4 border-2 border-green-500 text-green-500 rounded-full hover:bg-green-50 transition-colors text-lg font-medium">
              Read all
            </button>
            <div className="flex gap-2">
              <button className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-green-500 transition-colors">
                ←
              </button>
              <button className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-green-500 transition-colors">
                →
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                date: 'Sep 28, 2024',
                title: 'SolCraft Nexus Launches Odyssey: A Sustainable Layer 1 Blockchain Solution',
                description: 'SolCraft Nexus unveiled Odyssey, a Layer 1 blockchain powered entirely by renewable energy sources.'
              },
              {
                date: 'Nov 22, 2024',
                title: 'SolCraft Nexus Announces SOLCRAFT SPARK: A Grants & Accelerator Program',
                description: 'SOLCRAFT SPARK is a new initiative offering grants and mentorship to eco-conscious Web3 projects.'
              }
            ].map((news, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500"></div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-2">{news.date}</p>
                  <h3 className="text-xl font-semibold text-black mb-2">{news.title}</h3>
                  <p className="text-gray-600">{news.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="px-8 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-black mb-12">Our Partners</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-8 flex items-center justify-center h-24">
                <div className="w-16 h-16 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button className="px-8 py-4 border-2 border-green-500 text-green-500 rounded-full hover:bg-green-50 transition-colors text-lg font-medium">
              Show 20+ more
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
            <div className="lg:w-1/3">
              <h3 className="text-4xl font-bold text-black mb-4">SolCraft Nexus</h3>
              <p className="text-gray-600 mb-2">© 2022-2025 SolCraft Nexus LLC | All Rights Reserved</p>
              <p className="text-gray-600 mb-8">Powered by Renewables</p>
              <button 
                onClick={onOpenPortal}
                className="px-8 py-4 border-2 border-green-500 text-green-500 rounded-full hover:bg-green-50 transition-colors text-lg font-medium"
              >
                Open Portal
              </button>
            </div>
            
            <div className="lg:w-1/3">
              <div className="space-y-4">
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">Disclaimer</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">Terms of Service</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">Privacy Policy</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">Branding</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">API Docs</a>
              </div>
            </div>
            
            <div className="lg:w-1/3">
              <div className="space-y-4">
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">Discord</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">Telegram</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">Twitter</a>
                <a href="#" className="block text-gray-600 hover:text-black transition-colors">GitHub</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomepagePerfect;

