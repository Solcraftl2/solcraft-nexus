import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Componenti semplificati per il test graduale
const WelcomePage = () => {
  const [buttonClicked, setButtonClicked] = useState(false);

  const handleLogin = () => {
    setButtonClicked(true);
    alert('Benvenuto su SolCraft Nexus! Navigazione verso Dashboard...');
    // Qui aggiungeremo la navigazione reale
    window.location.hash = '#dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          color: '#333',
          fontWeight: 'bold'
        }}>
          🚀 SolCraft Nexus
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#666',
          marginBottom: '2rem'
        }}>
          Piattaforma di Tokenizzazione RWA su XRPL
        </p>

        <div style={{
          background: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '10px',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#333', marginBottom: '1rem' }}>
            ✅ Test di Navigazione
          </h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            React Router integrato - Pronto per la navigazione tra pagine
          </p>
        </div>

        <button
          onClick={handleLogin}
          style={{
            background: buttonClicked ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: buttonClicked ? 'scale(1.05)' : 'scale(1)',
            fontWeight: 'bold'
          }}
        >
          {buttonClicked ? 'Navigazione Attiva!' : 'Accedi alla Dashboard'}
        </button>

        <p style={{
          fontSize: '0.8rem',
          color: '#999',
          marginTop: '2rem'
        }}>
          Deploy Test - {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#333',
          marginBottom: '2rem'
        }}>
          📊 Dashboard SolCraft Nexus
        </h1>
        
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>
            ✅ React Router Funzionante!
          </h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Sei riuscito a navigare dalla Welcome Page alla Dashboard!
          </p>
          <button
            onClick={() => window.location.hash = '#welcome'}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.8rem 1.5rem',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ← Torna alla Welcome Page
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#333' }}>💰 Portafoglio</h3>
            <p style={{ color: '#666' }}>€1,250.75</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#333' }}>🏠 Asset</h3>
            <p style={{ color: '#666' }}>3 Asset Attivi</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#333' }}>📈 Performance</h3>
            <p style={{ color: '#666' }}>+8.5% questo mese</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  // Gestione semplificata del routing con hash
  const [currentPage, setCurrentPage] = useState('welcome');

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'dashboard') {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('welcome');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <Router>
      <div className="App">
        {currentPage === 'welcome' ? <WelcomePage /> : <Dashboard />}
      </div>
    </Router>
  );
}

export default App;

