import React from 'react';
import web3AuthService from './web3AuthService';

/**
 * Auth Service - Gestione autenticazione completa
 * Integra Web3Auth reale con Supabase per persistenza
 */

// Context per gestione stato autenticazione
const AuthContext = React.createContext();

/**
 * Hook per accedere al contesto di autenticazione
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
};

/**
 * Provider per gestione stato autenticazione globale
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Inizializzazione al mount
  React.useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Inizializza il sistema di autenticazione
   */
  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Inizializza Web3Auth
      await web3AuthService.initialize();

      // Controlla se l'utente è già connesso
      if (web3AuthService.isConnected()) {
        const userInfo = await web3AuthService.getUserInfo();
        await handleUserLogin(userInfo, 'social', 'auto');
      }

      console.log("✅ Sistema di autenticazione inizializzato");
    } catch (error) {
      console.error("❌ Errore inizializzazione auth:", error);
      setError("Errore inizializzazione sistema di autenticazione");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login con provider sociale (Google, GitHub, Discord)
   */
  const loginSocial = async (provider = 'google') => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔐 Tentativo login sociale: ${provider}`);

      const result = await web3AuthService.loginSocial(provider);

      if (result.success) {
        await handleUserLogin(result.user, 'social', provider, result.idToken);
        return { success: true, user: result.user };
      } else {
        throw new Error(result.error || 'Login sociale fallito');
      }
    } catch (error) {
      console.error(`❌ Errore login ${provider}:`, error);
      setError(`Errore durante il login con ${provider}: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connessione wallet XRPL
   */
  const connectWallet = async (walletType = 'xrpl') => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔗 Tentativo connessione wallet: ${walletType}`);

      const result = await web3AuthService.connectWallet();

      if (result.success) {
        await handleUserLogin(result.user, 'wallet', walletType, result.idToken);
        return { success: true, user: result.user };
      } else {
        throw new Error(result.error || 'Connessione wallet fallita');
      }
    } catch (error) {
      console.error(`❌ Errore connessione ${walletType}:`, error);
      setError(`Errore durante la connessione ${walletType}: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gestisce il login dell'utente e la sincronizzazione con Supabase
   */
  const handleUserLogin = async (userData, authMethod, provider, idToken) => {
    try {
      console.log("👤 Gestione login utente:", userData);

      const response = await fetch('/api/auth/web3auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          token: idToken,
          walletAddress: userData.wallet_address,
        }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
        localStorage.setItem('authToken', result.token);
        console.log("✅ Login completato con successo");
      } else {
        throw new Error(result.message || 'Backend auth failed');
      }
    } catch (error) {
      console.error("❌ Errore gestione login:", error);
      setUser({
        ...userData,
        auth_method: authMethod,
        provider,
      });
    }
  };

  /**
   * Logout completo
   */
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🚪 Logout in corso...");

      // Logout da Web3Auth
      await web3AuthService.logout();

      // Reset stato locale
      setUser(null);

      console.log("✅ Logout completato");
      return { success: true };
    } catch (error) {
      console.error("❌ Errore logout:", error);
      setError(`Errore durante il logout: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ottieni informazioni account XRPL
   */
  const getAccountInfo = async (address) => {
    try {
      return await web3AuthService.getAccountInfo(address);
    } catch (error) {
      console.error("❌ Errore getAccountInfo:", error);
      throw error;
    }
  };

  /**
   * Firma transazione XRPL
   */
  const signTransaction = async (transaction) => {
    try {
      return await web3AuthService.signTransaction(transaction);
    } catch (error) {
      console.error("❌ Errore signTransaction:", error);
      throw error;
    }
  };

  /**
   * Invia transazione XRPL
   */
  const submitTransaction = async (transaction) => {
    try {
      return await web3AuthService.submitTransaction(transaction);
    } catch (error) {
      console.error("❌ Errore submitTransaction:", error);
      throw error;
    }
  };

  // Valore del context
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    loginSocial,
    connectWallet,
    logout,
    getAccountInfo,
    signTransaction,
    submitTransaction,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

