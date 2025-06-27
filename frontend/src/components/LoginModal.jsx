import React, { useState } from 'react';
import { CrossmarkService, XummService, UserService } from '../services/walletService';
import { AuthService } from '../services/authService';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Login OAuth reali con provider sociali
  const handleSocialLogin = async (provider, event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let result;
      
      switch (provider) {
        case 'Google':
          result = await AuthService.signInWithGoogle();
          break;
        case 'GitHub':
          result = await AuthService.signInWithGitHub();
          break;
        case 'Apple':
          result = await AuthService.signInWithApple();
          break;
        case 'Discord':
          result = await AuthService.signInWithDiscord();
          break;
        case 'Twitter':
          result = await AuthService.signInWithTwitter();
          break;
        default:
          throw new Error(`Provider ${provider} non supportato`);
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      // Il redirect OAuth gestirà il login automaticamente
      // Non chiudiamo il modal qui perché l'utente verrà reindirizzato
      
    } catch (error) {
      console.error(`Errore login ${provider}:`, error);
      setError(`Errore durante il login con ${provider}: ${error.message}`);
      setLoading(false);
    }
  };

  const handleCrossmarkConnect = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Verifica se Crossmark è installato
      const isInstalled = await CrossmarkService.isInstalled();
      
      if (!isInstalled) {
        setError('Crossmark wallet non installato. Scarica da https://crossmark.io');
        setLoading(false);
        return;
      }

      // Connessione reale a Crossmark
      const walletData = await CrossmarkService.connect();
      
      // Crea o aggiorna utente nel database
      const user = await UserService.createOrUpdateUser(walletData);
      
      onLoginSuccess({
        ...user,
        wallet: walletData,
        loginType: 'crossmark'
      });
      
      onClose();
    } catch (error) {
      console.error('Errore connessione Crossmark:', error);
      setError(`Errore Crossmark: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleXummConnect = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Connessione reale a XUMM
      const walletData = await XummService.connect();
      
      // Crea o aggiorna utente nel database
      const user = await UserService.createOrUpdateUser(walletData);
      
      onLoginSuccess({
        ...user,
        wallet: walletData,
        loginType: 'xumm'
      });
      
      onClose();
    } catch (error) {
      console.error('Errore connessione XUMM:', error);
      setError(`Errore XUMM: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTrustWalletConnect = async (event) => {
    event.preventDefault();
    setError('Trust Wallet non supporta XRPL via browser. Usa Crossmark o XUMM per connessioni XRPL.');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '0.5rem' 
        }}>
          Accedi a SolCraft Nexus
        </h2>
        
        <p style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          Connetti il tuo wallet XRPL per iniziare
        </p>

        <div style={{ 
          textAlign: 'center', 
          marginBottom: '1.5rem',
          padding: '0.75rem',
          backgroundColor: '#ecfdf5',
          borderRadius: '0.5rem',
          border: '1px solid #10b981'
        }}>
          <p style={{ 
            color: '#10b981', 
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            🔗 Connessioni REALI attive - Nessuna simulazione
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🚀 Wallet XRPL (Raccomandato)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleCrossmarkConnect}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              🚀 Crossmark (Connessione Reale)
            </button>

            <button
              onClick={handleXummConnect}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              💎 XUMM (Connessione Reale)
            </button>

            <button
              onClick={handleTrustWalletConnect}
              disabled={true}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'not-allowed',
                opacity: 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              ⚠️ Trust Wallet (Non Supportato)
            </button>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid #e5e7eb', 
          paddingTop: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Oppure accedi con account social (OAuth Reale)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={(e) => handleSocialLogin('Google', e)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              🔍 Google (OAuth Reale)
            </button>

            <button
              onClick={(e) => handleSocialLogin('Apple', e)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#000000',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              🍎 Apple (OAuth Reale)
            </button>

            <button
              onClick={(e) => handleSocialLogin('GitHub', e)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              🐙 GitHub (OAuth Reale)
            </button>

            <button
              onClick={(e) => handleSocialLogin('Twitter', e)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1da1f2',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              🐦 Twitter (OAuth Reale)
            </button>

            <button
              onClick={(e) => handleSocialLogin('Discord', e)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#5865f2',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              💬 Discord (OAuth Reale)
            </button>
          </div>
        </div>

        {loading && (
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem'
          }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              🔄 Connessione in corso...
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default LoginModal;

