import React from 'react';

/**
 * App semplificata per test
 */
function AppSimple() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🚀 SolCraft Nexus - Test App
      </h1>
      
      <div style={{ 
        background: '#f0f8ff', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>✅ React App Funzionante!</h2>
        <p>Se vedi questo messaggio, React si sta caricando correttamente.</p>
      </div>

      <button 
        onClick={() => alert('Test button funziona!')}
        style={{
          background: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        🧪 Test Button
      </button>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Timestamp: {new Date().toLocaleString()}</p>
        <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
      </div>
    </div>
  );
}

export default AppSimple;

