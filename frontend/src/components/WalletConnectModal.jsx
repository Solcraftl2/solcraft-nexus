import React from 'react';

const WalletConnectModal = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  const wallets = [
    {
      name: 'XUMM',
      icon: '🔷',
      description: 'XRPL native wallet with advanced features'
    },
    {
      name: 'Crossmark',
      icon: '✖️',
      description: 'Browser extension wallet for XRPL'
    },
    {
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Multi-chain mobile wallet'
    },
    {
      name: 'Web3Auth',
      icon: '🔐',
      description: 'Social login with wallet integration'
    }
  ];

  const handleWalletConnect = (walletName) => {
    // Simula connessione wallet
    setTimeout(() => {
      onConnect(walletName);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Choose your preferred wallet to access SolCraft Nexus
          </p>
        </div>

        {/* Wallet options */}
        <div className="space-y-3 mb-6">
          {wallets.map((wallet, index) => (
            <button
              key={index}
              onClick={() => handleWalletConnect(wallet.name)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{wallet.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {wallet.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {wallet.description}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Demo option */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => handleWalletConnect('Demo')}
            className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-center"
          >
            <div className="font-semibold text-gray-700">Continue with Demo</div>
            <div className="text-sm text-gray-500">Explore the platform without connecting a wallet</div>
          </button>
        </div>

        {/* Security notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-blue-900">Secure Connection</div>
              <div className="text-xs text-blue-700">
                Your wallet connection is encrypted and secure. We never store your private keys.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;

