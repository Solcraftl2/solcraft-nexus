import React, { useState, useEffect } from 'react';
import xrplService from '../services/xrplService';

/**
 * XRPLWallet - Componente per gestione wallet XRPL
 * Gestisce connessione, bilancio, transazioni e funzionalità avanzate
 */
const XRPLWallet = ({ onWalletChange, initialNetwork = 'testnet' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [network, setNetwork] = useState(initialNetwork);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);

  // Connessione automatica all'avvio
  useEffect(() => {
    connectToXRPL();
    return () => {
      xrplService.disconnect();
    };
  }, [network]);

  // Aggiorna bilancio ogni 30 secondi
  useEffect(() => {
    if (currentWallet && isConnected) {
      const interval = setInterval(() => {
        updateBalance();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentWallet, isConnected]);

  /**
   * Connessione a XRPL
   */
  const connectToXRPL = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await xrplService.connect(network);
      setIsConnected(true);
      setNetworkInfo(result);
      
      console.log('✅ Connesso a XRPL:', result);
    } catch (error) {
      setError(`Connessione fallita: ${error.message}`);
      console.error('❌ Errore connessione:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Genera nuovo wallet
   */
  const generateNewWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletData = xrplService.generateWallet();
      
      // Su testnet, finanzia automaticamente
      if (network === 'testnet') {
        const fundResult = await xrplService.fundTestnetAccount();
        setCurrentWallet({
          ...fundResult.wallet,
          balance: fundResult.balance
        });
        setBalance(parseFloat(fundResult.balance));
      } else {
        setCurrentWallet(walletData);
        setBalance(0);
      }
      
      if (onWalletChange) {
        onWalletChange(currentWallet);
      }
      
      await loadTransactionHistory();
    } catch (error) {
      setError(`Errore generazione wallet: ${error.message}`);
      console.error('❌ Errore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Importa wallet esistente
   */
  const importWallet = async (seed) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletData = xrplService.importWallet(seed);
      setCurrentWallet({ ...walletData, seed });
      
      await updateBalance();
      await loadTransactionHistory();
      
      if (onWalletChange) {
        onWalletChange(currentWallet);
      }
    } catch (error) {
      setError(`Errore import wallet: ${error.message}`);
      console.error('❌ Errore:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Aggiorna bilancio
   */
  const updateBalance = async () => {
    if (!currentWallet?.address) return;
    
    try {
      const newBalance = await xrplService.getBalance(currentWallet.address);
      setBalance(newBalance);
    } catch (error) {
      console.error('❌ Errore aggiornamento bilancio:', error);
    }
  };

  /**
   * Carica storico transazioni
   */
  const loadTransactionHistory = async () => {
    if (!currentWallet?.address) return;
    
    try {
      const history = await xrplService.getTransactionHistory(currentWallet.address, 10);
      setTransactions(history);
    } catch (error) {
      console.error('❌ Errore caricamento transazioni:', error);
    }
  };

  /**
   * Invia pagamento XRP
   */
  const sendPayment = async (toAddress, amount, memo = '') => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!currentWallet) {
        throw new Error('Nessun wallet connesso');
      }
      
      if (!xrplService.isValidAddress(toAddress)) {
        throw new Error('Indirizzo destinazione non valido');
      }
      
      if (amount <= 0 || amount > balance) {
        throw new Error('Importo non valido');
      }
      
      const result = await xrplService.sendXRP(
        currentWallet, 
        toAddress, 
        amount, 
        memo || null
      );
      
      if (result.success) {
        await updateBalance();
        await loadTransactionHistory();
        return result;
      } else {
        throw new Error(`Transazione fallita: ${result.result}`);
      }
    } catch (error) {
      setError(`Errore invio pagamento: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cambia network
   */
  const switchNetwork = async (newNetwork) => {
    try {
      setIsLoading(true);
      await xrplService.disconnect();
      setNetwork(newNetwork);
      setIsConnected(false);
      setCurrentWallet(null);
      setBalance(0);
      setTransactions([]);
    } catch (error) {
      setError(`Errore cambio network: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disconnetti wallet
   */
  const disconnectWallet = async () => {
    try {
      await xrplService.disconnect();
      setIsConnected(false);
      setCurrentWallet(null);
      setBalance(0);
      setTransactions([]);
      setNetworkInfo(null);
      
      if (onWalletChange) {
        onWalletChange(null);
      }
    } catch (error) {
      console.error('❌ Errore disconnessione:', error);
    }
  };

  /**
   * Formatta indirizzo per display
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Formatta data transazione
   */
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="xrpl-wallet bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">XRPL Wallet</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? `Connected to ${network}` : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Network Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
        <select
          value={network}
          onChange={(e) => switchNetwork(e.target.value)}
          disabled={isLoading}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="testnet">Testnet (Development)</option>
          <option value="mainnet">Mainnet (Production)</option>
        </select>
      </div>

      {/* Wallet Actions */}
      {!currentWallet ? (
        <div className="space-y-4">
          <button
            onClick={generateNewWallet}
            disabled={!isConnected || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate New Wallet'}
          </button>
          
          <div className="text-center text-gray-500">or</div>
          
          <div>
            <input
              type="password"
              placeholder="Enter wallet seed to import"
              className="w-full p-3 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  importWallet(e.target.value.trim());
                  e.target.value = '';
                }
              }}
            />
            <p className="text-xs text-gray-500">Press Enter to import wallet from seed</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Wallet Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Address</span>
              <button
                onClick={() => navigator.clipboard.writeText(currentWallet.address)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Copy
              </button>
            </div>
            <div className="font-mono text-sm text-gray-900 break-all">
              {currentWallet.address}
            </div>
          </div>

          {/* Balance */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {balance.toFixed(6)} XRP
            </div>
            <div className="text-sm text-gray-500">
              ≈ ${(balance * 0.5).toFixed(2)} USD
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={updateBalance}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={disconnectWallet}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No transactions found
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transactions.slice(0, 5).map((tx, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {tx.tx.TransactionType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(tx.tx.date)}
                      </span>
                    </div>
                    {tx.tx.Amount && (
                      <div className="text-sm text-gray-600 mt-1">
                        {typeof tx.tx.Amount === 'string' 
                          ? `${xrplService.dropsToXrp(tx.tx.Amount)} XRP`
                          : `${tx.tx.Amount.value} ${tx.tx.Amount.currency}`
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Processing...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XRPLWallet;

