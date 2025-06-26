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
  Globe,
  QrCode,
  Smartphone,
  ExternalLink,
  Loader,
  Twitter,
  MessageCircle
} from 'lucide-react';

// Import wallet service
import walletService from '../services/walletService';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('wallet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [xummData, setXummData] = useState(null);

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
      setXummData(null);
    }
  }, [isOpen]);

  // XUMM Wallet Authentication
  const handleXummLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create XUMM payload
      const xummPayload = await walletService.connectXumm();
      setXummData(xummPayload);

      // Wait for user to sign in
      const result = await walletService.waitForXummSignIn(xummPayload.uuid);
      
      if (result.success) {
        // Save to database
        await walletService.saveUserToDatabase(result);
        
        // Create auth token
        const authToken = walletService.createAuthToken(result);
        localStorage.setItem('authToken', authToken);

        setSuccess('Login XUMM completato con successo!');
        setIsLoading(false);

        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('XUMM Login Error:', error);
      setError(error.message || 'Errore durante il login XUMM');
      setIsLoading(false);
      setXummData(null);
    }
  };

  // Crossmark Wallet Authentication
  const handleCrossmarkLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await walletService.connectCrossmark();
      
      if (result.success) {
        // Save to database
        await walletService.saveUserToDatabase(result);
        
        // Create auth token
        const authToken = walletService.createAuthToken(result);
        localStorage.setItem('authToken', authToken);

        setSuccess('Login Crossmark completato con successo!');
        setIsLoading(false);

        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Crossmark Login Error:', error);
      setError(error.message || 'Errore durante il login Crossmark');
      setIsLoading(false);
    }
  };

  // Trust Wallet Authentication
  const handleTrustWalletLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await walletService.connectTrustWallet();
      
      if (result.success) {
        // Save to database
        await walletService.saveUserToDatabase(result);
        
        // Create auth token
        const authToken = walletService.createAuthToken(result);
        localStorage.setItem('authToken', authToken);

        setSuccess('Login Trust Wallet completato con successo!');
        setIsLoading(false);

        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Trust Wallet Login Error:', error);
      setError(error.message || 'Errore durante il login Trust Wallet');
      setIsLoading(false);
    }
  };

  // Web3Auth MPC Login
  const handleWeb3AuthLogin = async (provider) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await walletService.connectWeb3Auth(provider);
      
      if (result.success) {
        // Save to database
        await walletService.saveUserToDatabase(result);
        
        // Create auth token
        const authToken = walletService.createAuthToken(result);
        localStorage.setItem('authToken', authToken);

        setSuccess(`Login ${provider} completato con successo!`);
        setIsLoading(false);

        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Web3Auth Login Error:', error);
      setError(error.message || `Errore durante il login ${provider}`);
      setIsLoading(false);
    }
  };

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
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerForm),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Registrazione completata! Effettua il login.');
        setActiveTab('login');
      } else {
        setError(result.message || 'Errore durante la registrazione');
      }
    } catch (error) {
      setError('Errore di connessione. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Accedi a SolCraft Nexus
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Connetti il tuo wallet o usa le credenziali
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'wallet'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Wallet size={16} />
                <span>Wallet XRPL</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('web3auth')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'web3auth'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Key size={16} />
                <span>Web3Auth MPC</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Mail size={16} />
                <span>Email</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 text-red-700 dark:text-red-400"
              >
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2 text-green-700 dark:text-green-400"
              >
                <CheckCircle size={16} />
                <span className="text-sm">{success}</span>
              </motion.div>
            )}

            {/* XRPL Wallet Tab */}
            {activeTab === 'wallet' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Connetti Wallet XRPL
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Scegli il tuo wallet XRPL preferito per accedere alla piattaforma
                  </p>
                </div>

                {/* XUMM Wallet */}
                <Button
                  onClick={handleXummLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <QrCode size={20} />
                  <span>XUMM Wallet</span>
                  {isLoading && xummData && <Loader size={16} className="animate-spin" />}
                </Button>

                {/* XUMM QR Code */}
                {xummData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-4 rounded-lg border-2 border-dashed border-blue-300 text-center"
                  >
                    <img src={xummData.qr} alt="XUMM QR Code" className="mx-auto mb-2 max-w-48" />
                    <p className="text-sm text-slate-600 mb-2">
                      Scansiona con l'app XUMM per accedere
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(xummData.deeplink, '_blank')}
                      >
                        <Smartphone size={14} className="mr-1" />
                        Apri XUMM
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Crossmark Wallet */}
                <Button
                  onClick={handleCrossmarkLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-3 py-3"
                >
                  <Chrome size={20} />
                  <span>Crossmark Wallet</span>
                  {isLoading && <Loader size={16} className="animate-spin" />}
                </Button>

                {/* Trust Wallet */}
                <Button
                  onClick={handleTrustWalletLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-3 py-3"
                >
                  <Shield size={20} />
                  <span>Trust Wallet</span>
                  {isLoading && <Loader size={16} className="animate-spin" />}
                </Button>
              </motion.div>
            )}

            {/* Web3Auth MPC Tab */}
            {activeTab === 'web3auth' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Web3Auth MPC
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Accedi con i tuoi account social usando tecnologia MPC avanzata
                  </p>
                </div>

                <Button
                  onClick={() => handleWeb3AuthLogin('Google')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 py-3 bg-red-600 hover:bg-red-700"
                >
                  <Chrome size={20} />
                  <span>Continua con Google</span>
                  {isLoading && <Loader size={16} className="animate-spin" />}
                </Button>

                <Button
                  onClick={() => handleWeb3AuthLogin('GitHub')}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-3 py-3"
                >
                  <Github size={20} />
                  <span>Continua con GitHub</span>
                  {isLoading && <Loader size={16} className="animate-spin" />}
                </Button>

                <Button
                  onClick={() => handleWeb3AuthLogin('Twitter')}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-3 py-3"
                >
                  <Twitter size={20} />
                  <span>Continua con Twitter</span>
                  {isLoading && <Loader size={16} className="animate-spin" />}
                </Button>

                <Button
                  onClick={() => handleWeb3AuthLogin('Discord')}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-3 py-3"
                >
                  <MessageCircle size={20} />
                  <span>Continua con Discord</span>
                  {isLoading && <Loader size={16} className="animate-spin" />}
                </Button>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Key size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-medium mb-1">Tecnologia MPC Avanzata</p>
                      <p className="text-xs">
                        Multi-Party Computation per massima sicurezza. 
                        Le tue chiavi private non vengono mai condivise.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Email Login Tab */}
            {activeTab === 'login' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="inserisci@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className="w-full pl-10 pr-12 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader size={16} className="animate-spin" />
                        <span>Accesso in corso...</span>
                      </div>
                    ) : (
                      'Accedi'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Non hai un account?{' '}
                    <button
                      onClick={() => setActiveTab('register')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Registrati
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Register Tab */}
            {activeTab === 'register' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nome
                      </label>
                      <div className="relative">
                        <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          placeholder="Nome"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Cognome
                      </label>
                      <input
                        type="text"
                        required
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Cognome"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="inserisci@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Conferma Password
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Conferma Password"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader size={16} className="animate-spin" />
                        <span>Registrazione in corso...</span>
                      </div>
                    ) : (
                      'Registrati'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Hai già un account?{' '}
                    <button
                      onClick={() => setActiveTab('login')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Accedi
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700 rounded-b-2xl">
            <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1">
                <Shield size={12} />
                <span>Sicurezza Bancaria</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>Compliance EU</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap size={12} />
                <span>XRPL Native</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoginModal;

