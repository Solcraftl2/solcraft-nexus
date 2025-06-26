import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import WalletPage from './components/WalletPage';

// Dashboard con navigazione completa
const Dashboard = ({ user, onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'wallet':
        return <WalletPage user={user} />;
      case 'assets':
        return <AssetsPage user={user} />;
      case 'tokenize':
        return <TokenizePage user={user} />;
      case 'marketplace':
        return <MarketplacePage user={user} />;
      case 'learn':
        return <LearnPage user={user} />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header Dashboard */}
      <header style={{
        background: 'white',
        padding: '1rem 2rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer'
          }}
          onClick={() => setCurrentPage('dashboard')}
          >
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              SC
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e3a8a'
              }}>
                SolCraft Nexus
              </h1>
              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                Dashboard Enterprise
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {[
              { id: 'dashboard', label: '🏠 Dashboard', desc: 'Panoramica' },
              { id: 'wallet', label: '💰 Wallet', desc: 'Portafoglio' },
              { id: 'assets', label: '🏠 Asset', desc: 'Proprietà' },
              { id: 'tokenize', label: '🪙 Tokenizza', desc: 'Crea Token' },
              { id: 'marketplace', label: '🛒 Marketplace', desc: 'Trading' },
              { id: 'learn', label: '📚 Impara', desc: 'Educazione' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: currentPage === item.id ? '#f0f9ff' : 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textAlign: 'left',
                  borderBottom: currentPage === item.id ? '2px solid #3b82f6' : '2px solid transparent'
                }}
                onMouseOver={(e) => {
                  if (currentPage !== item.id) {
                    e.target.style.background = '#f8fafc';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentPage !== item.id) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  fontWeight: currentPage === item.id ? 'bold' : 'normal',
                  color: currentPage === item.id ? '#1e293b' : '#64748b',
                  fontSize: '0.9rem',
                  marginBottom: '0.1rem'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8'
                }}>
                  {item.desc}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              {user.name}
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: '#64748b'
            }}>
              {user.type === 'email' ? user.email : user.address?.substring(0, 20) + '...'}
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderCurrentPage()}
      </main>
    </div>
  );
};

// Dashboard Home Component
const DashboardHome = ({ user }) => {
  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '1rem'
        }}>
          🎉 Benvenuto nella Dashboard!
        </h2>
        
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            color: '#0369a1',
            marginBottom: '1rem',
            fontSize: '1.2rem'
          }}>
            ✅ Login Completato con Successo!
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.9rem',
            color: '#0369a1'
          }}>
            <div>
              <strong>Tipo di Login:</strong> {user.type.toUpperCase()}
            </div>
            <div>
              <strong>Nome:</strong> {user.name}
            </div>
            {user.address && (
              <div>
                <strong>Address:</strong> {user.address.substring(0, 20)}...
              </div>
            )}
            {user.email && (
              <div>
                <strong>Email:</strong> {user.email}
              </div>
            )}
            {user.provider && (
              <div>
                <strong>Provider:</strong> {user.provider}
              </div>
            )}
          </div>
        </div>

        <p style={{
          color: '#64748b',
          fontSize: '1.1rem',
          marginBottom: '2rem'
        }}>
          Hai effettuato l'accesso con successo alla piattaforma SolCraft Nexus. 
          Utilizza il menu di navigazione per esplorare tutte le funzionalità!
        </p>
      </div>

      {/* Dashboard Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              💰
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.3rem',
                color: '#1e293b'
              }}>
                Portafoglio
              </h3>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '0.9rem'
              }}>
                Gestione asset e token
              </p>
            </div>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#10b981',
            marginBottom: '0.5rem'
          }}>
            €5,000.13
          </div>
          <div style={{
            color: '#64748b',
            fontSize: '0.9rem'
          }}>
            +8.5% questo mese
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🏠
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.3rem',
                color: '#1e293b'
              }}>
                Asset Tokenizzati
              </h3>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '0.9rem'
              }}>
                Real World Assets
              </p>
            </div>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#3b82f6',
            marginBottom: '0.5rem'
          }}>
            3 Asset
          </div>
          <div style={{
            color: '#64748b',
            fontSize: '0.9rem'
          }}>
            Immobili e startup
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              📈
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.3rem',
                color: '#1e293b'
              }}>
                Performance
              </h3>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '0.9rem'
              }}>
                Rendimento totale
              </p>
            </div>
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#8b5cf6',
            marginBottom: '0.5rem'
          }}>
            +12.3%
          </div>
          <div style={{
            color: '#64748b',
            fontSize: '0.9rem'
          }}>
            Ultimi 6 mesi
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginTop: '2rem',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem'
        }}>
          🚀 Esplora la Piattaforma
        </h3>
        <p style={{
          marginBottom: '1.5rem',
          opacity: 0.9
        }}>
          Utilizza il menu di navigazione per accedere a tutte le funzionalità: 
          Wallet, Asset, Tokenizzazione, Marketplace e Centro Educativo.
        </p>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem'
          }}>
            ✅ Sistema di Login
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem'
          }}>
            ✅ Navigazione Completa
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem'
          }}>
            🔄 Pagine Avanzate
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem'
          }}>
            🔄 Database Integration
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components per le altre pagine
const AssetsPage = ({ user }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>🏠 Asset Page - In Sviluppo</h2>
    <p>Gestione proprietà tokenizzate</p>
  </div>
);

const TokenizePage = ({ user }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>🪙 Tokenize Page - In Sviluppo</h2>
    <p>Creazione nuovi token RWA</p>
  </div>
);

const MarketplacePage = ({ user }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>🛒 Marketplace Page - In Sviluppo</h2>
    <p>Trading e scambio asset</p>
  </div>
);

const LearnPage = ({ user }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>📚 Learn Page - In Sviluppo</h2>
    <p>Centro educativo e risorse</p>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        {!isAuthenticated ? (
          <WelcomePage onLogin={handleLogin} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    </Router>
  );
}

export default App;

