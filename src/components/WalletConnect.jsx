import React, { useState, useEffect } from 'react';
import walletService from '../services/walletService.js';

const WalletConnect = ({ onWalletConnected, onWalletDisconnected }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Controlla se c'è già un wallet connesso
    const info = walletService.getWalletInfo();
    if (info.connected) {
      setWalletInfo(info);
      onWalletConnected && onWalletConnected(info);
    }
  }, []);

  const handleConnectWallet = async (walletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      let result;
      
      switch (walletType) {
        case 'xumm':
          result = await walletService.connectXUMM();
          break;
        case 'metamask':
          result = await walletService.connectMetaMask();
          break;
        case 'walletconnect':
          result = await walletService.connectWalletConnect();
          break;
        default:
          throw new Error('Tipo wallet non supportato');
      }

      if (result.success) {
        const info = walletService.getWalletInfo();
        setWalletInfo(info);
        setShowModal(false);
        onWalletConnected && onWalletConnected(info);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnect();
    setWalletInfo(null);
    onWalletDisconnected && onWalletDisconnected();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    return `${balance[balance.currency]?.toFixed(4) || '0'} ${balance.currency}`;
  };

  if (walletInfo && walletInfo.connected) {
    return (
      <div className="wallet-connected">
        <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {walletInfo.walletType}
            </div>
            <div className="text-xs text-gray-500">
              {formatAddress(walletInfo.address)}
            </div>
            {walletInfo.balance && (
              <div className="text-xs text-gray-600">
                Balance: {formatBalance(walletInfo.balance)}
              </div>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Disconnetti
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Connetti Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Connetti il tuo Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {/* XUMM Wallet */}
              <button
                onClick={() => handleConnectWallet('xumm')}
                disabled={isConnecting}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">X</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">XUMM</div>
                  <div className="text-sm text-gray-500">XRP Ledger Wallet</div>
                </div>
                {isConnecting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </button>

              {/* MetaMask */}
              <button
                onClick={() => handleConnectWallet('metamask')}
                disabled={isConnecting}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">MetaMask</div>
                  <div className="text-sm text-gray-500">Ethereum Wallet</div>
                </div>
                {isConnecting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                )}
              </button>

              {/* WalletConnect */}
              <button
                onClick={() => handleConnectWallet('walletconnect')}
                disabled={isConnecting}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">W</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">WalletConnect</div>
                  <div className="text-sm text-gray-500">Mobile Wallets</div>
                </div>
                {isConnecting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                )}
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Connettendo il wallet accetti i nostri{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Termini di Servizio
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnect;

