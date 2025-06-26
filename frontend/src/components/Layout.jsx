import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Bell,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { HelpIcon } from './ui/tooltip';

const Layout = ({ children, currentPage = 'dashboard', user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      description: 'Panoramica generale del tuo portafoglio e delle attività recenti'
    },
    {
      id: 'wallet',
      label: 'Portafoglio',
      icon: Wallet,
      path: '/wallet',
      description: 'Gestisci i tuoi wallet, invia e ricevi criptovalute in modo sicuro'
    },
    {
      id: 'assets',
      label: 'I Miei Asset',
      icon: Coins,
      path: '/assets',
      description: 'Visualizza e gestisci tutti i tuoi asset tokenizzati'
    },
    {
      id: 'tokenize',
      label: 'Tokenizza',
      icon: TrendingUp,
      path: '/tokenize',
      description: 'Trasforma i tuoi asset fisici in token digitali sulla blockchain'
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: Users,
      path: '/marketplace',
      description: 'Esplora e investi in asset tokenizzati di altri utenti'
    },
    {
      id: 'learn',
      label: 'Impara',
      icon: BookOpen,
      path: '/learn',
      description: 'Guide, tutorial e risorse per comprendere la tokenizzazione'
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const getCurrentPage = () => {
    const currentPath = location.pathname;
    const currentItem = navigationItems.find(item => item.path === currentPath);
    return currentItem ? currentItem.id : 'dashboard';
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

  const activePage = getCurrentPage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e titolo */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SC</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">SolCraft Nexus</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tokenizzazione Professionale</p>
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
                  className="relative"
                >
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full text-xs flex items-center justify-center text-white">
                    2
                  </span>
                </Button>
              </div>

              {/* Status sicurezza */}
              <div className="flex items-center space-x-2 text-sm">
                <Shield size={16} className="text-green-500" />
                <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">Sicuro</span>
                <HelpIcon 
                  content="La tua connessione è protetta e tutti i dati sono crittografati"
                  title="Stato Sicurezza"
                />
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">U</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Utente</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email || 'wallet-user@solcraft.com'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-slate-600 hover:text-red-600"
                >
                  <LogOut size={16} />
                </Button>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="md:hidden"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:pt-16">
          <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-4 space-y-2">
                {navigationItems.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={activePage === item.id}
                    onClick={() => handleNavigation(item.path)}
                  />
                ))}
              </nav>
            </div>

            {/* Help section */}
            <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <HelpCircle size={16} />
                <span>Serve aiuto?</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Accedi alle guide interattive e al supporto 24/7
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => handleNavigation('/learn')}
              >
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
              className="fixed inset-0 z-50 md:hidden"
            >
              <div className="fixed inset-0 bg-slate-600 bg-opacity-75" onClick={toggleMobileMenu} />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="relative flex flex-col w-64 h-full bg-white dark:bg-slate-800 shadow-xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Menu</h2>
                  <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                    <X size={20} />
                  </Button>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-2">
                  {navigationItems.map((item) => (
                    <NavItem
                      key={item.id}
                      item={item}
                      isActive={activePage === item.id}
                      onClick={() => handleNavigation(item.path)}
                    />
                  ))}
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 md:pl-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

