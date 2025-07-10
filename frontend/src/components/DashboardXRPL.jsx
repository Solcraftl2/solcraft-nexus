import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const DashboardXRPL = ({ walletData, onDisconnect }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Carica i dati del dashboard
  useEffect(() => {
    if (walletData?.address) {
      loadDashboardData();
    }
  }, [walletData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carica dati in parallelo
      const [
        balanceData,
        transactionData,
        tokenData,
        portfolioData
      ] = await Promise.allSettled([
        apiService.getWalletBalance(walletData.address),
        apiService.getTransactionHistory(walletData.address, 10),
        apiService.getTokens(walletData.address),
        apiService.getPortfolioSummary()
      ]);

      // Processa i risultati
      const balance = balanceData.status === 'fulfilled' ? balanceData.value : { balance: walletData.balance || '0' };
      const txHistory = transactionData.status === 'fulfilled' ? transactionData.value : { transactions: [] };
      const tokenList = tokenData.status === 'fulfilled' ? tokenData.value : { tokens: [] };
      const portfolio = portfolioData.status === 'fulfilled' ? portfolioData.value : null;

      setDashboardData({
        balance: balance.balance,
        portfolio: portfolio || {
          totalValue: balance.balance,
          change24h: '+2.5%',
          assets: 1
        }
      });

      setTransactions(txHistory.transactions || []);
      setTokens(tokenList.tokens || []);

    } catch (err) {
      console.error('Errore caricamento dashboard:', err);
      setError('Errore nel caricamento dei dati');
      
      // Fallback con dati demo se il backend non è disponibile
      setDashboardData({
        balance: walletData.balance || '0',
        portfolio: {
          totalValue: walletData.balance || '0',
          change24h: '+2.5%',
          assets: 1
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleSendXRP = async () => {
    const toAddress = prompt('Inserisci l\'indirizzo destinatario:');
    const amount = prompt('Inserisci l\'importo XRP:');
    
    if (toAddress && amount) {
      try {
        const result = await apiService.sendXRP(
          walletData.address,
          toAddress,
          amount,
          walletData.seed
        );
        
        alert(`Transazione inviata! Hash: ${result.txHash}`);
        handleRefresh();
      } catch (err) {
        alert(`Errore: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SolCraft Nexus</h1>
                <p className="text-gray-300 text-sm">Dashboard XRPL</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
              </button>
              <button
                onClick={onDisconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Disconnetti
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Wallet Info */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Wallet Connesso</h2>
            <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
              {walletData.walletType || 'Connesso'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-300 text-sm">Indirizzo</p>
              <p className="text-white font-mono text-sm break-all">{walletData.address}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Bilancio XRP</p>
              <p className="text-white text-2xl font-bold">{dashboardData?.balance || '0'} XRP</p>
            </div>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Valore Totale</h3>
            <p className="text-3xl font-bold text-white">${dashboardData?.portfolio?.totalValue || '0'}</p>
            <p className="text-green-400 text-sm mt-1">{dashboardData?.portfolio?.change24h || '+0%'} (24h)</p>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Asset Tokenizzati</h3>
            <p className="text-3xl font-bold text-white">{dashboardData?.portfolio?.assets || 0}</p>
            <p className="text-gray-300 text-sm mt-1">Asset attivi</p>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Token XRPL</h3>
            <p className="text-3xl font-bold text-white">{tokens.length}</p>
            <p className="text-gray-300 text-sm mt-1">Token posseduti</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Azioni Rapide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleSendXRP}
              className="p-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-colors"
            >
              <div className="text-2xl mb-2">💸</div>
              <div className="font-semibold">Invia XRP</div>
            </button>
            
            <button className="p-4 bg-green-600 hover:bg-green-700 rounded-xl text-white transition-colors">
              <div className="text-2xl mb-2">📥</div>
              <div className="font-semibold">Ricevi</div>
            </button>
            
            <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-white transition-colors">
              <div className="text-2xl mb-2">🏷️</div>
              <div className="font-semibold">Tokenizza</div>
            </button>
            
            <button className="p-4 bg-orange-600 hover:bg-orange-700 rounded-xl text-white transition-colors">
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-semibold">Marketplace</div>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Transazioni Recenti</h3>
          
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'sent' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                    }`}>
                      {tx.type === 'sent' ? '↗' : '↙'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.type === 'sent' ? 'Inviato' : 'Ricevuto'}</p>
                      <p className="text-gray-300 text-sm">{tx.date || 'Oggi'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'sent' ? 'text-red-300' : 'text-green-300'}`}>
                      {tx.type === 'sent' ? '-' : '+'}{tx.amount || '0'} XRP
                    </p>
                    <p className="text-gray-300 text-sm">{tx.status || 'Confermato'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-300">Nessuna transazione recente</p>
              <p className="text-gray-400 text-sm mt-1">Le tue transazioni appariranno qui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardXRPL;

