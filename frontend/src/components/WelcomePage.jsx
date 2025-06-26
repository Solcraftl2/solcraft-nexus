import React from 'react';

const WelcomePage = ({ onLoginClick }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '60px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          SolCraft Nexus
        </h1>
        
        <h2 style={{
          fontSize: '1.5rem',
          color: '#4a5568',
          marginBottom: '30px',
          fontWeight: '600'
        }}>
          Tokenizzazione Semplice e Sicura
        </h2>
        
        <p style={{
          fontSize: '1.1rem',
          color: '#718096',
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          La piattaforma enterprise per la tokenizzazione di Real World Assets su XRPL. 
          Trasforma i tuoi asset fisici in token digitali con sicurezza di livello bancario.
        </p>
        
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f7fafc',
            padding: '15px 25px',
            borderRadius: '10px',
            margin: '10px',
            border: '2px solid #e2e8f0'
          }}>
            <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>🏢</span>
            <span style={{ color: '#4a5568', fontWeight: '500' }}>Asset Reali</span>
          </div>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f7fafc',
            padding: '15px 25px',
            borderRadius: '10px',
            margin: '10px',
            border: '2px solid #e2e8f0'
          }}>
            <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>🔒</span>
            <span style={{ color: '#4a5568', fontWeight: '500' }}>Sicurezza Avanzata</span>
          </div>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f7fafc',
            padding: '15px 25px',
            borderRadius: '10px',
            margin: '10px',
            border: '2px solid #e2e8f0'
          }}>
            <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>📊</span>
            <span style={{ color: '#4a5568', fontWeight: '500' }}>Analytics Pro</span>
          </div>
        </div>
        
        <button
          onClick={onLoginClick}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 40px',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          🚀 Accedi alla Piattaforma
        </button>
        
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '10px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#495057',
            marginBottom: '15px'
          }}>
            🎯 Opzioni di Accesso Disponibili
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', margin: '10px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>💳</div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>XUMM Wallet</div>
            </div>
            <div style={{ textAlign: 'center', margin: '10px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>🔗</div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Crossmark</div>
            </div>
            <div style={{ textAlign: 'center', margin: '10px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>🛡️</div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Trust Wallet</div>
            </div>
            <div style={{ textAlign: 'center', margin: '10px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>🌐</div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Web3Auth</div>
            </div>
          </div>
        </div>
        
        <div style={{
          marginTop: '20px',
          fontSize: '0.9rem',
          color: '#6c757d'
        }}>
          ✨ Versione Enterprise • Sicurezza Bancaria • XRPL Native
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;

