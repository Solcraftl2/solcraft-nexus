import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  Chrome,
  Github,
  Apple,
  Shield,
  CheckCircle,
  AlertCircle,
  Wallet,
  Zap,
  CreditCard,
  Users,
  Key,
  Globe
} from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('authToken', result.token);
        setSuccess('Login effettuato con successo!');
        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result.user);
          onClose();
        }, 1000);
      } else {
        setError(result.message || 'Credenziali non valide');
      }
    } catch (error) {
      setError('Errore di connessione. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Le password non coincidono');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          email: registerForm.email,
          password: registerForm.password
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('authToken', result.token);
        setSuccess('Registrazione completata con successo!');
        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result.user);
          onClose();
        }, 1000);
      } else {
        setError(result.message || 'Errore durante la registrazione');
      }
    } catch (error) {
      setError('Errore di connessione. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setIsLoading(true);
    setError(null);

    try {
      // Per ora simula il login OAuth
      const mockUser = {
        id: Date.now(),
        email: `user@${provider}.com`,
        firstName: 'Utente',
        lastName: provider.charAt(0).toUpperCase() + provider.slice(1),
        provider: provider
      };

      const mockToken = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('authToken', mockToken);
      
      setSuccess(`Login con ${provider} completato!`);
      setTimeout(() => {
        onLoginSuccess && onLoginSuccess(mockUser);
        onClose();
      }, 1000);
    } catch (error) {
      setError(`Errore durante il login con ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async (walletType) => {
    setIsLoading(true);
    setError(null);

    try {
      let walletAddress = null;
      
      switch (walletType) {
        case 'xumm':
          // Simulazione connessione XUMM
          walletAddress = 'rXUMMExampleAddress1234567890';
          break;
        case 'crossmark':
          // Simulazione connessione Crossmark
          if (window.crossmark) {
            const response = await window.crossmark.signIn();
            walletAddress = response.address;
          } else {
            throw new Error('Crossmark wallet non installato');
          }
          break;
        case 'trustwallet':
          // Simulazione connessione Trust Wallet
          walletAddress = 'rTrustWalletExample1234567890';
          break;
        default:
          throw new Error('Wallet non supportato');
      }

      // Chiama l'API per autenticare con wallet
      const response = await fetch('/.netlify/functions/auth-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletType,
          walletAddress,
          network: 'xrpl'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('walletAddress', walletAddress);
        localStorage.setItem('walletType', walletType);
        
        setSuccess(`Wallet ${walletType.toUpperCase()} connesso con successo!`);
        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result.user);
          onClose();
        }, 1000);
      } else {
        setError(result.message || 'Errore durante la connessione wallet');
      }
    } catch (error) {
      setError(error.message || 'Errore di connessione wallet. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeb3Auth = async (provider = 'google') => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulazione Web3Auth con MPC technology
      const response = await fetch('/.netlify/functions/auth-web3auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          loginType: 'social',
          mpcEnabled: true,
          network: 'xrpl'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('web3AuthProvider', provider);
        localStorage.setItem('walletAddress', result.walletAddress);
        localStorage.setItem('authMethod', 'web3auth');
        
        setSuccess(`Web3Auth con ${provider} completato! Wallet MPC generato.`);
        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result.user);
          onClose();
        }, 1000);
      } else {
        setError(result.message || 'Errore durante l\'autenticazione Web3Auth');
      }
    } catch (error) {
      setError('Errore di connessione Web3Auth. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Accedi</h2>
                <p className="text-sm text-gray-500">SolCraft Nexus Platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Accedi
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'register'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Registrati
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Wallet Connection Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Connetti Wallet XRPL</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => handleWalletConnect('xumm')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  XUMM Wallet
                </Button>
                <Button
                  onClick={() => handleWalletConnect('crossmark')}
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Crossmark
                </Button>
                <Button
                  onClick={() => handleWalletConnect('trustwallet')}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Trust Wallet
                </Button>
              </div>
            </div>

            {/* Web3Auth MPC Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Web3Auth (MPC Technology)</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => handleWeb3Auth('google')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 flex items-center justify-center"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Web3Auth + Google
                </Button>
                <Button
                  onClick={() => handleWeb3Auth('twitter')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700 flex items-center justify-center"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Web3Auth + Twitter
                </Button>
                <Button
                  onClick={() => handleWeb3Auth('discord')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 flex items-center justify-center"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Web3Auth + Discord
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                🔒 Sicurezza MPC avanzata - Wallet auto-generato senza seed phrase
              </p>
            </div>

            {/* OAuth Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Accesso Rapido</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Chrome className="h-4 w-4 mr-2" />
                  Continua con Google
                </Button>
                <Button
                  onClick={() => handleOAuthLogin('github')}
                  disabled={isLoading}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                >
                  <Github className="h-4 w-4 mr-2" />
                  Continua con GitHub
                </Button>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">oppure</span>
              </div>
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="tua@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        placeholder="Mario"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cognome
                    </label>
                    <input
                      type="text"
                      required
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Rossi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="mario@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conferma Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isLoading ? 'Registrazione in corso...' : 'Registrati'}
                </Button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
              Continuando accetti i nostri{' '}
              <a href="#" className="text-slate-600 hover:text-slate-800">
                Termini di Servizio
              </a>{' '}
              e{' '}
              <a href="#" className="text-slate-600 hover:text-slate-800">
                Privacy Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoginModal;

