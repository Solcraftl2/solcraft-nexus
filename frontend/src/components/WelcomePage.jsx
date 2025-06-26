import React from 'react';

const WelcomePage = ({ onLogin }) => {
  const handleTestLogin = () => {
    onLogin({ name: 'Test User', email: 'test@example.com' });
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🚀 SolCraft Nexus</h1>
      <p>Piattaforma di Tokenizzazione RWA su XRPL</p>
      <button 
        onClick={handleTestLogin}
        style={{
          padding: '1rem 2rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1rem',
          marginTop: '2rem'
        }}
      >
        Accedi alla Piattaforma
      </button>
    </div>
  );
};

export default WelcomePage;

