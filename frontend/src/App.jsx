import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Componente WelcomePage semplificato
const WelcomePage = ({ onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = () => {
    // Simula login per test
    onLogin({
      id: 'test-user',
      name: 'Utente Test',
      email: 'test@example.com',
      loginType: 'test'
    });
  };

  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <h1 style={{ color: '#3b82f6', fontSize: '3rem', marginBottom: '1rem' }}>
        🚀 SolCraft Nexus
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '2rem' }}>
        Piattaforma di Tokenizzazione RWA su XRPL
      </p>
      
      <div style={{
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '0.5rem',
        border: '1px solid #3b82f6',
        maxWidth: '600px',
        margin: '0 auto 2rem'
      }}>
        <p style={{ color: '#1e40af', fontWeight: 'bold' }}>
          ✅ React + Router funzionano correttamente!
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Sistema di navigazione attivo
        </p>
      </div>

      <button 
        onClick={handleLogin}
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
      >
        Accedi alla Piattaforma
      </button>
    </div>
  );
};

// Componente Dashboard semplificato
const Dashboard = ({ user, onLogout }) => {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ color: '#1f2937', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            Benvenuto, {user.name}!
          </p>
        </div>
        <button 
          onClick={onLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: '#1f2937', marginTop: 0 }}>Portfolio</h3>
          <p style={{ color: '#6b7280' }}>Valore totale: €0.00</p>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: '#1f2937', marginTop: 0 }}>Asset Tokenizzati</h3>
          <p style={{ color: '#6b7280' }}>Nessun asset ancora</p>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: '#1f2937', marginTop: 0 }}>Transazioni</h3>
          <p style={{ color: '#6b7280' }}>Nessuna transazione</p>
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '0.5rem',
        border: '1px solid #3b82f6'
      }}>
        <p style={{ color: '#1e40af', fontWeight: 'bold', margin: 0 }}>
          ✅ Dashboard funzionante! Prossimo: Componenti avanzati
        </p>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    console.log('Login successful:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    console.log('Logout successful');
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {!user ? (
            <>
              <Route path="/" element={<WelcomePage onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <Dashboard user={user} onLogout={handleLogout} />
              } />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

