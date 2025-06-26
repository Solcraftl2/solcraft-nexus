import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  EyeOff,
  Sparkles,
  Gift,
  Users,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { HelpIcon, InfoBox } from '../components/ui/tooltip';
import InteractiveGuide, { useInteractiveGuide } from '../components/ui/interactive-guide';

const Dashboard = ({ user }) => {
  const [showBalance, setShowBalance] = useState(true);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);
  const [userStats, setUserStats] = useState({
    totalBalance: 0,
    totalAssets: 0,
    monthlyReturn: 0,
    securityScore: 95
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica i dati dell'utente
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        
        // Carica statistiche portfolio
        const statsResponse = await fetch('/api/portfolio/balance', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setUserStats(stats);
        }

        // Carica transazioni recenti
        const transactionsResponse = await fetch('/api/portfolio/transactions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (transactionsResponse.ok) {
          const transactions = await transactionsResponse.json();
          setRecentTransactions(transactions.slice(0, 5)); // Ultime 5
        }

        // Carica asset dell'utente
        const assetsResponse = await fetch('/api/portfolio/assets', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (assetsResponse.ok) {
          const assets = await assetsResponse.json();
          setMyAssets(assets);
        }

      } catch (error) {
        console.error('Errore caricamento dati:', error);
        setError('Errore nel caricamento dei dati. Riprova più tardi.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  // Guide interattive
  const welcomeGuideSteps = {
    id: 'welcome_guide',
    steps: [
      {
        title: 'Benvenuto in SolCraft Nexus',
        description: 'Questa è la tua dashboard personale dove puoi vedere tutto in un colpo d\'occhio. Qui trovi il saldo del tuo portafoglio, i tuoi asset tokenizzati e le transazioni recenti.',
        tips: 'Ogni sezione ha un\'icona ? che ti spiega nel dettaglio cosa fa. Non esitare a cliccarci!',
        media: { type: 'icon', icon: '🏠' }
      },
      {
        title: 'Il Tuo Portafoglio',
        description: 'Qui vedi il valore totale dei tuoi asset. Puoi nascondere il saldo per privacy cliccando sull\'icona dell\'occhio. Il portafoglio è protetto con crittografia militare.',
        tips: 'Il saldo viene aggiornato in tempo reale quando ricevi dividendi o fai transazioni.',
        media: { type: 'icon', icon: '👁️' }
      },
      {
        title: 'I Tuoi Asset Tokenizzati',
        description: 'Qui vedi tutti gli asset che hai tokenizzato o in cui hai investito. Ogni asset genera rendimenti automatici che vengono distribuiti nel tuo portafoglio.',
        tips: 'Clicca su un asset per vedere tutti i dettagli, la documentazione e la performance storica.',
        media: { type: 'icon', icon: '📊' }
      },
      {
        title: 'Azioni Rapide',
        description: 'Usa i pulsanti di azione rapida per inviare/ricevere crypto o tokenizzare un nuovo asset. Tutto è guidato passo-passo.',
        tips: 'Se è la tua prima volta, ti consigliamo di iniziare con la guida "Come tokenizzare il mio primo asset".',
        media: { type: 'icon', icon: '⚡' }
      }
    ]
  };

  const { 
    currentStep, 
    isGuideActive, 
    startGuide, 
    nextStep, 
    prevStep, 
    endGuide 
  } = useInteractiveGuide(welcomeGuideSteps);

  // Stato vuoto per nuovi utenti
  const EmptyState = ({ icon, title, description, actionText, onAction }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {actionText && (
        <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700">
          {actionText}
        </Button>
      )}
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Benvenuto */}
      {showWelcomeGuide && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white relative overflow-hidden"
        >
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">
              Benvenuto in SolCraft Nexus, {user?.firstName || 'Utente'}! 👋
            </h1>
            <p className="text-blue-100 mb-4">
              La piattaforma professionale per tokenizzare i tuoi asset. Inizia con la nostra guida interattiva.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={startGuide}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Inizia la Guida
              </Button>
              <Button 
                onClick={() => setShowWelcomeGuide(false)}
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                Salta per ora
              </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        </motion.div>
      )}

      {/* Statistiche Panoramica */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Portafoglio principale</span>
            </div>
            <HelpIcon content="Il valore totale di tutti i tuoi asset tokenizzati e crypto holdings" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {showBalance ? `€${userStats.totalBalance.toLocaleString()}` : '••••••'}
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Asset attivi</span>
            </div>
            <HelpIcon content="Numero di asset che hai tokenizzato o in cui hai investito" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{userStats.totalAssets}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Ultimo mese</span>
            </div>
            <HelpIcon content="Rendimento percentuale del tuo portfolio nell'ultimo mese" />
          </div>
          <span className="text-2xl font-bold text-green-600">
            +{userStats.monthlyReturn}%
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Livello protezione</span>
            </div>
            <HelpIcon content="Punteggio di sicurezza basato su autenticazione, backup e compliance" />
          </div>
          <span className="text-2xl font-bold text-blue-600">{userStats.securityScore}%</span>
        </motion.div>
      </div>

      {/* Azioni Rapide */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Azioni Rapide</h2>
          <HelpIcon content="Accesso rapido alle funzioni più utilizzate della piattaforma" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-left transition-colors"
          >
            <ArrowUpRight className="h-6 w-6 text-red-600 mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Invia Crypto</h3>
            <p className="text-sm text-gray-600">Trasferisci XRP o token in modo sicuro</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left transition-colors"
          >
            <ArrowDownLeft className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Ricevi Crypto</h3>
            <p className="text-sm text-gray-600">Genera un indirizzo per ricevere pagamenti</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left transition-colors"
          >
            <Plus className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Tokenizza Asset</h3>
            <p className="text-sm text-gray-600">Trasforma un asset fisico in token digitali</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-left transition-colors"
          >
            <Users className="h-6 w-6 text-yellow-600 mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Esplora Marketplace</h3>
            <p className="text-sm text-gray-600">Investi in asset tokenizzati da altri</p>
          </motion.button>
        </div>
      </div>

      {/* I Miei Asset */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">I Miei Asset</h2>
            <HelpIcon content="Tutti gli asset che hai tokenizzato o in cui hai investito" />
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Asset
          </Button>
        </div>

        {myAssets.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <EmptyState
              icon="🏠"
              title="Nessun Asset Tokenizzato"
              description="Inizia a tokenizzare i tuoi asset fisici per trasformarli in investimenti digitali che generano rendimenti automatici."
              actionText="Tokenizza il Primo Asset"
              onAction={() => console.log('Redirect to tokenization')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                    <span className="text-sm text-gray-600">{asset.type}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    asset.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {asset.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valore</span>
                    <span className="font-medium">€{asset.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rendimento annuo</span>
                    <span className="font-medium text-green-600">+{asset.yield}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Token posseduti</span>
                    <span className="font-medium">{asset.tokens}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Transazioni Recenti */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transazioni Recenti</h2>
          <HelpIcon content="Le tue ultime transazioni e movimenti di portfolio" />
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <EmptyState
              icon="📊"
              title="Nessuna Transazione"
              description="Le tue transazioni e movimenti di portfolio appariranno qui. Inizia facendo la tua prima operazione."
              actionText="Esplora Marketplace"
              onAction={() => console.log('Redirect to marketplace')}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'receive' ? 
                          <ArrowDownLeft className="h-4 w-4 text-green-600" /> :
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'receive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'receive' ? '+' : '-'}{transaction.amount} {transaction.currency}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Guida Interattiva */}
      <InteractiveGuide
        isActive={isGuideActive}
        currentStep={currentStep}
        onNext={nextStep}
        onPrev={prevStep}
        onEnd={endGuide}
      />

      {/* Info Box */}
      <InfoBox className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">💡 Suggerimento</h3>
            <p className="text-sm text-blue-800">
              I tuoi asset tokenizzati generano rendimenti automatici che vengono distribuiti 
              direttamente nel tuo portafoglio ogni mese.
            </p>
          </div>
        </div>
      </InfoBox>
    </div>
  );
};

export default Dashboard;

