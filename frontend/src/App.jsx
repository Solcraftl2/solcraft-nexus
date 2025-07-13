import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/**
 * App SolCraft Nexus - Versione semplificata per debugging
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🚀 App component rendering...');

  // Homepage semplificata
  const Homepage = ({ onOpenPortal }) => {
    console.log('🏠 Homepage rendering...');
    
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px', fontWeight: 'bold' }}>
            🚀 SolCraft Nexus
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', opacity: 0.9 }}>
            Piattaforma di tokenizzazione asset su blockchain XRPL
          </p>
          <p style={{ fontSize: '1rem', marginBottom: '30px', opacity: 0.8 }}>
            Connetti il tuo wallet per accedere alle funzionalità di tokenizzazione, trading e gestione asset
          </p>
          <button
            onClick={onOpenPortal}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid white',
              color: 'white',
              padding: '15px 30px',
              fontSize: '1.1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#667eea';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.color = 'white';
            }}
          >
            🔗 Open Portal
          </button>
          
          {error && (
            <div style={{
              marginTop: '20px',
              padding: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '5px',
              color: '#fecaca'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dashboard semplificata
  const Dashboard = () => {
    console.log('📊 Dashboard rendering...');
    
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              🚀 SolCraft Nexus Dashboard
            </h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid white',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🚪 Disconnect
            </button>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.1)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
              ✅ Wallet Connected Successfully!
            </h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              Welcome to SolCraft Nexus. Your XRPL wallet is connected and ready for tokenization.
            </p>
            <div style={{ marginTop: '30px' }}>
              <button
                style={{
                  background: 'rgba(16, 185, 129, 0.8)',
                  border: 'none',
                  color: 'white',
                  padding: '15px 30px',
                  fontSize: '1.1rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  marginRight: '15px'
                }}
              >
                💎 Tokenize Asset
              </button>
              <button
                style={{
                  background: 'rgba(59, 130, 246, 0.8)',
                  border: 'none',
                  color: 'white',
                  padding: '15px 30px',
                  fontSize: '1.1rem',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                📊 View Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal wallet semplificato
  const WalletModal = ({ isOpen, onClose, onConnect }) => {
    if (!isOpen) return null;

    console.log('🔗 WalletModal rendering...');

    const walletOptions = [
      {
        id: 'xumm',
        name: 'XUMM Wallet',
        icon: '🦄',
        description: 'Real XRPL Testnet',
        available: true,
        recommended: true
      },
      {
        id: 'crossmark',
        name: 'Crossmark',
        icon: '✅',
        description: 'Browser Extension',
        available: true,
        recommended: true
      },
      {
        id: 'web3auth',
        name: 'Web3Auth',
        icon: '🔐',
        description: 'Social Login',
        available: true,
        recommended: false
      }
    ];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#1a202c' }}>Connect Your Wallet</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {walletOptions.map(option => (
              <button
                key={option.id}
                onClick={() => onConnect(option.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.background = '#f8fafc';
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = 'white';
                }}
              >
                <div style={{ fontSize: '2rem' }}>{option.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#1a202c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    {option.name}
                    {option.recommended && (
                      <span style={{
                        background: '#10b981',
                        color: 'white',
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Gestione connessione wallet
  const handleWalletConnect = async (walletType) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔄 Connecting to ${walletType}...`);
      
      // Simulazione connessione per debugging
      setTimeout(() => {
        setIsAuthenticated(true);
        setShowWalletModal(false);
        setIsLoading(false);
        console.log('✅ Wallet connected successfully!');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      setError(error.message || 'Connection failed');
      setIsLoading(false);
    }
  };

  const openWalletModal = () => {
    console.log('🔗 Opening wallet modal...');
    setShowWalletModal(true);
    setError(null);
  };

  // Loading screen
  if (isLoading) {
    console.log('⏳ Loading screen rendering...');
    
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Connecting wallet...</h2>
          <p style={{ opacity: 0.8 }}>Please wait while we connect to your wallet</p>
        </div>
      </div>
    );
  }

  console.log('🎯 App main render, isAuthenticated:', isAuthenticated);

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Homepage onOpenPortal={openWalletModal} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <Dashboard /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Wallet Connection Modal */}
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onConnect={handleWalletConnect}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;

