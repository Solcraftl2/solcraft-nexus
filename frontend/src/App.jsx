import React, { useState } from 'react';
import WelcomePage from './components/WelcomePage';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    console.log('Login successful:', userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Se l'utente è loggato, mostra la dashboard
  if (user) {
    return (
      <div className="App" style={{ padding: '2rem' }}>
        <div style={{ 
          backgroundColor: '#f8fafc', 
          borderRadius: '1rem', 
          padding: '2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{ color: '#1f2937', margin: 0 }}>
              🎉 Benvenuto in SolCraft Nexus!
            </h1>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Logout
            </button>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ color: '#374151', marginTop: 0 }}>
              ✅ Login Completato con Successo!
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>👤 Nome:</strong> {user.name}
            </div>
            
            {user.email && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>📧 Email:</strong> {user.email}
              </div>
            )}
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>🔐 Provider:</strong> {user.provider}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>🎭 Tipo:</strong> {user.isSimulated ? '🎪 Simulato (Demo)' : '✅ Reale'}
            </div>

            {user.wallet && (
              <div style={{ 
                backgroundColor: '#f0fdf4', 
                border: '1px solid #bbf7d0',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <h3 style={{ color: '#166534', marginTop: 0 }}>
                  💰 Wallet XRPL Connesso
                </h3>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>📍 Address:</strong> 
                  <code style={{ 
                    backgroundColor: '#dcfce7', 
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    marginLeft: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    {user.wallet.address}
                  </code>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>🌐 Network:</strong> {user.wallet.network}
                </div>
                <div>
                  <strong>🔗 Tipo:</strong> {user.wallet.type}
                </div>
              </div>
            )}

            {user.message && (
              <div style={{ 
                backgroundColor: '#fef3c7', 
                border: '1px solid #fbbf24',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <strong>ℹ️ Info:</strong> {user.message}
              </div>
            )}

            {user.error && (
              <div style={{ 
                backgroundColor: '#fee2e2', 
                border: '1px solid #f87171',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <strong>⚠️ Errore:</strong> {user.error}
              </div>
            )}
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            padding: '1.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ color: '#374151', marginTop: 0 }}>
              🚀 Prossimi Passi
            </h2>
            <ul style={{ textAlign: 'left', color: '#6b7280' }}>
              <li>✨ Esplora la piattaforma di tokenizzazione</li>
              <li>💎 Crea i tuoi primi token RWA</li>
              <li>🔄 Gestisci le tue transazioni XRPL</li>
              <li>📊 Monitora il tuo portfolio</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Se l'utente non è loggato, mostra la welcome page
  return (
    <div className="App">
      <WelcomePage onLogin={handleLogin} />
    </div>
  );
}

export default App;

