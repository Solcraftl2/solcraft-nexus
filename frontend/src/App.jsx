import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';
import WalletPage from './components/WalletPage';
import AssetsPage from './components/AssetsPage';
import TokenizePage from './components/TokenizePage';
import MarketplacePage from './components/MarketplacePage';
import LearnPage from './components/LearnPage';
import Layout from './components/Layout';
import AuthCallback from './components/AuthCallback';
import { useAuth } from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const { user: authUser, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    // Se c'è un utente autenticato via OAuth, usalo
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Utente',
        email: authUser.email,
        avatar: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        provider: authUser.app_metadata?.provider,
        loginType: 'oauth',
        wallet: null
      });
    } else {
      // Se non c'è utente OAuth, mantieni l'utente wallet se presente
      if (user?.loginType === 'oauth') {
        setUser(null);
      }
    }
  }, [authUser]);

  const handleLogin = (userData) => {
    setUser(userData);
    console.log('Login successful:', userData);
  };

  const handleLogout = async () => {
    // Se l'utente è loggato via OAuth, fai logout da Supabase
    if (user?.loginType === 'oauth') {
      await signOut();
    }
    
    setUser(null);
    console.log('Logout successful');
  };

  // Mostra loading durante l'inizializzazione
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Caricamento SolCraft Nexus...
          </p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Route di callback OAuth */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Se l'utente non è loggato, mostra la welcome page */}
          {!user ? (
            <>
              <Route path="/" element={<WelcomePage onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            /* Se l'utente è loggato, mostra il Layout con tutte le route */
            <>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/dashboard" element={
                <Layout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} onLogout={handleLogout} />
                </Layout>
              } />
              
              <Route path="/wallet" element={
                <Layout user={user} onLogout={handleLogout}>
                  <WalletPage user={user} />
                </Layout>
              } />
              
              <Route path="/assets" element={
                <Layout user={user} onLogout={handleLogout}>
                  <AssetsPage user={user} />
                </Layout>
              } />
              
              <Route path="/tokenize" element={
                <Layout user={user} onLogout={handleLogout}>
                  <TokenizePage user={user} />
                </Layout>
              } />
              
              <Route path="/marketplace" element={
                <Layout user={user} onLogout={handleLogout}>
                  <MarketplacePage user={user} />
                </Layout>
              } />
              
              <Route path="/learn" element={
                <Layout user={user} onLogout={handleLogout}>
                  <LearnPage user={user} />
                </Layout>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

