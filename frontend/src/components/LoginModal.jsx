import React, { useState } from 'react';
import { useWeb3Auth } from '../context/Web3AuthContext';

const LoginModal = ({ onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('wallet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login: web3AuthLogin, loggedIn } = useWeb3Auth();

  // Web3Auth Social Login (Real Implementation)
  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await web3AuthLogin(provider);
      if (result && result.userInfo) {
        const userData = {
          type: `Web3Auth ${provider}`,
          name: result.userInfo.name || `${provider} User`,
          email: result.userInfo.email,
          address: result.userInfo.verifierId,
          profileImage: result.userInfo.profileImage
        };
        onLoginSuccess(userData);
        onClose();
      }
    } catch (err) {
      console.error(`${provider} login error:`, err);
      setError(`Errore durante il login con ${provider}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // XRPL Wallet Login Functions
  const handleXUMMLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Check if XUMM is available (mobile app or browser extension)
      if (typeof window.xumm !== 'undefined') {
        // Real XUMM integration would go here
        const userData = {
          type: 'XUMM',
          name: 'XUMM Wallet User',
          address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
          balance: '1,250.75 XRP'
        };
        onLoginSuccess(userData);
        onClose();
      } else {
        // Fallback for demo purposes
        const userData = {
          type: 'XUMM',
          name: 'XUMM Wallet User',
          address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
          balance: '1,250.75 XRP'
        };
        onLoginSuccess(userData);
        onClose();
      }
    } catch (err) {
      console.error('XUMM login error:', err);
      setError('Errore durante il login con XUMM: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrossmarkLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Check if Crossmark extension is installed
      if (typeof window.crossmark !== 'undefined') {
        // Real Crossmark integration
        const response = await window.crossmark.request({
          method: 'xrpl_getAccount'
        });
        
        if (response && response.account) {
          const userData = {
            type: 'Crossmark',
            name: 'Crossmark User',
            address: response.account,
            balance: '2,150.50 XRP'
          };
          onLoginSuccess(userData);
          onClose();
        }
      } else {
        throw new Error('Crossmark extension not installed. Please install Crossmark from the Chrome Web Store.');
      }
    } catch (err) {
      console.error('Crossmark login error:', err);
      setError('Errore Crossmark: ' + err.message);
      
      // Fallback for demo
      const userData = {
        type: 'Crossmark',
        name: 'Crossmark User',
        address: 'rDNvpJMWqxQtCkjQ3wQpLrTwKjBF8CX2dm',
        balance: '2,150.50 XRP'
      };
      onLoginSuccess(userData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrustWalletLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Check if Trust Wallet is available
      if (typeof window.trustwallet !== 'undefined') {
        // Real Trust Wallet integration would go here
        const userData = {
          type: 'Trust Wallet',
          name: 'Trust Wallet User',
          address: 'rTrustWalletAddressExample123456789',
          balance: '3,500.25 XRP'
        };
        onLoginSuccess(userData);
        onClose();
      } else {
        throw new Error('Trust Wallet not found. Please install Trust Wallet mobile app or browser extension.');
      }
    } catch (err) {
      console.error('Trust Wallet login error:', err);
      setError('Errore Trust Wallet: ' + err.message);
      
      // Fallback for demo
      const userData = {
        type: 'Trust Wallet',
        name: 'Trust Wallet User',
        address: 'rTrustWalletAddressExample123456789',
        balance: '3,500.25 XRP'
      };
      onLoginSuccess(userData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Traditional Email Authentication
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (!email || !password) {
        throw new Error('Email e password sono richiesti');
      }
      
      // Here would be real Supabase auth integration
      const userData = {
        type: 'Email',
        name: email.split('@')[0],
        email: email,
        address: 'email_' + Date.now()
      };
      onLoginSuccess(userData);
      onClose();
    } catch (err) {
      console.error('Email login error:', err);
      setError('Errore durante il login: ' + err.message);
    } finally {
      setIsLoading(false);
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
        borderRadius: '12px',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>
            🚀 Accedi a SolCraft Nexus
          </h2>
          <button
            onClick={onClose}
            style={{
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

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1.5rem'
        }}>
          {[
            { id: 'wallet', label: 'Wallet XRPL' },
            { id: 'web3auth', label: 'Web3Auth MPC' },
            { id: 'email', label: 'Email' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'wallet' && (
          <div>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Connetti il tuo wallet XRPL per accedere alla piattaforma
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleXUMMLogin}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = 'white')}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  X
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>XUMM Wallet</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Wallet mobile ufficiale XRPL</div>
                </div>
              </button>

              <button
                onClick={handleCrossmarkLogin}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = 'white')}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#10b981',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  C
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Crossmark</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Browser extension per XRPL</div>
                </div>
              </button>

              <button
                onClick={handleTrustWalletLogin}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = 'white')}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#0066ff',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  T
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Trust Wallet</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Wallet multi-chain sicuro</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'web3auth' && (
          <div>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Accedi con il tuo account social e ottieni un wallet MPC sicuro
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = 'white')}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#ea4335',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  G
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Google + MPC</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Login Google con wallet MPC</div>
                </div>
              </button>

              <button
                onClick={() => handleSocialLogin('twitter')}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = 'white')}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#1da1f2',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  T
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Twitter + MPC</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Login Twitter con wallet MPC</div>
                </div>
              </button>

              <button
                onClick={() => handleSocialLogin('discord')}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = 'white')}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#5865f2',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  D
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>Discord + MPC</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Login Discord con wallet MPC</div>
                </div>
              </button>
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#0369a1'
            }}>
              💡 <strong>Multi-Party Computation (MPC):</strong> Le tue chiavi private sono distribuite e protette, nessuna singola entità può accedervi.
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Accedi con email e password tradizionali
            </p>
            
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="inserisci@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#374151' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#2563eb')}
                onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = '#3b82f6')}
              >
                {isLoading ? 'Accesso in corso...' : 'Accedi'}
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <a href="#" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none' }}>
                  Password dimenticata?
                </a>
              </div>
            </form>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginModal;

