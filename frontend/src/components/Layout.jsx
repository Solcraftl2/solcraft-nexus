import React, { useState } from 'react';
import { 
  Home, 
  Wallet, 
  Coins, 
  TrendingUp, 
  Settings, 
  HelpCircle, 
  Menu, 
  X,
  Shield,
  Users,
  BookOpen,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { HelpIcon } from './ui/tooltip';

const Layout = ({ children, currentPage = 'dashboard' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Panoramica generale del tuo portafoglio e delle attività recenti'
    },
    {
      id: 'wallet',
      label: 'Portafoglio',
      icon: Wallet,
      description: 'Gestisci i tuoi wallet, invia e ricevi criptovalute in modo sicuro'
    },
    {
      id: 'assets',
      label: 'I Miei Asset',
      icon: Coins,
      description: 'Visualizza e gestisci tutti i tuoi asset tokenizzati'
    },
    {
      id: 'tokenize',
      label: 'Tokenizza',
      icon: TrendingUp,
      description: 'Trasforma i tuoi asset fisici in token digitali sulla blockchain'
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: Users,
      description: 'Esplora e investi in asset tokenizzati di altri utenti'
    },
    {
      id: 'learn',
      label: 'Impara',
      icon: BookOpen,
      description: 'Guide, tutorial e risorse per comprendere la tokenizzazione'
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const NavItem = ({ item, isActive, onClick }) => {
    const Icon = item.icon;
    
    return (
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive 
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <Icon size={20} className="text-current" />
        <span className="font-medium">{item.label}</span>
        <HelpIcon 
          content={item.description}
          title={item.label}
          size={16}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"
        />
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e titolo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 professional-gradient rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SC</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    SolCraft Nexus
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                    Tokenizzazione Professionale
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifiche */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-slate-900 dark:bg-slate-100 rounded-full text-xs text-white dark:text-slate-900 flex items-center justify-center">
                    2
                  </span>
                </Button>
                
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4"
                  >
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                      Notifiche
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          Il tuo asset "Appartamento Milano" è stato tokenizzato con successo
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          Hai ricevuto 50 XRP nel tuo portafoglio
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sicurezza */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                <Shield size={16} className="text-slate-600 dark:text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  Sicuro
                </span>
                <HelpIcon 
                  content="La tua connessione è protetta con crittografia end-to-end e tutti i dati sono al sicuro"
                  title="Sicurezza"
                />
              </div>

              {/* Profilo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 professional-gradient rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">U</span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Utente
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={currentPage === item.id}
                onClick={() => console.log(`Navigate to ${item.id}`)}
              />
            ))}
          </nav>

          {/* Help Section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-8">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <HelpCircle size={20} className="text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Serve aiuto?
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Accedi alle guide interattive e al supporto 24/7
              </p>
              <Button size="sm" className="w-full professional-button">
                Apri Guida
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={toggleMobileMenu}
            >
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="w-64 bg-white dark:bg-slate-800 h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 professional-gradient rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">SC</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      SolCraft Nexus
                    </span>
                  </div>
                </div>
                
                <nav className="p-4 space-y-2">
                  {navigationItems.map((item) => (
                    <NavItem
                      key={item.id}
                      item={item}
                      isActive={currentPage === item.id}
                      onClick={() => {
                        console.log(`Navigate to ${item.id}`);
                        setIsMobileMenuOpen(false);
                      }}
                    />
                  ))}
                </nav>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

