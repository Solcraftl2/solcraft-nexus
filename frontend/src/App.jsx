import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WalletPage from './components/WalletPage';
import AssetsPage from './components/AssetsPage';
import TokenizePage from './components/TokenizePage';
import MarketplacePage from './components/MarketplacePage';
import LearnPage from './components/LearnPage';
import LoginModal from './components/LoginModal';
import WelcomePage from './components/WelcomePage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Controlla se l'utente è già autenticato al caricamento
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Verifica se il token è valido
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('Errore verifica autenticazione:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  // Componente per proteggere le route autenticate
  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <>
          <WelcomePage onLoginClick={handleLoginClick} />
          <LoginModal 
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        </>
      );
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Route pubbliche */}
        <Route path="/welcome" element={
          <>
            <WelcomePage onLoginClick={handleLoginClick} />
            <LoginModal 
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          </>
        } />

        {/* Route protette */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout currentPage="dashboard" user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout currentPage="dashboard" user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/wallet" element={
          <ProtectedRoute>
            <Layout currentPage="wallet" user={user} onLogout={handleLogout}>
              <WalletPage user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/assets" element={
          <ProtectedRoute>
            <Layout currentPage="assets" user={user} onLogout={handleLogout}>
              <AssetsPage user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/tokenize" element={
          <ProtectedRoute>
            <Layout currentPage="tokenize" user={user} onLogout={handleLogout}>
              <TokenizePage user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/marketplace" element={
          <ProtectedRoute>
            <Layout currentPage="marketplace" user={user} onLogout={handleLogout}>
              <MarketplacePage user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/learn" element={
          <ProtectedRoute>
            <Layout currentPage="learn" user={user} onLogout={handleLogout}>
              <LearnPage user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Redirect per route non trovate */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

