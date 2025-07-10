import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomepagePerfect from './components/HomepagePerfect';
import DashboardXRPL from './components/DashboardXRPL';
import WalletConnectModal from './components/WalletConnectModal';

/**
 * AppFinal - Versione finale con design Dione Protocol + Dashboard Vercel
 */
function AppFinal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleOpenPortal = () => {
    setShowWalletModal(true);
  };

  const handleWalletConnect = (walletData) => {
    setIsConnecting(true);
    
    // Simula processo di connessione
    setTimeout(() => {
      setConnectedWallet(walletData);
      setIsAuthenticated(true);
      setShowWalletModal(false);
      setIsConnecting(false);
    }, 2000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setConnectedWallet(null);
  };

  const handleCloseModal = () => {
    if (!isConnecting) {
      setShowWalletModal(false);
    }
  };

  // Loading screen durante connessione
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to {connectedWallet?.name || 'Wallet'}</h2>
        <p className="text-gray-600">Please confirm the connection in your wallet...</p>
      </div>
    </div>
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
                <HomepagePerfect onOpenPortal={handleOpenPortal} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <DashboardXRPL 
                  walletData={connectedWallet} 
                  onDisconnect={handleLogout} 
                /> : 
                <Navigate to="/" replace />
            } 
          />
          {/* Redirect per altre route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Wallet Connect Modal */}
        <WalletConnectModal
          isOpen={showWalletModal}
          onClose={handleCloseModal}
          onConnect={handleWalletConnect}
        />

        {/* Loading Screen */}
        {isConnecting && <LoadingScreen />}
      </div>
    </BrowserRouter>
  );
}

export default AppFinal;

