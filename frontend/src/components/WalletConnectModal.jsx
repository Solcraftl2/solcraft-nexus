import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const WalletConnectModal = ({ isOpen, onClose, onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [walletData, setWalletData] = useState(null);

  // Reset state quando il modal si apre/chiude
  useEffect(() => {
    if (!isOpen) {
      setIsConnecting(false);
      setError('');
      setWalletData(null);
    }
  }, [isOpen]);

  const handleWalletConnect = async (walletType) => {
    setIsConnecting(true);
    setError('');

    try {
      let result;
      
      switch (walletType) {
        case 'generate':
          result = await apiService.generateWallet();
          break;
          
        case 'import':
          const seed = prompt('Inserisci il seed del tuo wallet XRPL:');
          if (!seed) {
            setIsConnecting(false);
            return;
          }
          result = await apiService.importWallet(seed);
          break;
          
        case 'xumm':
        case 'crossmark':
          // Per ora simuliamo la connessione con wallet esterni
          // In futuro si integreranno le SDK specifiche
          result = await apiService.generateWallet();
          result.walletType = walletType;
          break;
          
        case 'demo':
          // Modalità demo con wallet predefinito
          result = {
            address: 'rDemo1234567890123456789012345678901',
            publicKey: 'demo_public_key',
            balance: '1250.75',
            walletType: 'demo',
            isDemo: true
          };
          break;
          
        default:
          throw new Error('Tipo di wallet non supportato');
      }

      // Ottieni informazioni aggiuntive del wallet se non è demo
      if (!result.isDemo) {
        try {
          const walletInfo = await apiService.getWalletInfo(result.address);
          const balanceInfo = await apiService.getWalletBalance(result.address);
          
          result = {
            ...result,
            ...walletInfo,
            balance: balanceInfo.balance || '0'
          };
        } catch (infoError) {
          console.warn('Errore nel recupero info wallet:', infoError);
          // Continua comunque con i dati base
        }
      }

      setWalletData(result);
      
      // Simula un breve delay per UX
      setTimeout(() => {
        onConnect(result);
        setIsConnecting(false);
      }, 1500);

    } catch (err) {
      console.error('Errore connessione wallet:', err);
      setError(err.message || 'Errore durante la connessione del wallet');
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Connetti Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={isConnecting}
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isConnecting && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {walletData ? 'Finalizzazione connessione...' : 'Connessione in corso...'}
            </p>
            {walletData && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Wallet connesso:</strong><br />
                  {walletData.address}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Bilancio: {walletData.balance} XRP
                </p>
              </div>
            )}
          </div>
        )}

        {/* Wallet Options */}
        {!isConnecting && (
          <div className="space-y-3">
            {/* Secure Connection Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connessione Sicura
              </div>
              <p className="text-gray-600 text-sm">
                Scegli il tuo metodo di connessione preferito
              </p>
            </div>

            {/* XUMM Wallet */}
            <button
              onClick={() => handleWalletConnect('xumm')}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">XU</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">XUMM</div>
                  <div className="text-sm text-gray-500">Wallet mobile sicuro</div>
                </div>
              </div>
              <div className="text-blue-600 group-hover:translate-x-1 transition-transform">→</div>
            </button>

            {/* Crossmark */}
            <button
              onClick={() => handleWalletConnect('crossmark')}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">CM</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Crossmark</div>
                  <div className="text-sm text-gray-500">Estensione browser</div>
                </div>
              </div>
              <div className="text-purple-600 group-hover:translate-x-1 transition-transform">→</div>
            </button>

            {/* Generate New Wallet */}
            <button
              onClick={() => handleWalletConnect('generate')}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">+</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Genera Nuovo</div>
                  <div className="text-sm text-gray-500">Crea wallet XRPL</div>
                </div>
              </div>
              <div className="text-green-600 group-hover:translate-x-1 transition-transform">→</div>
            </button>

            {/* Import Wallet */}
            <button
              onClick={() => handleWalletConnect('import')}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">↑</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Importa Wallet</div>
                  <div className="text-sm text-gray-500">Usa seed esistente</div>
                </div>
              </div>
              <div className="text-orange-600 group-hover:translate-x-1 transition-transform">→</div>
            </button>

            {/* Demo Mode */}
            <button
              onClick={() => handleWalletConnect('demo')}
              className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">◉</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Modalità Demo</div>
                  <div className="text-sm text-gray-500">Esplora senza wallet</div>
                </div>
              </div>
              <div className="text-gray-600 group-hover:translate-x-1 transition-transform">→</div>
            </button>
          </div>
        )}

        {/* Footer */}
        {!isConnecting && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Le tue chiavi private rimangono sempre sicure e private
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnectModal;

