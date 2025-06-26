import React, { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';
import WalletPage from './components/WalletPage';
import AssetsPage from './components/AssetsPage';
import TokenizePage from './components/TokenizePage';
import RiskMarketplace from './components/RiskMarketplace';
import TradingSystem from './components/TradingSystem';
import LearnPage from './components/LearnPage';
import Web3AuthProvider from './context/Web3AuthContext';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('welcome');

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('welcome');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <WelcomePage onLogin={handleLogin} />;
      case 'dashboard':
        return <Dashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
      case 'wallet':
        return <WalletPage user={user} onNavigate={handleNavigate} />;
      case 'assets':
        return <AssetsPage user={user} onNavigate={handleNavigate} />;
      case 'tokenize':
        return <TokenizePage user={user} onNavigate={handleNavigate} />;
      case 'marketplace':
        return <RiskMarketplace user={user} onNavigate={handleNavigate} />;
      case 'trading':
        return <TradingSystem user={user} onNavigate={handleNavigate} />;
      case 'learn':
        return <LearnPage user={user} onNavigate={handleNavigate} />;
      default:
        return <WelcomePage onLogin={handleLogin} />;
    }
  };

  return (
    <Web3AuthProvider>
      <div className="App">
        {renderCurrentPage()}
      </div>
    </Web3AuthProvider>
  );
}

export default App;

