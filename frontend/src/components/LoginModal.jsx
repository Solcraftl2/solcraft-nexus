import React, { useState } from 'react';
import { useAuth } from '../services/authService.jsx';

/**
 * LoginModal - Modal di autenticazione con Web3Auth reale
 * Supporta login sociale e connessione wallet XRPL
 */
const LoginModal = ({ isOpen, onClose }) => {
  const { loginSocial, connectWallet, loading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('social');
  const [localLoading, setLocalLoading] = useState(false);

  // Chiudi modal se non è aperto
  if (!isOpen) return null;

  /**
   * Gestisce il login sociale
   */
  const handleSocialLogin = async (provider) => {
    try {
      setLocalLoading(true);
      clearError();

      console.log(`🔐 Login con ${provider}...`);
      const result = await loginSocial(provider);

      if (result.success) {
        console.log("✅ Login sociale completato");
        onClose();
      } else {
        console.error("❌ Login sociale fallito:", result.error);
      }
    } catch (error) {
      console.error("❌ Errore login sociale:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Gestisce la connessione wallet
   */
  const handleWalletConnect = async (walletType) => {
    try {
      setLocalLoading(true);
      clearError();

      console.log(`🔗 Connessione ${walletType}...`);
      const result = await connectWallet(walletType);

      if (result.success) {
        console.log("✅ Wallet connesso");
        onClose();
      } else {
        console.error("❌ Connessione wallet fallita:", result.error);
      }
    } catch (error) {
      console.error("❌ Errore connessione wallet:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Accedi a SolCraft Nexus
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Connessione in corso...</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === 'social'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('social')}
            disabled={isLoading}
          >
            Login Sociale
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === 'wallet'
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('wallet')}
            disabled={isLoading}
          >
            Wallet XRPL
          </button>
        </div>

        {/* Social Login Tab */}
        {activeTab === 'social' && (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm mb-4">
              Accedi con il tuo account sociale preferito
            </p>

            {/* Google Login */}
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continua con Google
            </button>

            {/* GitHub Login */}
            <button
              onClick={() => handleSocialLogin('github')}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continua con GitHub
            </button>

            {/* Discord Login */}
            <button
              onClick={() => handleSocialLogin('discord')}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" fill="#5865F2" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Continua con Discord
            </button>
          </div>
        )}

        {/* Wallet Connection Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm mb-4">
              Connetti il tuo wallet XRPL per accedere alla piattaforma
            </p>

            {/* Web3Auth XRPL Wallet */}
            <button
              onClick={() => handleWalletConnect('xrpl')}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border-2 border-blue-600 rounded-md shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Connetti Wallet XRPL
            </button>

            <div className="text-center text-sm text-gray-500 my-4">
              Wallet supportati tramite Web3Auth
            </div>

            {/* Info sui wallet supportati */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium">Crossmark</div>
                <div>Browser Extension</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium">XUMM</div>
                <div>Mobile App</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Accedendo accetti i nostri{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Termini di Servizio
          </a>{' '}
          e{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

