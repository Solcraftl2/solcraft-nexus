import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { HelpIcon, InfoBox } from '../components/ui/tooltip';
import InteractiveGuide, { useInteractiveGuide } from '../components/ui/interactive-guide';

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);

  // Dati simulati
  const userStats = {
    totalBalance: 1250.75,
    totalAssets: 3,
    monthlyReturn: 8.5,
    securityScore: 95
  };

  const recentTransactions = [
    {
      id: 1,
      type: 'receive',
      amount: 100,
      currency: 'XRP',
      description: 'Dividendi da Appartamento Milano',
      date: '2025-06-25',
      status: 'completed'
    },
    {
      id: 2,
      type: 'send',
      amount: 50,
      currency: 'XRP',
      description: 'Acquisto token immobiliare',
      date: '2025-06-24',
      status: 'completed'
    }
  ];

  const myAssets = [
    {
      id: 1,
      name: 'Appartamento Milano',
      type: 'Immobiliare',
      value: 85000,
      tokens: 1000,
      yield: 6.2,
      status: 'active'
    },
    {
      id: 2,
      name: 'Startup TechCorp',
      type: 'Equity',
      value: 15000,
      tokens: 500,
      yield: 12.8,
      status: 'active'
    }
  ];

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
        media: { type: 'icon', icon: '🚀' }
      }
    ]
  };

  const { isGuideOpen, startGuide, closeGuide, completeGuide } = useInteractiveGuide(welcomeGuideSteps);

  const StatCard = ({ icon: Icon, title, value, subtitle, helpText }) => (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="professional-card rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
          <Icon size={24} className="text-slate-700 dark:text-slate-300" />
        </div>
        <HelpIcon content={helpText} title={title} />
      </div>
      <div>
        <p className="text-2xl font-bold professional-text-primary">
          {value}
        </p>
        <p className="text-sm professional-text-secondary mt-1">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );

  const QuickAction = ({ icon: Icon, title, description, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="professional-card rounded-xl p-6 shadow-sm text-left w-full group hover:shadow-md transition-shadow"
    >
      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 w-fit mb-4">
        <Icon size={24} className="text-slate-700 dark:text-slate-300" />
      </div>
      <h3 className="font-semibold professional-text-primary mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
        {title}
      </h3>
      <p className="text-sm professional-text-secondary">
        {description}
      </p>
    </motion.button>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Guide */}
      <InteractiveGuide
        steps={welcomeGuideSteps.steps}
        isOpen={isGuideOpen}
        onClose={closeGuide}
        onComplete={completeGuide}
        title="Benvenuto in SolCraft Nexus"
        autoPlay={false}
      />

      {/* Welcome Banner */}
      {showWelcomeGuide && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="professional-gradient rounded-xl p-6 text-white relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Benvenuto in SolCraft Nexus
                </h2>
                <p className="text-slate-200 mb-4">
                  La piattaforma professionale per tokenizzare i tuoi asset. 
                  Inizia con la nostra guida interattiva.
                </p>
                <div className="flex space-x-3">
                  <Button 
                    onClick={startGuide}
                    className="bg-white text-slate-900 hover:bg-slate-100"
                  >
                    <Sparkles size={16} className="mr-2" />
                    Inizia la Guida
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowWelcomeGuide(false)}
                    className="border-white text-white hover:bg-white/10"
                  >
                    Salta per ora
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        </motion.div>
      )}

      {/* Stats Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold professional-text-primary">
            Panoramica
          </h2>
          <HelpIcon 
            content="Qui vedi un riassunto veloce di tutto il tuo patrimonio digitale: saldo totale, numero di asset, rendimenti e livello di sicurezza."
            title="Panoramica"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Wallet}
            title="Saldo Totale"
            value={showBalance ? `€${userStats.totalBalance.toLocaleString()}` : '••••••'}
            subtitle={
              <div className="flex items-center space-x-2">
                <span>Portafoglio principale</span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            }
            helpText="Il valore totale di tutti i tuoi asset tokenizzati e criptovalute. Include anche i dividendi accumulati."
          />

          <StatCard
            icon={TrendingUp}
            title="Asset Tokenizzati"
            value={userStats.totalAssets}
            subtitle="Asset attivi"
            helpText="Il numero di asset che hai tokenizzato o in cui hai investito. Ogni asset genera rendimenti automatici."
          />

          <StatCard
            icon={Gift}
            title="Rendimento Mensile"
            value={`+${userStats.monthlyReturn}%`}
            subtitle="Ultimo mese"
            helpText="Il rendimento medio dei tuoi investimenti nell'ultimo mese. Calcolato automaticamente dai dividendi ricevuti."
          />

          <StatCard
            icon={Shield}
            title="Sicurezza"
            value={`${userStats.securityScore}%`}
            subtitle="Livello protezione"
            helpText="Il livello di sicurezza del tuo account. Include 2FA, backup del wallet e verifica dell'identità."
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold professional-text-primary">
            Azioni Rapide
          </h2>
          <HelpIcon 
            content="Usa queste azioni per operazioni comuni. Ogni azione è guidata passo-passo per massima semplicità."
            title="Azioni Rapide"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickAction
            icon={ArrowUpRight}
            title="Invia Crypto"
            description="Trasferisci XRP o token in modo sicuro"
            onClick={() => console.log('Send crypto')}
          />

          <QuickAction
            icon={ArrowDownLeft}
            title="Ricevi Crypto"
            description="Genera un indirizzo per ricevere pagamenti"
            onClick={() => console.log('Receive crypto')}
          />

          <QuickAction
            icon={Plus}
            title="Tokenizza Asset"
            description="Trasforma un asset fisico in token digitali"
            onClick={() => console.log('Tokenize asset')}
          />

          <QuickAction
            icon={Users}
            title="Esplora Marketplace"
            description="Investi in asset tokenizzati da altri"
            onClick={() => console.log('Explore marketplace')}
          />
        </div>
      </div>

      {/* My Assets */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold professional-text-primary">
            I Miei Asset
          </h2>
          <div className="flex items-center space-x-3">
            <HelpIcon 
              content="Qui vedi tutti gli asset che possiedi. Clicca su un asset per vedere dettagli, documenti e performance."
              title="I Miei Asset"
            />
            <Button size="sm" className="professional-button">
              <Plus size={16} className="mr-2" />
              Nuovo Asset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myAssets.map((asset) => (
            <motion.div
              key={asset.id}
              whileHover={{ scale: 1.01 }}
              className="professional-card rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold professional-text-primary">
                    {asset.name}
                  </h3>
                  <p className="text-sm professional-text-secondary">
                    {asset.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold professional-text-primary">
                    €{asset.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    +{asset.yield}% annuo
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm professional-text-secondary">
                    {asset.tokens} token posseduti
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  <span className="text-sm professional-text-secondary capitalize">
                    {asset.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold professional-text-primary">
            Transazioni Recenti
          </h2>
          <HelpIcon 
            content="Qui vedi tutte le tue transazioni recenti: invii, ricezioni, dividendi e acquisti di token."
            title="Transazioni Recenti"
          />
        </div>

        <div className="professional-card rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {recentTransactions.map((tx, index) => (
            <div 
              key={tx.id}
              className={`p-4 flex items-center justify-between ${
                index !== recentTransactions.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  tx.type === 'receive' 
                    ? 'bg-slate-100 dark:bg-slate-700' 
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {tx.type === 'receive' ? (
                    <ArrowDownLeft size={20} className="text-slate-600 dark:text-slate-400" />
                  ) : (
                    <ArrowUpRight size={20} className="text-slate-600 dark:text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium professional-text-primary">
                    {tx.description}
                  </p>
                  <p className="text-sm professional-text-secondary">
                    {new Date(tx.date).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  tx.type === 'receive' 
                    ? 'text-slate-700 dark:text-slate-300' 
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.currency}
                </p>
                <p className="text-sm professional-text-secondary capitalize">
                  {tx.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Section */}
      <InfoBox
        title="Informazione"
        type="info"
        className="mt-8"
      >
        <p className="mb-2">
          I tuoi asset tokenizzati generano rendimenti automatici che vengono distribuiti 
          direttamente nel tuo portafoglio ogni mese.
        </p>
        <Button size="sm" variant="outline" className="mt-2 professional-button-outline">
          <BookOpen size={16} className="mr-2" />
          Scopri di più
        </Button>
      </InfoBox>
    </div>
  );
};

export default Dashboard;

