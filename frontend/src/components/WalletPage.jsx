import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Send, 
  Download, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { HelpIcon } from './ui/tooltip';

const WalletPage = ({ user }) => {
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('main');

  // Dati wallet simulati (da sostituire con dati reali da Supabase)
  const walletData = {
    main: {
      name: 'Portafoglio Principale',
      address: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      balance: {
        xrp: 1250.75,
        eur: 1250.75,
        usd: 1375.82
      },
      tokens: [
        { symbol: 'XRP', amount: 1250.75, value: 1250.75, change: 8.5 },
        { symbol: 'SOLO', amount: 500, value: 125.50, change: -2.3 },
        { symbol: 'CORE', amount: 1000, value: 89.20, change: 15.7 }
      ]
    }
  };

  const recentTransactions = [
    {
      id: 1,
      type: 'received',
      amount: 100,
      currency: 'XRP',
      from: 'rKBjNhXZCPWZqXpSSET3CC1WdRqZQwex',
      date: '2025-06-26T10:30:00Z',
      status: 'completed',
      hash: '1A2B3C4D5E6F7890ABCDEF1234567890'
    },
    {
      id: 2,
      type: 'sent',
      amount: 50,
      currency: 'XRP',
      to: 'rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w',
      date: '2025-06-25T15:45:00Z',
      status: 'completed',
      hash: '9876543210FEDCBA0987654321ABCDEF'
    },
    {
      id: 3,
      type: 'received',
      amount: 25.5,
      currency: 'SOLO',
      from: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
      date: '2025-06-24T09:15:00Z',
      status: 'completed',
      hash: 'ABCDEF1234567890FEDCBA0987654321'
    }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simula chiamata API per aggiornare i dati
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    // Qui potresti aggiungere una notifica di successo
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentWallet = walletData[selectedWallet];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Portafoglio
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestisci i tuoi wallet e le transazioni
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Aggiorna</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Plus size={16} />
            <span>Nuovo Wallet</span>
          </Button>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Wallet size={24} />
            <div>
              <h3 className="font-semibold">{currentWallet.name}</h3>
              <p className="text-blue-100 text-sm">XRPL Mainnet</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="text-white hover:bg-white/20"
          >
            {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {showBalance ? `€${currentWallet.balance.eur.toLocaleString()}` : '••••••'}
          </div>
          <div className="text-blue-100">
            {showBalance ? `${currentWallet.balance.xrp.toLocaleString()} XRP` : '••••••'}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-blue-100">Indirizzo:</span>
            <code className="bg-white/20 px-2 py-1 rounded text-xs">
              {currentWallet.address.slice(0, 8)}...{currentWallet.address.slice(-6)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyAddress(currentWallet.address)}
              className="text-white hover:bg-white/20 p-1"
            >
              <Copy size={14} />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp size={16} className="text-green-300" />
            <span className="text-green-300 font-medium">+8.5%</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ArrowDownLeft size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Ricevi</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Genera indirizzo per ricevere</p>
            </div>
          </div>
          <Button className="w-full">
            Genera Indirizzo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <ArrowUpRight size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Invia</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Trasferisci XRP o token</p>
            </div>
          </div>
          <Button className="w-full">
            Invia Crypto
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ExternalLink size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Explorer</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Visualizza su XRPL</p>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Apri Explorer
          </Button>
        </motion.div>
      </div>

      {/* Token Holdings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            I Tuoi Token
          </h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {currentWallet.tokens.map((token, index) => (
            <div key={index} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{token.symbol}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {token.amount.toLocaleString()} {token.symbol}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  €{token.value.toLocaleString()}
                </div>
                <div className={`text-sm flex items-center space-x-1 ${
                  token.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {token.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{token.change >= 0 ? '+' : ''}{token.change}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Transazioni Recenti
            </h3>
            <Button variant="ghost" size="sm">
              Vedi Tutte
            </Button>
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'received' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {tx.type === 'received' ? (
                    <ArrowDownLeft size={20} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpRight size={20} className="text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {tx.type === 'received' ? 'Ricevuto' : 'Inviato'}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(tx.date)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  tx.type === 'received' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.type === 'received' ? '+' : '-'}{tx.amount} {tx.currency}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Completata
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default WalletPage;

