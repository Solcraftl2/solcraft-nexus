import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/theme-provider'
import { Web3Provider, useWeb3 } from './providers/Web3Provider'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import WalletPage from './components/WalletPage'
import AssetsPage from './components/AssetsPage'
import MarketplacePage from './components/MarketplacePage'
import TokenizationPage from './components/TokenizationPage'
import PoolsPage from './components/PoolsPage'
import LoginPage from './components/LoginPage'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isConnecting } = useWeb3()
  
  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connessione in corso...</p>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="solcraft-theme">
      <Web3Provider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Login Route */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Layout>
                    <WalletPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/assets" element={
                <ProtectedRoute>
                  <Layout>
                    <AssetsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/marketplace" element={
                <ProtectedRoute>
                  <Layout>
                    <MarketplacePage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/tokenization" element={
                <ProtectedRoute>
                  <Layout>
                    <TokenizationPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/pools" element={
                <ProtectedRoute>
                  <Layout>
                    <PoolsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Redirect unknown routes to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </Web3Provider>
    </ThemeProvider>
  )
}

export default App

