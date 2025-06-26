import React, { useState, useEffect } from 'react';
import authService from '../services/authService';

const LoginModal = ({ onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('wallet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    // Get initial auth status
    const status = authService.getAuthStatus();
    setAuthStatus(status);

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((event, user) => {
      if (event === 'login' && user) {
        onLoginSuccess(user);
        onClose();
      }
      setAuthStatus(authService.getAuthStatus());
    });

    return unsubscribe;
  }, [onLoginSuccess, onClose]);

  // Handle real wallet login
  const handleWalletLogin = async (walletType) => {
    setIsLoading(true);
    setError('');

    try {
      const user = await authService.loginWithXRPLWallet(walletType);
      console.log('Wallet login successful:', user);
    } catch (error) {
      console.error('Wallet login failed:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    setError('');

    try {
      const user = await authService.loginWithSocial(provider);
      console.log('Social login successful:', user);
    } catch (error) {
      console.error('Social login failed:', error);
      setError(error.message || `Failed to login with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Wallet XRPL Authentication
  const handleXUMMLogin = async () => {
    await handleWalletLogin('xumm');
  };

  const handleCrossmarkLogin = async () => {
    await handleWalletLogin('crossmark');
  };

  const handleTrustWalletLogin = async () => {
    await handleWalletLogin('trust');
  };

  // Social + MPC Authentication
  const handleGoogleMPCLogin = async () => {
    await handleSocialLogin('google');
  };

  const handleTwitterMPCLogin = async () => {
    await handleSocialLogin('twitter');
  };

  const handleDiscordMPCLogin = async () => {
    await handleSocialLogin('discord');
  };

  // Traditional Email Authentication
  const handleEmailLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      // For now, simulate email login - in production this would integrate with Supabase Auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = {
        id: 'email_user_' + Date.now(),
        name: 'Email User',
        email: 'user@example.com',
        provider: 'email',
        loginType: 'email',
        walletAddress: null,
        isVerified: true,
        loginTime: new Date().toISOString()
      };

      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError('Errore durante il login con email');
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
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 1rem 2rem',
          borderBottom: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
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
              color: '#64748b',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
            onMouseOut={(e) => e.target.style.background = 'none'}
          >
            ×
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem'
            }}>
              SC
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                SolCraft Nexus
              </h2>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '0.9rem'
              }}>
                Accedi alla Piattaforma Enterprise
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {[
            { id: 'wallet', label: '🔗 Wallet XRPL', desc: 'XUMM, Crossmark, Trust' },
            { id: 'web3auth', label: '🌐 Web3Auth MPC', desc: 'Social + MPC' },
            { id: 'email', label: '📧 Email', desc: 'Tradizionale' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '1rem 0.5rem',
                border: 'none',
                background: activeTab === tab.id ? '#f8fafc' : 'white',
                borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                color: activeTab === tab.id ? '#1e293b' : '#64748b',
                fontSize: '0.9rem',
                marginBottom: '0.2rem'
              }}>
                {tab.label}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#94a3b8'
              }}>
                {tab.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {/* Wallet XRPL Tab */}
          {activeTab === 'wallet' && (
            <div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Connetti il tuo Wallet XRPL
              </h3>
              <p style={{
                color: '#64748b',
                textAlign: 'center',
                marginBottom: '2rem',
                fontSize: '0.9rem'
              }}>
                Accesso sicuro e decentralizzato con il tuo wallet XRPL preferito
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* XUMM */}
                <button
                  onClick={handleXUMMLogin}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    width: '100%'
                  }}
                  onMouseOver={(e) => !isLoading && (e.target.style.borderColor = '#3b82f6')}
                  onMouseOut={(e) => !isLoading && (e.target.style.borderColor = '#e2e8f0')}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #1a365d, #2d3748)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    X
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>XUMM Wallet</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Wallet mobile ufficiale XRPL
                    </div>
                  </div>
                  {isLoading && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #e2e8f0',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                </button>

                {/* Crossmark */}
                <button
                  onClick={handleCrossmarkLogin}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    width: '100%'
                  }}
                  onMouseOver={(e) => !isLoading && (e.target.style.borderColor = '#3b82f6')}
                  onMouseOut={(e) => !isLoading && (e.target.style.borderColor = '#e2e8f0')}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    ✕
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Crossmark</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Browser extension per XRPL
                    </div>
                  </div>
                </button>

                {/* Trust Wallet */}
                <button
                  onClick={handleTrustWalletLogin}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    width: '100%'
                  }}
                  onMouseOver={(e) => !isLoading && (e.target.style.borderColor = '#3b82f6')}
                  onMouseOut={(e) => !isLoading && (e.target.style.borderColor = '#e2e8f0')}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #0052ff, #0041cc)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    T
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Trust Wallet</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Wallet multi-chain sicuro
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Web3Auth MPC Tab */}
          {activeTab === 'web3auth' && (
            <div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Web3Auth MPC
              </h3>
              <p style={{
                color: '#64748b',
                textAlign: 'center',
                marginBottom: '2rem',
                fontSize: '0.9rem'
              }}>
                Accesso con social login + tecnologia Multi-Party Computation
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Google */}
                <button
                  onClick={() => handleWeb3AuthLogin('Google')}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    width: '100%'
                  }}
                  onMouseOver={(e) => !isLoading && (e.target.style.borderColor = '#ea4335')}
                  onMouseOut={(e) => !isLoading && (e.target.style.borderColor = '#e2e8f0')}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #ea4335, #d33b2c)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    G
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Google + MPC</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Login Google con wallet MPC
                    </div>
                  </div>
                </button>

                {/* Twitter */}
                <button
                  onClick={() => handleWeb3AuthLogin('Twitter')}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    width: '100%'
                  }}
                  onMouseOver={(e) => !isLoading && (e.target.style.borderColor = '#1da1f2')}
                  onMouseOut={(e) => !isLoading && (e.target.style.borderColor = '#e2e8f0')}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #1da1f2, #0d8bd9)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    𝕏
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Twitter + MPC</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Login Twitter con wallet MPC
                    </div>
                  </div>
                </button>

                {/* Discord */}
                <button
                  onClick={() => handleWeb3AuthLogin('Discord')}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    width: '100%'
                  }}
                  onMouseOver={(e) => !isLoading && (e.target.style.borderColor = '#5865f2')}
                  onMouseOut={(e) => !isLoading && (e.target.style.borderColor = '#e2e8f0')}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #5865f2, #4752c4)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    D
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Discord + MPC</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Login Discord con wallet MPC
                    </div>
                  </div>
                </button>
              </div>

              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1.5rem'
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#0369a1',
                  fontWeight: '500'
                }}>
                  💡 Tecnologia MPC (Multi-Party Computation)
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#0369a1',
                  marginTop: '0.5rem'
                }}>
                  Le chiavi private sono distribuite e mai esposte, garantendo massima sicurezza
                </div>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                Accesso Tradizionale
              </h3>
              <p style={{
                color: '#64748b',
                textAlign: 'center',
                marginBottom: '2rem',
                fontSize: '0.9rem'
              }}>
                Accedi con email e password
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleEmailLogin(formData.get('email'), formData.get('password'));
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="inserisci@email.com"
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </button>
              </form>

              <div style={{
                textAlign: 'center',
                marginTop: '1.5rem'
              }}>
                <a href="#" style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.9rem'
                }}>
                  Password dimenticata?
                </a>
              </div>
            </div>
          )}
        </div>
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

