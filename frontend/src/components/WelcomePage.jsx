import React from 'react';

const WelcomePage = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-4xl mx-auto">
        {/* Logo e Titolo */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">SolCraft Nexus</h1>
          <p className="text-xl text-gray-600 mb-8">Piattaforma di Tokenizzazione RWA su XRPL</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-3">🏠</div>
            <h3 className="text-lg font-semibold mb-2">Tokenizzazione Immobili</h3>
            <p className="text-gray-600">Trasforma i tuoi asset immobiliari in token digitali</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-3">💼</div>
            <h3 className="text-lg font-semibold mb-2">Portfolio Management</h3>
            <p className="text-gray-600">Gestisci e monitora i tuoi investimenti</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Sicurezza XRPL</h3>
            <p className="text-gray-600">Tecnologia blockchain sicura e affidabile</p>
          </div>
        </div>

        {/* Status Box */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-green-500">
          <div className="flex items-center justify-center mb-2">
            <span className="text-green-500 text-2xl mr-2">✅</span>
            <span className="text-lg font-semibold text-green-700">Piattaforma Operativa</span>
          </div>
          <p className="text-gray-600">Sistema di autenticazione Web3 e wallet integration attivi</p>
        </div>

        {/* Pulsante Login */}
        <button
          onClick={onLoginClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Accedi alla Piattaforma
        </button>

        {/* Info Footer */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Supporta Crossmark, XUMM, Trust Wallet e login social</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;

