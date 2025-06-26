import React, { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSocialLogin = async (provider, event) => {
    event.preventDefault();
    setLoading(true);
    
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
    
    try {
      // Verifica se Crossmark è installato
      if (!window.crossmark) {
        // Crossmark non installato - mostra messaggio e simula connessione
        const userData = {
          name: 'Crossmark User (Simulato)',
          email: null,
          provider: 'Crossmark',
          wallet: {
            address: 'rCrossmarkSimulated123...',
            type: 'XRPL',
            network: 'testnet'
          },
          isSimulated: true,
          message: 'Crossmark non installato. Connessione simulata per demo.'
        };
        
        setTimeout(() => {
          onLoginSuccess(userData);
          setLoading(false);
          onClose();
        }, 1500);
        return;
      }

      // Crossmark è installato - connessione reale
      const signInResponse = await window.crossmark.signInAndWait();
      
      if (signInResponse && signInResponse.response && signInResponse.response.data) {
        const { address } = signInResponse.response.data;
        
        // Recupera informazioni sessione
        const sessionResponse = await window.crossmark.getUserSession();

        const userData = {
          name: 'Crossmark User',
          email: null,
          provider: 'Crossmark',
          wallet: {
            address: address,
            type: 'XRPL',
            network: 'mainnet'
          },
          isSimulated: false,
          session: sessionResponse
        };
        
        onLoginSuccess(userData);
        onClose();
      } else {
        throw new Error('Risposta Crossmark non valida');
      }
    } catch (error) {
      // In caso di errore, simula connessione per demo
      const userData = {
        name: 'Crossmark User (Errore)',
        email: null,
        provider: 'Crossmark',
        wallet: {
          address: 'rCrossmarkError123...',
          type: 'XRPL',
          network: 'testnet'
        },
        isSimulated: true,
        error: error.message
      };
      
      setTimeout(() => {
        onLoginSuccess(userData);
        setLoading(false);
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleXummConnect = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      // Importa dinamicamente il SDK XUMM OAuth2 PKCE
      const { XummPkce } = await import('xumm-oauth2-pkce');
      
      // Inizializza XUMM con API key (per demo usiamo una chiave di test)
      // In produzione, questa dovrebbe essere configurata tramite variabili d'ambiente
      const xumm = new XummPkce('your-api-key-here', {
        redirectUrl: window.location.origin,
        rememberJwt: true
      });

      // Verifica se l'utente è già autenticato
      const existingJwt = await xumm.state();
      
      if (existingJwt && existingJwt.me && existingJwt.me.account) {
        // Utente già autenticato
        const userData = {
          name: 'XUMM User',
          email: null,
          provider: 'XUMM',
          wallet: {
            address: existingJwt.me.account,
            type: 'XRPL',
            network: existingJwt.me.networkType || 'mainnet'
          },
          isSimulated: false,
          jwt: existingJwt.jwt,
          message: 'Connessione XUMM esistente recuperata.'
        };
        
        onLoginSuccess(userData);
        onClose();
        setLoading(false);
        return;
      }

      // Avvia il processo di autorizzazione
      const authResult = await xumm.authorize();
      
      if (authResult && authResult.me && authResult.me.account) {
        const userData = {
          name: 'XUMM User',
          email: null,
          provider: 'XUMM',
          wallet: {
            address: authResult.me.account,
            type: 'XRPL',
            network: authResult.me.networkType || 'mainnet'
          },
          isSimulated: false,
          jwt: authResult.jwt,
          message: 'Connessione XUMM completata con successo.'
        };
        
        onLoginSuccess(userData);
        onClose();
      } else {
        throw new Error('Autorizzazione XUMM fallita o cancellata');
      }
    } catch (error) {
      console.error('Errore XUMM:', error);
      
      // In caso di errore, simula connessione per demo
      const userData = {
        name: 'XUMM User (Simulato)',
        email: null,
        provider: 'XUMM',
        wallet: {
          address: 'rXUMMSimulated123...',
          type: 'XRPL',
          network: 'testnet'
        },
        isSimulated: true,
        error: error.message,
        message: 'XUMM non disponibile. Connessione simulata per demo.'
      };
      
      setTimeout(() => {
        onLoginSuccess(userData);
        setLoading(false);
        onClose();
      }, 1500);
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

    // Simulazione per Trust Wallet (non supporta XRPL via web)
    setLoading(true);
    
    setTimeout(() => {
      const userData = {
        name: `${wallet} User (Simulato)`,
        email: null,
        provider: wallet,
        wallet: {
          address: `r${wallet}Simulated123...`,
          type: 'XRPL',
          network: 'testnet'
        },
        isSimulated: true,
        message: `${wallet} non supporta XRPL via web. Connessione simulata per demo.`
      };
      
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
            ⚠️ Social: Demo | Crossmark & XUMM: Reale/Simulato | Trust: Demo
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['Google', 'GitHub', 'Twitter', 'Discord'].map((provider) => (
            <button
              key={provider}
              onClick={(event) => handleSocialLogin(provider, event)}
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
            {[
              { name: 'Crossmark', status: 'Ready', color: '#10b981' },
              { name: 'XUMM', status: 'Ready', color: '#3b82f6' },
              { name: 'Trust', status: 'Demo', color: '#6b7280' }
            ].map((wallet) => (
              <button
                key={wallet.name}
                onClick={(event) => handleWalletConnect(wallet.name, event)}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${wallet.color}`,
                  borderRadius: '0.375rem',
                  backgroundColor: loading ? '#f3f4f6' : wallet.color,
                  color: loading ? '#9ca3af' : 'white',
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: wallet.status === 'Ready' ? 'bold' : 'normal'
                }}
              >
                {wallet.name === 'Crossmark' && '🚀 '}
                {wallet.name === 'XUMM' && '💎 '}
                {wallet.name === 'Trust' && '🔒 '}
                {wallet.name}
                {wallet.status === 'Ready' && ' (Ready)'}
                {wallet.status === 'Demo' && ' (Demo)'}
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

