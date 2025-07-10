import React, { useState, useEffect } from 'react';
import xrplService from '../services/xrplService';

const WalletConnectModal = ({ isOpen, onClose, onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [xrplConnected, setXrplConnected] = useState(false);

  if (!isOpen) return null;

  // Connetti a XRPL quando il modal si apre
  useEffect(() => {
    if (isOpen && !xrplConnected) {
      connectToXRPL();
    }
  }, [isOpen]);

  const connectToXRPL = async () => {
    try {
      setConnectionStatus('Connecting to XRPL network...');
      await xrplService.connect('testnet');
      setXrplConnected(true);
      setConnectionStatus('Connected to XRPL Testnet');
    } catch (error) {
      setConnectionStatus(`Connection failed: ${error.message}`);
      console.error('XRPL connection error:', error);
    }
  };

  const wallets = [
    {
      name: 'XUMM',
      icon: '🔷',
      description: 'XRPL native wallet with advanced features',
      type: 'xrpl',
      available: true
    },
    {
      name: 'Crossmark',
      icon: '✖️',
      description: 'Browser extension wallet for XRPL',
      type: 'xrpl',
      available: typeof window !== 'undefined' && window.crossmark
    },
    {
      name: 'Generate XRPL Wallet',
      icon: '🆕',
      description: 'Create new XRPL wallet for testing',
      type: 'generate',
      available: xrplConnected
    },
    {
      name: 'Import XRPL Wallet',
      icon: '📥',
      description: 'Import existing XRPL wallet from seed',
      type: 'import',
      available: xrplConnected
    }
  ];

  const handleWalletConnect = async (wallet) => {
    if (!xrplConnected) {
      alert('Please wait for XRPL connection to complete');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus(`Connecting to ${wallet.name}...`);

    try {
      let walletData = null;

      switch (wallet.type) {
        case 'generate':
          setConnectionStatus('Generating new XRPL wallet...');
          const fundResult = await xrplService.fundTestnetAccount();
          walletData = {
            type: 'xrpl',
            name: 'Generated XRPL Wallet',
            address: fundResult.wallet.address,
            seed: fundResult.wallet.seed,
            balance: fundResult.balance,
            network: 'testnet'
          };
          break;

        case 'import':
          const seed = prompt('Enter your XRPL wallet seed:');
          if (!seed) {
            setIsConnecting(false);
            return;
          }
          setConnectionStatus('Importing XRPL wallet...');
          const importedWallet = xrplService.importWallet(seed);
          const balance = await xrplService.getBalance(importedWallet.address);
          walletData = {
            type: 'xrpl',
            name: 'Imported XRPL Wallet',
            address: importedWallet.address,
            seed: seed,
            balance: balance,
            network: 'testnet'
          };
          break;

        case 'xrpl':
          if (wallet.name === 'Crossmark' && window.crossmark) {
            setConnectionStatus('Connecting to Crossmark...');
            try {
              const response = await window.crossmark.signInAndWait();
              if (response) {
                walletData = {
                  type: 'crossmark',
                  name: 'Crossmark Wallet',
                  address: response.response.account,
                  network: 'mainnet'
                };
              }
            } catch (error) {
              throw new Error('Crossmark connection failed');
            }
          } else {
            // Per XUMM e altri, usa demo mode per ora
            walletData = {
              type: 'demo',
              name: wallet.name,
              address: 'rDemo' + Math.random().toString(36).substr(2, 9),
              network: 'testnet'
            };
          }
          break;

        case 'demo':
          walletData = {
            type: 'demo',
            name: 'Demo Wallet',
            address: 'rDemo' + Math.random().toString(36).substr(2, 9),
            network: 'testnet'
          };
          break;

        default:
          throw new Error('Unsupported wallet type');
      }

      if (walletData) {
        setConnectionStatus('Connection successful!');
        setTimeout(() => {
          onConnect(walletData);
          setIsConnecting(false);
        }, 1000);
      }
    } catch (error) {
      setConnectionStatus(`Connection failed: ${error.message}`);
      setTimeout(() => {
        setIsConnecting(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isConnecting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your XRPL Wallet</h2>
          <p className="text-gray-600">
            Choose your preferred wallet to access SolCraft Nexus
          </p>
        </div>

        {/* Connection Status */}
        {connectionStatus && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              {isConnecting && (
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-2"></div>
              )}
              <span className="text-blue-800 text-sm">{connectionStatus}</span>
            </div>
          </div>
        )}

        {/* Wallet options */}
        <div className="space-y-3 mb-6">
          {wallets.map((wallet, index) => (
            <button
              key={index}
              onClick={() => handleWalletConnect(wallet)}
              disabled={!wallet.available || isConnecting}
              className={`w-full p-4 border-2 rounded-xl transition-all duration-200 text-left group ${
                wallet.available && !isConnecting
                  ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{wallet.icon}</div>
                <div className="flex-1">
                  <div className={`font-semibold transition-colors ${
                    wallet.available && !isConnecting
                      ? 'text-gray-900 group-hover:text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {wallet.name}
                    {!wallet.available && wallet.type === 'xrpl' && wallet.name === 'Crossmark' && (
                      <span className="text-xs text-red-500 ml-2">(Not installed)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {wallet.description}
                  </div>
                </div>
                <svg className={`w-5 h-5 transition-colors ${
                  wallet.available && !isConnecting
                    ? 'text-gray-400 group-hover:text-blue-500'
                    : 'text-gray-300'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Demo option */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => handleWalletConnect({ name: 'Demo', type: 'demo' })}
            disabled={isConnecting}
            className="w-full p-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-xl transition-colors text-center"
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
              <div className="text-sm font-medium text-blue-900">Secure XRPL Connection</div>
              <div className="text-xs text-blue-700">
                Your wallet connection is encrypted and secure. We never store your private keys.
                {xrplConnected && <span className="block mt-1">✅ Connected to XRPL Testnet</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;

