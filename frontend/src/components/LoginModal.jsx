import React, { useState, useEffect } from 'react';
import { walletService } from '../services/walletService';
import { authService } from '../services/authService';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);

  useEffect(() => {
    if (isOpen) {
      checkAvailableWallets();
    }
  }, [isOpen]);

  const checkAvailableWallets = async () => {
    try {
      const wallets = await walletService.getAvailableWallets();
      setAvailableWallets(wallets);
    } catch (err) {
      console.error('Error checking wallets:', err);
      setError('Errore nel rilevamento wallet');
    }
  };

  const handleWalletConnect = async (walletType) => {
    setIsLoading(true);
    setError('');
    setSelectedWallet(walletType);

    try {
      // Connessione wallet
      const walletData = await walletService.connectWallet(walletType);
      
      if (walletData.success) {
        // Autenticazione con il servizio
        const authResult = await authService.authenticateWithWallet(walletData);
        
        if (authResult.success) {
          onLoginSuccess(authResult.user);
          onClose();
        } else {
          setError(authResult.error || 'Errore durante l\'autenticazione');
        }
      } else {
        setError(walletData.error || 'Errore durante la connessione al wallet');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Errore durante il login. Riprova.');
    } finally {
      setIsLoading(false);
      setSelectedWallet(null);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.loginWithSocial(provider);
      
      if (result.success) {
        onLoginSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'Errore durante il login social');
      }
    } catch (err) {
      console.error('Social login error:', err);
      setError('Errore durante il login social. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Accedi a SolCraft Nexus</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Wallet Connection Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Connetti il tuo Wallet</h3>
          
          <div className="space-y-3">
            {/* Crossmark Wallet */}
            {availableWallets.includes('crossmark') && (
              <button
                onClick={() => handleWalletConnect('crossmark')}
                disabled={isLoading}
                className={`w-full flex items-center justify-center p-3 border-2 rounded-lg transition-all ${
                  selectedWallet === 'crossmark'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <span className="font-medium">Crossmark Wallet</span>
                  {selectedWallet === 'crossmark' && isLoading && (
                    <div className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </button>
            )}

            {/* XUMM Wallet */}
            {availableWallets.includes('xumm') && (
              <button
                onClick={() => handleWalletConnect('xumm')}
                disabled={isLoading}
                className={`w-full flex items-center justify-center p-3 border-2 rounded-lg transition-all ${
                  selectedWallet === 'xumm'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">X</span>
                  </div>
                  <span className="font-medium">XUMM Wallet</span>
                  {selectedWallet === 'xumm' && isLoading && (
                    <div className="ml-2 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </button>
            )}

            {/* Trust Wallet */}
            {availableWallets.includes('trust') && (
              <button
                onClick={() => handleWalletConnect('trust')}
                disabled={isLoading}
                className={`w-full flex items-center justify-center p-3 border-2 rounded-lg transition-all ${
                  selectedWallet === 'trust'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <span className="font-medium">Trust Wallet</span>
                  {selectedWallet === 'trust' && isLoading && (
                    <div className="ml-2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </button>
            )}
          </div>

          {/* No Wallets Available */}
          {availableWallets.length === 0 && !isLoading && (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-3">Nessun wallet compatibile rilevato</p>
              <div className="text-sm text-gray-500">
                <p>Installa uno dei seguenti wallet:</p>
                <div className="mt-2 space-y-1">
                  <a href="https://crossmark.io" target="_blank" rel="noopener noreferrer" 
                     className="block text-blue-600 hover:underline">• Crossmark Wallet</a>
                  <a href="https://xumm.app" target="_blank" rel="noopener noreferrer"
                     className="block text-blue-600 hover:underline">• XUMM Wallet</a>
                  <a href="https://trustwallet.com" target="_blank" rel="noopener noreferrer"
                     className="block text-blue-600 hover:underline">• Trust Wallet</a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">oppure</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Social Login Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Login Social (Web3Auth)</h3>
          
          {/* Google Login */}
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className={`w-full flex items-center justify-center p-3 border-2 border-gray-300 rounded-lg hover:border-red-400 hover:bg-gray-50 transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-medium">Continua con Google</span>
            </div>
          </button>

          {/* GitHub Login */}
          <button
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className={`w-full flex items-center justify-center p-3 border-2 border-gray-300 rounded-lg hover:border-gray-600 hover:bg-gray-50 transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-800 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-medium">Continua con GitHub</span>
            </div>
          </button>

          {/* Discord Login */}
          <button
            onClick={() => handleSocialLogin('discord')}
            disabled={isLoading}
            className={`w-full flex items-center justify-center p-3 border-2 border-gray-300 rounded-lg hover:border-purple-400 hover:bg-gray-50 transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-medium">Continua con Discord</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Accedendo accetti i nostri</p>
          <div className="mt-1">
            <a href="#" className="text-blue-600 hover:underline">Termini di Servizio</a>
            {' e '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

