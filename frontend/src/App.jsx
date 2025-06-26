import React, { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import Dashboard from './components/Dashboard';
import WalletPage from './components/WalletPage';
import AssetsPage from './components/AssetsPage';
import TokenizePage from './components/TokenizePage';
import MarketplacePage from './components/MarketplacePage';
import LearnPage from './components/LearnPage';
import TradingSystem from './components/TradingSystem';
import NotificationSystem from './components/NotificationSystem';
import AdvancedAnalytics from './components/AdvancedAnalytics';

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

  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <WelcomePage onLogin={handleLogin} />;
      case 'dashboard':
        return (
          <div>
            <NotificationSystem user={user} />
            <Dashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
            <AdvancedAnalytics user={user} />
          </div>
        );
      case 'wallet':
        return <WalletPage user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
      case 'assets':
        return <AssetsPage user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
      case 'tokenize':
        return <TokenizePage user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
      case 'marketplace':
        return <TradingSystem user={user} onNavigate={handleNavigate} />;
      case 'learn':
        return <LearnPage user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
      default:
        return <WelcomePage onLogin={handleLogin} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;

