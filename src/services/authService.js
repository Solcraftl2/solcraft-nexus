// Servizio per autenticazione OAuth reale
class AuthService {
  constructor() {
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
    this.backendUrl = 'http://localhost:5000/api/v1';
  }

  // Login con Google
  async loginWithGoogle() {
    try {
      // Configurazione Google OAuth
      const googleClientId = '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';
      const redirectUri = window.location.origin + '/auth/google/callback';
      
      const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${googleClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `state=${this.generateState()}`;

      // Apri popup per autenticazione
      const popup = window.open(
        googleAuthUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Controlla se l'autenticazione è avvenuta
            this.checkAuthStatus().then(resolve).catch(reject);
          }
        }, 1000);

        // Timeout dopo 5 minuti
        setTimeout(() => {
          clearInterval(checkClosed);
          popup.close();
          reject(new Error('Timeout autenticazione'));
        }, 300000);
      });
    } catch (error) {
      console.error('Errore login Google:', error);
      throw error;
    }
  }

  // Login con Apple
  async loginWithApple() {
    try {
      const appleClientId = 'com.solcraft.nexus';
      const redirectUri = window.location.origin + '/auth/apple/callback';
      
      const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` +
        `client_id=${appleClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=name email&` +
        `response_mode=form_post&` +
        `state=${this.generateState()}`;

      const popup = window.open(
        appleAuthUrl,
        'apple-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            this.checkAuthStatus().then(resolve).catch(reject);
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(checkClosed);
          popup.close();
          reject(new Error('Timeout autenticazione'));
        }, 300000);
      });
    } catch (error) {
      console.error('Errore login Apple:', error);
      throw error;
    }
  }

  // Login con GitHub
  async loginWithGitHub() {
    try {
      const githubClientId = 'your_github_client_id';
      const redirectUri = window.location.origin + '/auth/github/callback';
      
      const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${githubClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=user:email&` +
        `state=${this.generateState()}`;

      const popup = window.open(
        githubAuthUrl,
        'github-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            this.checkAuthStatus().then(resolve).catch(reject);
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(checkClosed);
          popup.close();
          reject(new Error('Timeout autenticazione'));
        }, 300000);
      });
    } catch (error) {
      console.error('Errore login GitHub:', error);
      throw error;
    }
  }

  // Login con email e password
  async loginWithEmail(email, password) {
    try {
      const response = await fetch(`${this.backendUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.access_token;
        this.user = data.user;
        this.isAuthenticated = true;
        
        // Salva token in localStorage
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user_data', JSON.stringify(this.user));

        return {
          success: true,
          user: this.user,
          token: this.token
        };
      } else {
        throw new Error(data.message || 'Errore durante il login');
      }
    } catch (error) {
      console.error('Errore login email:', error);
      throw error;
    }
  }

  // Registrazione con email
  async registerWithEmail(email, password, firstName, lastName) {
    try {
      const response = await fetch(`${this.backendUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Registrazione completata con successo'
        };
      } else {
        throw new Error(data.message || 'Errore durante la registrazione');
      }
    } catch (error) {
      console.error('Errore registrazione:', error);
      throw error;
    }
  }

  // Controlla stato autenticazione
  async checkAuthStatus() {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false };
      }

      const response = await fetch(`${this.backendUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.token = token;
        this.user = userData;
        this.isAuthenticated = true;
        
        return {
          success: true,
          user: this.user
        };
      } else {
        this.logout();
        return { success: false };
      }
    } catch (error) {
      console.error('Errore controllo auth:', error);
      this.logout();
      return { success: false };
    }
  }

  // Logout
  logout() {
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  // Genera state per OAuth
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Ottieni token per API calls
  getAuthToken() {
    return this.token;
  }

  // Ottieni info utente
  getUserInfo() {
    return this.user;
  }

  // Controlla se autenticato
  isLoggedIn() {
    return this.isAuthenticated;
  }

  // Headers per API calls autenticate
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}

export default new AuthService();

