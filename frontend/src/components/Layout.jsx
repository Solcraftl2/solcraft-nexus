import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { HelpIcon } from './ui/tooltip';
import WalletConnect from './WalletConnect.jsx';
import LoginModal from './LoginModal.jsx';
import authService from '../services/authService.js';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);

  useEffect(() => {
    // Controlla se l'utente è già autenticato
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await authService.checkAuthStatus();
      if (result.success) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Errore controllo autenticazione:', error);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setWalletInfo(null);
  };

  const handleWalletConnected = (info) => {
    setWalletInfo(info);
  };

  const handleWalletDisconnected = () => {
    setWalletInfo(null);
  };

  const navigation = [
    { name: 'Dashboard', href: '#', icon: '📊', current: true },
    { name: 'Portfolio', href: '#', icon: '💼', current: false },
    { name: 'Tokenizza Asset', href: '#', icon: '🏗️', current: false },
    { name: 'Marketplace', href: '#', icon: '🏪', current: false },
    { name: 'Transazioni', href: '#', icon: '💸', current: false },
    { name: 'Sicurezza', href: '#', icon: '🛡️', current: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
          <h1 className="text-xl font-bold text-white">SolCraft Nexus</h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.current
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
                <HelpIcon 
                  content={`Gestisci ${item.name.toLowerCase()} della tua piattaforma`}
                  className="ml-auto"
                />
              </a>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.first_name?.[0] || user.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              
              {/* Wallet Connection */}
              <WalletConnect 
                onWalletConnected={handleWalletConnected}
                onWalletDisconnected={handleWalletDisconnected}
              />
              
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-red-600 hover:text-red-800"
              >
                Disconnetti
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Accedi / Registrati
              </button>
              
              <WalletConnect 
                onWalletConnected={handleWalletConnected}
                onWalletDisconnected={handleWalletDisconnected}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Apri sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Dashboard Tokenizzazione
              </h2>
              <HelpIcon 
                content="Panoramica completa dei tuoi asset tokenizzati, portfolio e attività recenti"
                className="ml-2"
              />
            </div>
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Status indicators */}
              {walletInfo && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Wallet Connesso</span>
                </div>
              )}
              
              {user && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Autenticato</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

