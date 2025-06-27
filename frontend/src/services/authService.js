import React from 'react';
import { supabase } from './supabaseService';

/**
 * Authentication Service - Gestione autenticazione Web3 e Social
 * Supporta: Wallet authentication, Web3Auth social login
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.listeners = new Set();
    this.web3AuthInstance = null;
  }

  /**
   * Inizializza Web3Auth
   */
  async initializeWeb3Auth() {
    try {
      // In produzione, importare e configurare Web3Auth
      // Per ora usiamo una simulazione
      console.log('Initializing Web3Auth...');
      
      // Configurazione Web3Auth (mock)
      this.web3AuthInstance = {
        initialized: true,
        provider: null
      };

      return true;
    } catch (error) {
      console.error('Error initializing Web3Auth:', error);
      return false;
    }
  }

  /**
   * Autentica utente con wallet
   * @param {Object} walletData - Dati del wallet connesso
   * @returns {Promise<Object>} Risultato autenticazione
   */
  async authenticateWithWallet(walletData) {
    try {
      console.log('Authenticating with wallet:', walletData);

      // Verifica che il wallet sia connesso
      if (!walletData.success || !walletData.address) {
        return {
          success: false,
          error: 'Dati wallet non validi'
        };
      }

      // Genera messaggio per firma
      const timestamp = Date.now();
      const message = `SolCraft Nexus Login\nAddress: ${walletData.address}\nTimestamp: ${timestamp}`;

      // Per ora simuliamo la firma (in produzione richiedere firma reale)
      const signature = `mock_signature_${walletData.address}_${timestamp}`;

      // Verifica o crea utente nel database
      const user = await this.verifyOrCreateWalletUser(walletData, signature);

      if (user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        this.notifyListeners('authenticated', user);

        // Salva sessione
        await this.saveSession(user);

        return {
          success: true,
          user: user,
          method: 'wallet'
        };
      } else {
        return {
          success: false,
          error: 'Errore durante la creazione/verifica utente'
        };
      }
    } catch (error) {
      console.error('Error authenticating with wallet:', error);
      return {
        success: false,
        error: error.message || 'Errore durante l\'autenticazione wallet'
      };
    }
  }

  /**
   * Login con provider social (Web3Auth)
   * @param {string} provider - Provider social (google, github, discord)
   * @returns {Promise<Object>} Risultato login
   */
  async loginWithSocial(provider) {
    try {
      console.log(`Logging in with ${provider}...`);

      // Inizializza Web3Auth se necessario
      if (!this.web3AuthInstance) {
        await this.initializeWeb3Auth();
      }

      // Simulazione login social (in produzione usare Web3Auth reale)
      const mockSocialData = await this.mockSocialLogin(provider);

      if (mockSocialData.success) {
        // Verifica o crea utente nel database
        const user = await this.verifyOrCreateSocialUser(mockSocialData.userData, provider);

        if (user) {
          this.currentUser = user;
          this.isAuthenticated = true;
          this.notifyListeners('authenticated', user);

          // Salva sessione
          await this.saveSession(user);

          return {
            success: true,
            user: user,
            method: 'social',
            provider: provider
          };
        } else {
          return {
            success: false,
            error: 'Errore durante la creazione/verifica utente social'
          };
        }
      } else {
        return {
          success: false,
          error: mockSocialData.error || 'Errore durante il login social'
        };
      }
    } catch (error) {
      console.error(`Error with ${provider} login:`, error);
      return {
        success: false,
        error: error.message || `Errore durante il login con ${provider}`
      };
    }
  }

  /**
   * Simulazione login social (sostituire con Web3Auth reale)
   */
  async mockSocialLogin(provider) {
    // Simulazione delay per UX realistica
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock data per diversi provider
    const mockData = {
      google: {
        id: 'google_123456789',
        email: 'user@gmail.com',
        name: 'Utente Google',
        picture: 'https://via.placeholder.com/100'
      },
      github: {
        id: 'github_987654321',
        email: 'user@github.com',
        name: 'Utente GitHub',
        picture: 'https://via.placeholder.com/100'
      },
      discord: {
        id: 'discord_456789123',
        email: 'user@discord.com',
        name: 'Utente Discord',
        picture: 'https://via.placeholder.com/100'
      }
    };

    if (mockData[provider]) {
      return {
        success: true,
        userData: mockData[provider]
      };
    } else {
      return {
        success: false,
        error: `Provider ${provider} non supportato`
      };
    }
  }

  /**
   * Verifica o crea utente wallet nel database
   */
  async verifyOrCreateWalletUser(walletData, signature) {
    try {
      // Cerca utente esistente per indirizzo wallet
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletData.address)
        .single();

      if (existingUser && !searchError) {
        // Aggiorna ultimo login
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            last_login: new Date().toISOString(),
            wallet_type: walletData.wallet,
            wallet_network: walletData.network
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        return updatedUser || existingUser;
      } else {
        // Crea nuovo utente
        const newUser = {
          id: `wallet_${walletData.address}`,
          wallet_address: walletData.address,
          wallet_type: walletData.wallet,
          wallet_network: walletData.network,
          wallet_public_key: walletData.publicKey,
          auth_method: 'wallet',
          display_name: `Utente ${walletData.address.substring(0, 8)}...`,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_verified: false,
          kyc_status: 'pending'
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet user:', createError);
          return null;
        }

        return createdUser;
      }
    } catch (error) {
      console.error('Error verifying/creating wallet user:', error);
      return null;
    }
  }

  /**
   * Verifica o crea utente social nel database
   */
  async verifyOrCreateSocialUser(userData, provider) {
    try {
      // Cerca utente esistente per email o social ID
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${userData.email},social_id.eq.${userData.id}`)
        .single();

      if (existingUser && !searchError) {
        // Aggiorna ultimo login
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            last_login: new Date().toISOString(),
            social_provider: provider
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        return updatedUser || existingUser;
      } else {
        // Crea nuovo utente
        const newUser = {
          id: `social_${provider}_${userData.id}`,
          email: userData.email,
          social_id: userData.id,
          social_provider: provider,
          auth_method: 'social',
          display_name: userData.name,
          avatar_url: userData.picture,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_verified: true, // Social login considerato verificato
          kyc_status: 'pending'
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (createError) {
          console.error('Error creating social user:', createError);
          return null;
        }

        return createdUser;
      }
    } catch (error) {
      console.error('Error verifying/creating social user:', error);
      return null;
    }
  }

  /**
   * Salva sessione utente
   */
  async saveSession(user) {
    try {
      // Salva in localStorage per persistenza
      localStorage.setItem('solcraft_user', JSON.stringify(user));
      localStorage.setItem('solcraft_session', JSON.stringify({
        userId: user.id,
        loginTime: Date.now(),
        authMethod: user.auth_method
      }));

      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  /**
   * Ripristina sessione salvata
   */
  async restoreSession() {
    try {
      const savedUser = localStorage.getItem('solcraft_user');
      const savedSession = localStorage.getItem('solcraft_session');

      if (savedUser && savedSession) {
        const user = JSON.parse(savedUser);
        const session = JSON.parse(savedSession);

        // Verifica che la sessione non sia scaduta (24 ore)
        const sessionAge = Date.now() - session.loginTime;
        const maxAge = 24 * 60 * 60 * 1000; // 24 ore

        if (sessionAge < maxAge) {
          this.currentUser = user;
          this.isAuthenticated = true;
          this.notifyListeners('authenticated', user);
          return user;
        } else {
          // Sessione scaduta
          this.clearSession();
        }
      }

      return null;
    } catch (error) {
      console.error('Error restoring session:', error);
      return null;
    }
  }

  /**
   * Logout utente
   */
  async logout() {
    try {
      this.currentUser = null;
      this.isAuthenticated = false;
      this.clearSession();
      this.notifyListeners('logout', null);

      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      return {
        success: false,
        error: error.message || 'Errore durante il logout'
      };
    }
  }

  /**
   * Cancella sessione salvata
   */
  clearSession() {
    try {
      localStorage.removeItem('solcraft_user');
      localStorage.removeItem('solcraft_session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Ottiene utente corrente
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Verifica se utente è autenticato
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Aggiunge listener per eventi auth
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Rimuove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notifica tutti i listener
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }
}

// Istanza singleton
const authService = new AuthService();

// Hook React per uso nei componenti
export const useAuth = () => {
  const [authState, setAuthState] = React.useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  React.useEffect(() => {
    const handleAuthEvent = (event, data) => {
      if (event === 'authenticated') {
        setAuthState({
          isAuthenticated: true,
          user: data,
          loading: false
        });
      } else if (event === 'logout') {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    authService.addListener(handleAuthEvent);

    // Ripristina sessione all'avvio
    authService.restoreSession().then(user => {
      setAuthState({
        isAuthenticated: !!user,
        user: user,
        loading: false
      });
    });

    return () => {
      authService.removeListener(handleAuthEvent);
    };
  }, []);

  return {
    ...authState,
    login: authService.authenticateWithWallet.bind(authService),
    loginWithSocial: authService.loginWithSocial.bind(authService),
    logout: authService.logout.bind(authService),
    getCurrentUser: authService.getCurrentUser.bind(authService)
  };
};

export { authService };
export default authService;

