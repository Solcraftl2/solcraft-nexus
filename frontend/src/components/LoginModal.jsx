import React, { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSocialLogin = async (provider, event) => {
    event.preventDefault(); // Impedisce comportamento di default
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

  const handleCrossmarkConnect = async (event) => {
    // TEST 1: Alert immediato per confermare che arriviamo qui
    alert('🎯 STEP 1: Handler Crossmark chiamato!');
    
    event.preventDefault();
    
    // TEST 2: Alert dopo preventDefault
    alert('🎯 STEP 2: preventDefault eseguito!');
    
    try {
      // TEST 3: Alert prima dell'import
      alert('🎯 STEP 3: Prima dell\'import SDK...');
      
      // Provo l'import in modo diverso
      const sdk = await import('@crossmarkio/sdk');
      
      // TEST 4: Alert dopo l'import
      alert('🎯 STEP 4: Import SDK completato!');
      
      // TEST 5: Controllo window.crossmark
      alert(`🎯 STEP 5: window.crossmark = ${!!window.crossmark}`);
      
      if (!window.crossmark) {
        alert('❌ Crossmark non installato');
        return;
      }
      
      alert('🎯 STEP 6: Crossmark trovato, procedo...');
      
    } catch (error) {
      alert(`❌ ERRORE: ${error.message}`);
    }
  };

  const handleWalletConnect = async (wallet, event) => {
    // TEST GENERALE: Alert per tutti i wallet
    alert(`🔧 WALLET HANDLER: ${wallet}`);
    
    event.preventDefault();
    
    if (wallet === 'Crossmark') {
      alert('🚀 ROUTING TO CROSSMARK...');
      await handleCrossmarkConnect(event);
      return;
    }

    // Simulazione per altri wallet (XUMM, Trust)
    alert(`✅ SIMULAZIONE: ${wallet}`);
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
            ⚠️ Social Login: Demo | Crossmark: Debug | Altri wallet: Demo
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
            {['Crossmark', 'XUMM', 'Trust'].map((wallet) => (
              <button
                key={wallet}
                onClick={(event) => handleWalletConnect(wallet, event)}
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
                {wallet === 'Crossmark' && '🔍 '}
                {wallet}
                {wallet === 'Crossmark' && ' (Debug)'}
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

