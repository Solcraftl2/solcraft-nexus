import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TokenizationSimple from './components/TokenizationSimple';
import DashboardProfessionalNew from './components/DashboardProfessionalNew';
import walletService from './services/walletService.js';
import xrplService from './services/xrplService.js';

/**
 * App SolCraft Nexus - Versione con integrazione XRPL reale
 * Sostituisce tutte le implementazioni simulate con funzionalità blockchain reali
 */
function AppFixed() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTokenizationModal, setShowTokenizationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);

  // Inizializzazione e verifica wallet disponibili
  useEffect(() => {
    const initializeWallets = async () => {
      try {
        await walletService.checkAvailableWallets();
        const wallets = walletService.getAvailableWallets();
        setAvailableWallets(wallets);
        console.log('✅ Wallet disponibili:', wallets);
      } catch (error) {
        console.error('❌ Errore inizializzazione wallet:', error);
        setError('Errore durante l\'inizializzazione dei wallet');
      }
    };

    initializeWallets();

    // Listener per eventi wallet
    const handleWalletConnected = (data) => {
      console.log('🔗 Wallet connesso:', data);
      setWalletData(data);
      setIsAuthenticated(true);
      setShowWalletModal(false);
      setIsLoading(false);
    };

    const handleWalletDisconnected = () => {
      console.log('🚪 Wallet disconnesso');
      setWalletData(null);
      setIsAuthenticated(false);
    };

    const handleWalletError = (error) => {
      console.error('❌ Errore wallet:', error);
      setError(error.message || 'Errore di connessione wallet');
      setIsLoading(false);
    };

    // Registra listener
    walletService.on('connected', handleWalletConnected);
    walletService.on('disconnected', handleWalletDisconnected);
    walletService.on('error', handleWalletError);

    // Cleanup
    return () => {
      walletService.off('connected', handleWalletConnected);
      walletService.off('disconnected', handleWalletDisconnected);
      walletService.off('error', handleWalletError);
    };
  }, []);

  // Gestione connessione wallet reale
  const handleWalletConnect = async (walletType) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔄 Connessione a ${walletType}...`);
      
      // Connessione reale tramite walletService
      const result = await walletService.connectWallet(walletType);
      
      if (result.success) {
        // Il listener handleWalletConnected gestirà il resto
        console.log('✅ Connessione wallet riuscita');
      } else {
        throw new Error(result.error || 'Connessione fallita');
      }
    } catch (error) {
      console.error('❌ Errore connessione wallet:', error);
      setError(error.message || 'Errore durante la connessione');
      setIsLoading(false);
    }
  };

  // Disconnessione wallet reale
  const handleDisconnect = async () => {
    try {
      await walletService.disconnect();
      // Il listener handleWalletDisconnected gestirà il resto
    } catch (error) {
      console.error('❌ Errore disconnessione:', error);
      setError(error.message || 'Errore durante la disconnessione');
    }
  };

  const openWalletModal = () => {
    setShowWalletModal(true);
    setError(null);
  };

  // Loading screen durante connessione wallet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Connessione in corso...</h2>
          <p className="text-blue-200">
            Connettendo al wallet XRPL e caricando i dati blockchain...
          </p>
          <p className="text-blue-300 text-sm mt-2">
            Autorizza la connessione nel popup del wallet
          </p>
        </div>
      </div>
    );
  }

  // Homepage con branding SolCraft Nexus
  const Homepage = ({ onOpenPortal }) => (
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
          🔗 Connetti Wallet
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

  // Modal wallet con opzioni reali
  const WalletModal = ({ isOpen, onClose, onConnect }) => {
    if (!isOpen) return null;

    // Opzioni wallet reali basate su quelli disponibili
    const walletOptions = [
      {
        id: 'xumm',
        name: 'XUMM Wallet',
        icon: '🦄',
        description: 'Wallet XRPL ufficiale con popup di autorizzazione',
        available: availableWallets.includes('xumm'),
        recommended: true
      },
      {
        id: 'crossmark',
        name: 'Crossmark',
        icon: '✖️',
        description: 'Wallet browser extension per XRPL',
        available: availableWallets.includes('crossmark'),
        recommended: true
      },
      {
        id: 'web3auth',
        name: 'Web3Auth',
        icon: '🔐',
        description: 'Accesso tramite social login (Google, GitHub, etc.)',
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
            <h2 style={{ fontSize: '1.5rem', color: '#1a202c' }}>Connetti Wallet</h2>
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

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '10px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '5px',
              color: '#dc2626'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {walletOptions.map(option => (
              <button
                key={option.id}
                onClick={() => option.available ? onConnect(option.id) : null}
                disabled={!option.available}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  border: option.available ? '2px solid #e2e8f0' : '2px solid #f1f5f9',
                  borderRadius: '10px',
                  background: option.available ? 'white' : '#f8fafc',
                  cursor: option.available ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  opacity: option.available ? 1 : 0.6
                }}
                onMouseOver={(e) => {
                  if (option.available) {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.background = '#f8fafc';
                  }
                }}
                onMouseOut={(e) => {
                  if (option.available) {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = 'white';
                  }
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
                        CONSIGLIATO
                      </span>
                    )}
                    {!option.available && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        NON DISPONIBILE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>{option.description}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px'
          }}>
            <p style={{ fontSize: '0.9rem', color: '#0369a1', margin: 0 }}>
              💡 <strong>Suggerimento:</strong> Per la migliore esperienza, installa XUMM o Crossmark. 
              Questi wallet supportano tutte le funzionalità XRPL native.
            </p>
          </div>
        </div>
      </div>
    );
  };

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
                <DashboardProfessionalNew 
                  walletData={walletData} 
                  onDisconnect={handleDisconnect}
                  onOpenTokenization={() => setShowTokenizationModal(true)}
                /> : 
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

        {/* Tokenization Modal */}
        {showTokenizationModal && (
          <TokenizationSimple
            walletData={walletData}
            onClose={() => setShowTokenizationModal(false)}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default AppFixed;

