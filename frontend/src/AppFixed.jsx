import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TokenizationSimple from './components/TokenizationSimple';
import DashboardProfessionalNew from './components/DashboardProfessionalNew';

/**
 * App SolCraft Nexus - Versione semplificata per debug
 */
function AppFixed() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTokenizationModal, setShowTokenizationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletConnect = (wallet) => {
    setIsLoading(true);
    setWalletData(wallet);
    
    // Simula caricamento dati wallet
    setTimeout(() => {
      setIsAuthenticated(true);
      setShowWalletModal(false);
      setIsLoading(false);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsAuthenticated(false);
    setWalletData(null);
  };

  const openWalletModal = () => {
    setShowWalletModal(true);
  };

  // Loading screen durante connessione wallet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Connessione in corso...</h2>
          <p className="text-blue-200">
            Connettendo a {walletData?.name || 'wallet'} e caricando i dati XRPL
          </p>
        </div>
      </div>
    );
  }

  // Homepage semplificata
  const SimplifiedHomepage = ({ onOpenPortal }) => (
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
      </div>
    </div>
  );

  // Dashboard semplificata
  const SimplifiedDashboard = ({ walletData, onDisconnect }) => (
    <div style={{ 
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#1a202c', marginBottom: '5px' }}>
              Dashboard XRPL
            </h1>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              Wallet: {walletData?.address?.substring(0, 10)}...{walletData?.address?.substring(-6)}
            </p>
          </div>
          <button
            onClick={onDisconnect}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🚪 Disconnetti
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            background: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#1a202c', marginBottom: '10px' }}>💰 Bilancio XRP</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
              {walletData?.balance || 0} XRP
            </p>
          </div>

          <div style={{ 
            background: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#1a202c', marginBottom: '10px' }}>🏷️ Token Posseduti</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {walletData?.tokensCount || 0}
            </p>
          </div>

          <div style={{ 
            background: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#1a202c', marginBottom: '10px' }}>📊 Valore Portfolio</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              €{(walletData?.balance * 0.52 || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setShowTokenizationModal(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '15px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            🏷️ Tokenizza Asset
          </button>

          <button
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              padding: '15px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            💱 Trading DEX
          </button>

          <button
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none',
              padding: '15px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            📊 Analytics
          </button>
        </div>

        {/* Wallet Info */}
        <div style={{ 
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#1a202c', marginBottom: '15px' }}>📋 Informazioni Wallet</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <strong>Tipo:</strong> {walletData?.type || 'N/A'}
            </div>
            <div>
              <strong>Network:</strong> {walletData?.network || 'N/A'}
            </div>
            <div>
              <strong>Indirizzo:</strong> 
              <code style={{ 
                background: '#f1f5f9',
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: '10px',
                fontSize: '0.9rem'
              }}>
                {walletData?.address || 'N/A'}
              </code>
            </div>
            {walletData?.features && (
              <div>
                <strong>Caratteristiche:</strong> {walletData.features.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Modal wallet semplificato
  const SimplifiedWalletModal = ({ isOpen, onClose, onConnect }) => {
    if (!isOpen) return null;

    const walletOptions = [
      {
        id: 'demo',
        name: 'Modalità Demo',
        icon: '🎭',
        description: 'Accesso demo con dati simulati'
      },
      {
        id: 'testnet',
        name: 'Wallet Testnet',
        icon: '🧪',
        description: 'Genera wallet su XRPL Testnet'
      }
    ];

    const handleWalletSelect = (walletId) => {
      const walletData = {
        demo: {
          type: 'demo',
          name: 'Wallet Demo',
          address: 'rDemoAddress1234567890Demo1234567890',
          balance: 1000,
          network: 'demo',
          tokensCount: 3,
          features: ['Demo', 'Sicuro', 'Test']
        },
        testnet: {
          type: 'testnet',
          name: 'Wallet Testnet',
          address: 'rTestnetAddr1234567890Testnet1234567890',
          balance: 500,
          network: 'testnet',
          tokensCount: 1,
          features: ['Testnet', 'Reale', 'XRPL']
        }
      };

      onConnect(walletData[walletId]);
    };

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

          <div style={{ display: 'grid', gap: '15px' }}>
            {walletOptions.map(option => (
              <button
                key={option.id}
                onClick={() => handleWalletSelect(option.id)}
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
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1a202c' }}>{option.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>{option.description}</div>
                </div>
              </button>
            ))}
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
                <SimplifiedHomepage onOpenPortal={openWalletModal} />
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
        <SimplifiedWalletModal
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

