import React from 'react';

/**
 * App semplificata per debug Web3Auth
 */
function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SolCraft Nexus
        </h1>
        <p className="text-gray-600 mb-8">
          Piattaforma di tokenizzazione XRPL
        </p>
        <button 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          onClick={() => alert('Test funzionante!')}
        >
          Test React
        </button>
      </div>
    </div>
  );
}

export default App;

