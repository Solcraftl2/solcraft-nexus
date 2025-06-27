import React, { useState } from 'react';
import { CrossmarkService, XummService, UserService } from '../services/walletService';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSocialLogin = async (provider, event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulazione login funzionante per provider sociali
    setTimeout(() => {
      const userData = {
        name: `User from ${provider}`,
        email: `user@${provider.toLowerCase()}.com`,
        provider: provider,
        wallet: null,
        isSimulated: true
      };
      
      onLoginSuccess(userData);
      setLoading(false);
      onClose();
    }, 1500);
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
      
      const userData = {
        name: 'Crossmark User',
        email: null,
        provider: 'Crossmark',
        wallet: {
          address: walletData.address,
          type: 'XRPL',
          network: walletData.network
        },
        isSimulated: false,
        userId: user.id,
        message: 'Connessione Crossmark completata con successo!'
      };
      
      onLoginSuccess(userData);
      onClose();
    } catch (error) {
      console.error('Errore Crossmark:', error);
      setError(error.message || 'Errore durante la connessione a Crossmark');
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
      
      const userData = {
        name: 'XUMM User',
        email: null,
        provider: 'XUMM',
        wallet: {
          address: walletData.address,
          type: 'XRPL',
          network: walletData.network
        },
        isSimulated: false,
        userId: user.id,
        jwt: walletData.jwt,
        message: 'Connessione XUMM completata con successo!'
      };
      
      onLoginSuccess(userData);
      onClose();
    } catch (error) {
      console.error('Errore XUMM:', error);
      setError(error.message || 'Errore durante la connessione a XUMM');
    } finally {
      setLoading(false);
    }
  };

  const handleTrustWalletConnect = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Trust Wallet ha supporto limitato per XRPL via web
      setError('Trust Wallet non supporta XRPL via browser. Usa Crossmark o XUMM per XRPL.');
    } catch (error) {
      console.error('Errore Trust Wallet:', error);
      setError('Trust Wallet non disponibile per XRPL');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async (wallet, event) => {
    event.preventDefault();
    
    if (wallet === 'Crossmark') {
      await handleCrossmarkConnect(event);
      return;
    }
    
    if (wallet === 'XUMM') {
      await handleXummConnect(event);
      return;
    }
    
    if (wallet === 'Trust') {
      await handleTrustWalletConnect(event);
      return;
    }
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Accedi a SolCraft Nexus
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Connetti il tuo wallet XRPL per iniziare
          </p>
          <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
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

        {/* Wallet XRPL - Priorità principale */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem', fontWeight: 'bold' }}>
            🚀 Wallet XRPL (Raccomandato)
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={(event) => handleWalletConnect('Crossmark', event)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                border: '2px solid #10b981',
                borderRadius: '0.5rem',
                backgroundColor: loading ? '#f3f4f6' : '#10b981',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              🚀 Crossmark (Connessione Reale)
            </button>

            <button
              onClick={(event) => handleWalletConnect('XUMM', event)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                border: '2px solid #3b82f6',
                borderRadius: '0.5rem',
                backgroundColor: loading ? '#f3f4f6' : '#3b82f6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              💎 XUMM (Connessione Reale)
            </button>

            <button
              onClick={(event) => handleWalletConnect('Trust', event)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                border: '2px solid #9ca3af',
                borderRadius: '0.5rem',
                backgroundColor: loading ? '#f3f4f6' : '#9ca3af',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
            >
              ⚠️ Trust Wallet (Non Supportato)
            </button>
          </div>
        </div>

        {/* Login Social - Secondario */}
        <div style={{ 
          paddingTop: '1.5rem', 
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', textAlign: 'center' }}>
            Oppure accedi con account social (Demo)
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Google', 'GitHub', 'Twitter', 'Discord'].map((provider) => (
              <button
                key={provider}
                onClick={(event) => handleSocialLogin(provider, event)}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: loading ? '#f3f4f6' : 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1rem' }}>
                  {provider === 'Google' && '🔍'}
                  {provider === 'GitHub' && '🐙'}
                  {provider === 'Twitter' && '🐦'}
                  {provider === 'Discord' && '💬'}
                </span>
                {provider} (Demo)
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f0f9ff',
            borderRadius: '0.5rem'
          }}>
            <p style={{ color: '#0369a1', fontSize: '0.875rem' }}>
              🔄 Connessione in corso... Controlla il tuo wallet per autorizzare
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

