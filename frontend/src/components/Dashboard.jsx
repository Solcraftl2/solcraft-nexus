import React, { useState, useEffect } from 'react';
import { HelpIcon } from './ui/tooltip';
import { InteractiveGuide } from './ui/interactive-guide';
import apiService from '../services/apiService.js';
import authService from '../services/authService.js';
import walletService from '../services/walletService.js';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (authService.isLoggedIn()) {
        // Carica dati reali se autenticato
        const [dashData, portfolioData, transactionData, assetData] = await Promise.all([
          apiService.getDashboardData().catch(() => null),
          apiService.getPortfolio().catch(() => null),
          apiService.getTransactionHistory(1, 5).catch(() => ({ transactions: [] })),
          apiService.getUserAssets().catch(() => ({ assets: [] }))
        ]);

        setDashboardData(dashData);
        setPortfolio(portfolioData);
        setTransactions(transactionData.transactions || []);
        setAssets(assetData.assets || []);
      } else {
        // Dati demo se non autenticato
        setDashboardData({
          totalValue: 0,
          totalAssets: 0,
          securityLevel: 0,
          monthlyGrowth: 0
        });
        setPortfolio({ total_value: 0, assets: [] });
        setTransactions([]);
        setAssets([]);
      }
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCrypto = async () => {
    if (!authService.isLoggedIn()) {
      alert('Devi effettuare il login per inviare crypto');
      return;
    }

    if (!walletService.isConnected()) {
      alert('Devi connettere un wallet per inviare crypto');
      return;
    }

    // Implementa modal per invio crypto
    const recipient = prompt('Inserisci l\'indirizzo del destinatario:');
    const amount = prompt('Inserisci l\'importo da inviare:');
    
    if (recipient && amount) {
      try {
        const result = await walletService.sendTransaction(recipient, parseFloat(amount));
        if (result.success) {
          alert('Transazione inviata con successo!');
          loadDashboardData(); // Ricarica i dati
        } else {
          alert('Errore nell\'invio: ' + result.message);
        }
      } catch (error) {
        alert('Errore nell\'invio della transazione');
      }
    }
  };

  const handleReceiveCrypto = async () => {
    if (!authService.isLoggedIn()) {
      alert('Devi effettuare il login per ricevere crypto');
      return;
    }

    if (!walletService.isConnected()) {
      alert('Devi connettere un wallet per ricevere crypto');
      return;
    }

    const address = walletService.getReceiveAddress();
    if (address) {
      // Copia indirizzo negli appunti
      navigator.clipboard.writeText(address);
      alert(`Indirizzo copiato negli appunti: ${address}`);
    }
  };

  const handleTokenizeAsset = () => {
    if (!authService.isLoggedIn()) {
      alert('Devi effettuare il login per tokenizzare asset');
      return;
    }

    // Implementa modal per tokenizzazione
    alert('Funzionalità di tokenizzazione in sviluppo');
  };

  const guideSteps = [
    {
      target: '.portfolio-card',
      title: 'Il Tuo Portfolio',
      content: 'Qui puoi vedere il valore totale dei tuoi asset tokenizzati e la loro performance.'
    },
    {
      target: '.actions-section',
      title: 'Azioni Rapide',
      content: 'Usa questi pulsanti per inviare/ricevere crypto e tokenizzare nuovi asset.'
    },
    {
      target: '.assets-section',
      title: 'I Tuoi Asset',
      content: 'Visualizza e gestisci tutti i tuoi asset tokenizzati da questa sezione.'
    },
    {
      target: '.transactions-section',
      title: 'Transazioni Recenti',
      content: 'Monitora tutte le tue transazioni e attività recenti.'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const isAuthenticated = authService.isLoggedIn();
  const isWalletConnected = walletService.isConnected();

  return (
    <div className="space-y-8">
      {/* Header con guide */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {isAuthenticated 
              ? 'Benvenuto nella tua piattaforma di tokenizzazione'
              : 'Accedi per iniziare a tokenizzare i tuoi asset'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowGuide(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Inizia la Guida
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="portfolio-card bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valore Portfolio</p>
              <p className="text-2xl font-bold text-gray-900">
                €{portfolio?.total_value?.toLocaleString() || '0,00'}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">💰</span>
            </div>
          </div>
          <HelpIcon 
            content="Il valore totale di tutti i tuoi asset tokenizzati"
            className="mt-2"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Asset Attivi</p>
              <p className="text-2xl font-bold text-gray-900">
                {assets.length}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">🏗️</span>
            </div>
          </div>
          <HelpIcon 
            content="Numero di asset che hai tokenizzato sulla piattaforma"
            className="mt-2"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Livello Protezione</p>
              <p className="text-2xl font-bold text-gray-900">
                {isAuthenticated && isWalletConnected ? '95%' : '0%'}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">🛡️</span>
            </div>
          </div>
          <HelpIcon 
            content="Livello di sicurezza del tuo account basato su autenticazione e wallet"
            className="mt-2"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Crescita Mensile</p>
              <p className="text-2xl font-bold text-gray-900">
                +{dashboardData?.monthlyGrowth || 0}%
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">📈</span>
            </div>
          </div>
          <HelpIcon 
            content="Crescita percentuale del valore del tuo portfolio nell'ultimo mese"
            className="mt-2"
          />
        </div>
      </div>

      {/* Azioni Rapide */}
      <div className="actions-section bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Azioni Rapide</h2>
          <HelpIcon 
            content="Esegui rapidamente le operazioni più comuni"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleSendCrypto}
            disabled={!isAuthenticated || !isWalletConnected}
            className="flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">💸</span>
            <div className="text-left">
              <div className="font-medium text-gray-900">Invia Crypto</div>
              <div className="text-sm text-gray-500">Trasferisci fondi</div>
            </div>
          </button>

          <button
            onClick={handleReceiveCrypto}
            disabled={!isAuthenticated || !isWalletConnected}
            className="flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">💰</span>
            <div className="text-left">
              <div className="font-medium text-gray-900">Ricevi Crypto</div>
              <div className="text-sm text-gray-500">Ottieni indirizzo</div>
            </div>
          </button>

          <button
            onClick={handleTokenizeAsset}
            disabled={!isAuthenticated}
            className="flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl">🏗️</span>
            <div className="text-left">
              <div className="font-medium text-gray-900">Tokenizza Asset</div>
              <div className="text-sm text-gray-500">Crea nuovo token</div>
            </div>
          </button>
        </div>

        {(!isAuthenticated || !isWalletConnected) && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            {!isAuthenticated && 'Effettua il login per abilitare le funzionalità. '}
            {isAuthenticated && !isWalletConnected && 'Connetti un wallet per abilitare le transazioni crypto.'}
          </div>
        )}
      </div>

      {/* I Miei Asset */}
      <div className="assets-section bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">I Miei Asset</h2>
          <HelpIcon 
            content="Tutti gli asset che hai tokenizzato sulla piattaforma"
          />
        </div>
        
        {assets.length > 0 ? (
          <div className="space-y-4">
            {assets.map((asset, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">{asset.icon || '🏢'}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{asset.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">€{asset.value?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{asset.tokens} token</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl">🏗️</span>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun asset tokenizzato</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAuthenticated 
                ? 'Inizia tokenizzando il tuo primo asset'
                : 'Accedi per iniziare a tokenizzare asset'
              }
            </p>
            {isAuthenticated && (
              <button
                onClick={handleTokenizeAsset}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Tokenizza Primo Asset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transazioni Recenti */}
      <div className="transactions-section bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transazioni Recenti</h2>
          <HelpIcon 
            content="Le tue ultime transazioni e attività sulla piattaforma"
          />
        </div>
        
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">{tx.type === 'send' ? '↗️' : '↙️'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === 'send' ? '-' : '+'}€{tx.amount}
                  </p>
                  <p className="text-sm text-gray-500">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl">💸</span>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna transazione</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAuthenticated 
                ? 'Le tue transazioni appariranno qui'
                : 'Accedi per vedere le tue transazioni'
              }
            </p>
          </div>
        )}
      </div>

      {/* Guida Interattiva */}
      <InteractiveGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        steps={guideSteps}
        title="Guida alla Dashboard"
      />
    </div>
  );
};

export default Dashboard;

