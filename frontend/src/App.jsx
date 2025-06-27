import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
    console.log('Login successful:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
    console.log('Logout successful');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    console.log('Navigating to:', page);
  };

  // Se l'utente è loggato, mostra il Layout con Dashboard
  if (user) {
    return (
      <BrowserRouter>
        <div className="App">
          <Layout 
            currentPage={currentPage}
            user={user} 
            onLogout={handleLogout}
          >
            <Dashboard 
              user={user} 
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </Layout>
        </div>
      </BrowserRouter>
    );
  }

  // Se l'utente non è loggato, mostra la welcome page
  return (
    <div className="App">
      <WelcomePage onLogin={handleLogin} />
    </div>
  );
}

export default App;

