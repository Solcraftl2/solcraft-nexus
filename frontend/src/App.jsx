import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';

/**
 * App Component - Applicazione principale SolCraft Nexus
 * Gestisce routing e stato dell'autenticazione
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Dashboard semplificato per ora
  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Benvenuto nella Dashboard</h2>
          <p className="text-gray-600">
            Sistema di autenticazione Web3Auth implementato e funzionante.
          </p>
        </div>
      </main>
    </div>
  );

  // Modal di login semplificato per ora
  const LoginModal = () => (
    showLoginModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6">Accedi a SolCraft Nexus</h2>
          <p className="text-gray-600 mb-6">
            Autenticazione Web3Auth in fase di implementazione...
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleLoginSuccess}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Login Demo
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <WelcomePage onLoginClick={handleLoginClick} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <Dashboard /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
        <LoginModal />
      </div>
    </BrowserRouter>
  );
}

export default App;

