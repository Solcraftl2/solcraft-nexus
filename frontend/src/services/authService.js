// Servizio per gestire l'autenticazione con provider OAuth reali
import React from 'react';
import { supabase } from './supabaseService';

export class AuthService {
  // Login con Google OAuth
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Errore login Google:', error);
      return { success: false, error: error.message };
    }
  }

  // Login con GitHub OAuth
  static async signInWithGitHub() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Errore login GitHub:', error);
      return { success: false, error: error.message };
    }
  }

  // Login con Apple OAuth
  static async signInWithApple() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Errore login Apple:', error);
      return { success: false, error: error.message };
    }
  }

  // Login con Discord OAuth
  static async signInWithDiscord() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Errore login Discord:', error);
      return { success: false, error: error.message };
    }
  }

  // Login con Twitter OAuth
  static async signInWithTwitter() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Errore login Twitter:', error);
      return { success: false, error: error.message };
    }
  }

  // Ottieni utente corrente
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      console.error('Errore recupero utente:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Errore logout:', error);
      return { success: false, error: error.message };
    }
  }

  // Ascolta cambiamenti di autenticazione
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  // Crea profilo utente nel database dopo login OAuth
  static async createUserProfile(user) {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Utente',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          provider: user.app_metadata?.provider,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          kyc_status: 'not_started',
          kyc_level: 0
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (error) {
      console.error('Errore creazione profilo:', error);
      return { success: false, error: error.message };
    }
  }

  // Verifica se l'utente ha completato il KYC
  static async checkKYCStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('kyc_status, kyc_level')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, kyc: data };
    } catch (error) {
      console.error('Errore verifica KYC:', error);
      return { success: false, error: error.message };
    }
  }
}

// Hook per gestire l'autenticazione in React
export const useAuth = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Controlla se c'è già un utente loggato
    AuthService.getCurrentUser().then(({ user }) => {
      setUser(user);
      setLoading(false);
    });

    // Ascolta cambiamenti di autenticazione
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Crea/aggiorna profilo utente
          await AuthService.createUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    signInWithGoogle: AuthService.signInWithGoogle,
    signInWithGitHub: AuthService.signInWithGitHub,
    signInWithApple: AuthService.signInWithApple,
    signInWithDiscord: AuthService.signInWithDiscord,
    signInWithTwitter: AuthService.signInWithTwitter,
    signOut: AuthService.signOut,
    checkKYCStatus: AuthService.checkKYCStatus
  };
};

