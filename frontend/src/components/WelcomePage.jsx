import React from 'react';

/**
 * WelcomePage - Pagina di benvenuto professionale
 * Design moderno con call-to-action per l'autenticazione
 */
const WelcomePage = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">SolCraft Nexus</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onLoginClick}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Accedi
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            SolCraft Nexus
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Piattaforma di Tokenizzazione RWA su XRPL
          </p>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 mb-16">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Tokenizzazione Immobili
              </h3>
              <p className="text-gray-600">
                Trasforma i tuoi asset immobiliari in token digitali
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Portfolio Management
              </h3>
              <p className="text-gray-600">
                Gestisci e monitora i tuoi investimenti
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sicurezza XRPL
              </h3>
              <p className="text-gray-600">
                Tecnologia blockchain sicura e affidabile
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            ✅ Piattaforma Operativa
          </div>

          {/* CTA Section */}
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sistema di autenticazione Web3 e wallet integration attivi
            </h2>
            <p className="text-gray-600 mb-6">
              Supporta Crossmark, XUMM, Trust Wallet e login social
            </p>
            <button
              onClick={onLoginClick}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Accedi alla Piattaforma
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">SolCraft Nexus</h3>
            <p className="text-gray-400 mb-4">
              Tokenizzazione professionale su XRPL
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Termini di Servizio</a>
              <a href="#" className="hover:text-white">Supporto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;

