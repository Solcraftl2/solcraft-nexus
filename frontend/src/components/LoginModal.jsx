import React, { useState } from 'react';
import sdk from '@crossmarkio/sdk';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSocialLogin = async (provider) => {
    console.log(`🔧 Login simulato con ${provider}`);
    setLoading(true);
    
    // Simulazione login funzionante per provider sociali
    setTimeout(() => {
      const userData = {
        name: `User from ${provider}`,
        email: `user@${provider.toLowerCase()}.com`,
        provider: provider,
        wallet: null,
        isSimulated: true // Flag per indicare che è simulato
      };
      
      console.log('✅ Login simulato completato:', userData);
      onLoginSuccess(userData);
      setLoading(false);
      onClose();
    }, 1500);
  };

  const handleCrossmarkConnect = async () => {
    console.log('🚀 Connessione Crossmark reale...');
    setLoading(true);
    
    try {
      // Verifica se Crossmark è installato
      if (!window.crossmark) {
        alert('Crossmark wallet non trovato. Installa l\'estensione Crossmark dal Chrome Web Store.');
        setLoading(false);
        return;
      }

      console.log('📡 Inizializzazione Crossmark SDK...');
      
      // Connessione con Crossmark
      const signInResponse = await sdk.async.signInAndWait();
      console.log('✅ Risposta Crossmark signIn:', signInResponse);

      if (signInResponse && signInResponse.response && signInResponse.response.data) {
        const { address } = signInResponse.response.data;
        
        // Recupera informazioni sessione
        const sessionResponse = await sdk.async.getUserSession();
        console.log('✅ Sessione Crossmark:', sessionResponse);

        const userData = {
          name: `Crossmark User`,
          email: null,
          provider: 'Crossmark',
          wallet: {
            address: address,
            type: 'XRPL',
            network: 'mainnet'
          },
          isSimulated: false // Connessione reale!
        };
        
        console.log('🎉 Crossmark connesso con successo:', userData);
        onLoginSuccess(userData);
        onClose();
      } else {
        throw new Error('Risposta Crossmark non valida');
      }
    } catch (error) {
      console.error('❌ Errore connessione Crossmark:', error);
      alert(`Errore connessione Crossmark: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async (wallet) => {
    if (wallet === 'Crossmark') {
      await handleCrossmarkConnect();
      return;
    }

    // Simulazione per altri wallet (XUMM, Trust)
    console.log(`🔧 Wallet simulato: ${wallet}`);
    setLoading(true);
    
    setTimeout(() => {
      const userData = {
        name: `User from ${wallet}`,
        email: `user@${wallet.toLowerCase()}.com`,
        provider: wallet,
        wallet: {
          address: 'rSimulatedAddress123...',
          type: 'XRPL',
          network: 'testnet'
        },
        isSimulated: true
      };
      
      console.log('✅ Wallet simulato completato:', userData);
      onLoginSuccess(userData);
      setLoading(false);
      onClose();
    }, 1500);
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
            Scegli il tuo metodo di accesso preferito
          </p>
          <p style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            ⚠️ Social Login: Demo | Crossmark: Reale | Altri wallet: Demo
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['Google', 'GitHub', 'Twitter', 'Discord'].map((provider) => (
            <button
              key={provider}
              onClick={() => handleSocialLogin(provider)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: loading ? '#f3f4f6' : 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = '#9ca3af';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#d1d5db';
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>
                {provider === 'Google' && '🔍'}
                {provider === 'GitHub' && '🐙'}
                {provider === 'Twitter' && '🐦'}
                {provider === 'Discord' && '💬'}
              </span>
              {loading ? 'Connessione...' : `Continua con ${provider}`}
            </button>
          ))}
        </div>

        <div style={{ 
          marginTop: '1.5rem', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            Oppure connetti il tuo wallet XRPL
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {['Crossmark', 'XUMM', 'Trust'].map((wallet) => (
              <button
                key={wallet}
                onClick={() => handleWalletConnect(wallet)}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  border: wallet === 'Crossmark' ? '2px solid #10b981' : '1px solid #3b82f6',
                  borderRadius: '0.375rem',
                  backgroundColor: loading ? '#f3f4f6' : (wallet === 'Crossmark' ? '#10b981' : '#3b82f6'),
                  color: loading ? '#9ca3af' : 'white',
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: wallet === 'Crossmark' ? 'bold' : 'normal'
                }}
              >
                {wallet === 'Crossmark' && '🚀 '}
                {wallet}
                {wallet === 'Crossmark' && ' (Reale)'}
              </button>
            ))}
          </div>
        </div>

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

