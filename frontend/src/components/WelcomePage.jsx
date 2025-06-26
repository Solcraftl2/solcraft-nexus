import React, { useState } from 'react';
import LoginModal from './LoginModal';

const WelcomePage = ({ onLogin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginSuccess = (userData) => {
    setShowLoginModal(false);
    onLogin(userData);
  };

  const handleOpenLogin = () => {
    setShowLoginModal(true);
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🚀 SolCraft Nexus</h1>
      <p>Piattaforma di Tokenizzazione RWA su XRPL</p>
      <button 
        onClick={handleOpenLogin}
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

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default WelcomePage;

