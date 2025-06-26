import React, { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    
    // Simulazione login per ora (sarà sostituito con Web3Auth reale)
    setTimeout(() => {
      const userData = {
        name: `User from ${provider}`,
        email: `user@${provider.toLowerCase()}.com`,
        provider: provider,
        wallet: null // Sarà popolato con Web3Auth
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
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Accedi a SolCraft Nexus
          </h2>
          <p style={{ color: '#6b7280' }}>
            Scegli il tuo metodo di accesso preferito
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
                onClick={() => handleSocialLogin(wallet)}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #3b82f6',
                  borderRadius: '0.375rem',
                  backgroundColor: loading ? '#f3f4f6' : '#3b82f6',
                  color: loading ? '#9ca3af' : 'white',
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {wallet}
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

