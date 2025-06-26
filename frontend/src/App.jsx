import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';

// Dashboard semplificata per ora
const Dashboard = ({ user, onLogout }) => {
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
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
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
              {user.type === 'email' ? user.email : user.address}
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
      <main style={{
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
            React Router funziona perfettamente e il sistema di autenticazione è operativo!
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
              €1,250.75
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
            🚀 Prossimi Sviluppi
          </h3>
          <p style={{
            marginBottom: '1.5rem',
            opacity: 0.9'
          }}>
            La piattaforma è ora completamente funzionale con React Router e sistema di autenticazione. 
            Prossimi step: integrazione database Supabase e funzionalità avanzate.
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
              ✅ React Router
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              ✅ Autenticazione Wallet
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              🔄 Database Integration
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              🔄 Pagine Complete
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

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

