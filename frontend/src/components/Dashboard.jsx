import { logger } from '../../../netlify/functions/utils/logger.js';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authService';

const Dashboard = ({ user }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Error during logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Benvenuto nella tua piattaforma di tokenizzazione</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors shadow-md"
          >
            Logout
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center">
              {user.avatar_url && (
                <img 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full mr-4"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{user.display_name}</h2>
                <div className="text-sm text-gray-600">
                  {user.auth_method === 'wallet' && (
                    <p>Wallet: {user.wallet_address?.substring(0, 8)}...{user.wallet_address?.substring(-6)}</p>
                  )}
                  {user.auth_method === 'social' && (
                    <p>Email: {user.email}</p>
                  )}
                  <p>Metodo: {user.auth_method === 'wallet' ? 'Wallet' : 'Social Login'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Portfolio */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Portfolio</h3>
              <div className="text-2xl">💼</div>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">€0.00</div>
            <p className="text-gray-600 text-sm">Valore totale asset</p>
          </div>

          {/* Asset Tokenizzati */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Asset Tokenizzati</h3>
              <div className="text-2xl">🏠</div>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-2">0</div>
            <p className="text-gray-600 text-sm">Immobili tokenizzati</p>
          </div>

          {/* Transazioni */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Transazioni</h3>
              <div className="text-2xl">📊</div>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-2">0</div>
            <p className="text-gray-600 text-sm">Transazioni totali</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Azioni Rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors">
              <div className="text-2xl mb-2">🏠</div>
              <div className="text-sm font-medium">Tokenizza Asset</div>
            </button>
            
            <button className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium">Invia XRP</div>
            </button>
            
            <button className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-colors">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-sm font-medium">Marketplace</div>
            </button>
            
            <button className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg transition-colors">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm font-medium">Impara</div>
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <span className="text-green-500 text-xl mr-2">✅</span>
            <div>
              <span className="font-semibold text-green-700">Sistema Web3 Operativo</span>
              <p className="text-gray-600 text-sm">Autenticazione wallet e social login funzionanti</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

