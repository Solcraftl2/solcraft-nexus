import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';
import WalletPage from './components/WalletPage';
import AssetsPage from './components/AssetsPage';
import TokenizePage from './components/TokenizePage';
import MarketplacePage from './components/MarketplacePage';
import LearnPage from './components/LearnPage';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    console.log('Login successful:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    console.log('Logout successful');
  };

  // Se l'utente non è loggato, mostra la welcome page
  if (!user) {
    return (
      <div className="App">
        <WelcomePage onLogin={handleLogin} />
      </div>
    );
  }

  // Se l'utente è loggato, mostra il Layout con tutte le route
  return (
    <BrowserRouter>
      <div className="App">
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Main application routes */}
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  user={user} 
                  onLogout={handleLogout}
                />
              } 
            />
            <Route 
              path="/wallet" 
              element={
                <WalletPage 
                  user={user}
                />
              } 
            />
            <Route 
              path="/assets" 
              element={
                <AssetsPage 
                  user={user}
                />
              } 
            />
            <Route 
              path="/tokenize" 
              element={
                <TokenizePage 
                  user={user}
                />
              } 
            />
            <Route 
              path="/marketplace" 
              element={
                <MarketplacePage 
                  user={user}
                />
              } 
            />
            <Route 
              path="/learn" 
              element={
                <LearnPage 
                  user={user}
                />
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </div>
    </BrowserRouter>
  );
}

export default App;

