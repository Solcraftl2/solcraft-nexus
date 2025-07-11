import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomepagePerfect from './components/HomepagePerfect';
import DashboardEnterprise from './components/DashboardEnterprise';
import WalletConnectionReal from './components/WalletConnectionReal';

/**
 * App principale SolCraft Nexus con componenti enterprise
 */
function AppFinal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletConnect = (wallet) => {
    setIsLoading(true);
    setWalletData(wallet);
    
    // Simula caricamento dati wallet
    setTimeout(() => {
      setIsAuthenticated(true);
      setShowWalletModal(false);
      setIsLoading(false);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsAuthenticated(false);
    setWalletData(null);
  };

  const openWalletModal = () => {
    setShowWalletModal(true);
  };

  // Loading screen durante connessione wallet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Connessione in corso...</h2>
          <p className="text-blue-200">
            Connettendo a {walletData?.name || 'wallet'} e caricando i dati XRPL
          </p>
          <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-white">Wallet connesso</span>
            </div>
            <div className="flex items-center space-x-3 mt-2">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white">Caricamento dati blockchain...</span>
            </div>
          </div>
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
                <HomepagePerfect onOpenPortal={openWalletModal} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <DashboardEnterprise 
                  walletData={walletData} 
                  onDisconnect={handleDisconnect} 
                /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Wallet Connection Modal */}
        {showWalletModal && (
          <WalletConnectionReal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            onConnect={handleWalletConnect}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default AppFinal;

