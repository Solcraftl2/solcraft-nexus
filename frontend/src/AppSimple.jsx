import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePageImproved from './components/WelcomePageImproved';
import DashboardSimple from './components/DashboardSimple';

/**
 * AppSimple - Versione semplificata per testare il design
 */
function AppSimple() {
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

  // Dashboard semplificato senza dipendenze esterne
  const Dashboard = () => {
    return <DashboardSimple user={null} onLogout={handleLogout} />;
  };

  // Modal di login semplificato
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
                <WelcomePageImproved onLoginClick={handleLoginClick} />
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

export default AppSimple;

