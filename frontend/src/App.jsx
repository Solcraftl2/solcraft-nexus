import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';
import LoginModal from './components/LoginModal';
import { useAuth } from './services/authService';

function App() {
  const { isAuthenticated, user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (userData) => {
    console.log('Login successful:', userData);
    setShowLoginModal(false);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  // Mostra loading durante il ripristino della sessione
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

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
                <Dashboard user={user} /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={handleCloseModal}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;

