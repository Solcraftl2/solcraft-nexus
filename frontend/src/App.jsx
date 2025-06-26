import React, { useState } from 'react';

function App() {
  const [showMessage, setShowMessage] = useState(false);
  
  const handleButtonClick = () => {
    setShowMessage(true);
    alert('Pulsante funzionante! SolCraft Nexus è operativo.');
  };

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{
        color: '#1a202c',
        fontSize: '2.5rem',
        marginBottom: '1rem'
      }}>
        🚀 SolCraft Nexus
      </h1>
      
      <p style={{
        color: '#4a5568',
        fontSize: '1.2rem',
        marginBottom: '2rem',
        maxWidth: '600px'
      }}>
        Piattaforma di Tokenizzazione RWA su XRPL
      </p>
      
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{
          color: '#2d3748',
          marginBottom: '1rem'
        }}>
          Test di Funzionamento
        </h2>
        
        <p style={{
          color: '#718096',
          marginBottom: '1.5rem'
        }}>
          {showMessage ? 
            '✅ Pulsante cliccato! React funziona perfettamente!' : 
            'Se vedi questo messaggio, React funziona correttamente!'
          }
        </p>
        
        <button 
          onClick={handleButtonClick}
          style={{
            backgroundColor: showMessage ? '#10b981' : '#3b82f6',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.3s ease',
            transform: showMessage ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {showMessage ? '✅ Funziona!' : 'Accedi alla Piattaforma'}
        </button>
        
        {showMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#d1fae5',
            borderRadius: '0.5rem',
            color: '#065f46'
          }}>
            🎉 Interattività confermata! Il pulsante risponde correttamente.
          </div>
        )}
      </div>
      
      <div style={{
        marginTop: '2rem',
        color: '#a0aec0',
        fontSize: '0.9rem'
      }}>
        Deploy Test - {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default App;

