import React, { useState } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Eye,
  MoreHorizontal,
  Building,
  Briefcase,
  Zap,
  Filter,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

const AssetsPage = ({ user }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dati asset simulati (da sostituire con dati reali da Supabase)
  const assets = [
    {
      id: 1,
      name: 'Appartamento Milano',
      type: 'Immobiliare',
      category: 'real_estate',
      value: 85000,
      tokens: 1000,
      ownedTokens: 1000,
      performance: 6.2,
      monthlyYield: 425,
      status: 'active',
      location: 'Milano, Italia',
      icon: Building,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      name: 'Startup TechCorp',
      type: 'Equity',
      category: 'startup',
      value: 15000,
      tokens: 500,
      ownedTokens: 500,
      performance: 12.8,
      monthlyYield: 160,
      status: 'active',
      location: 'San Francisco, USA',
      icon: Briefcase,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 3,
      name: 'Impianto Solare',
      type: 'Energia',
      category: 'energy',
      value: 25000,
      tokens: 750,
      ownedTokens: 250,
      performance: -2.1,
      monthlyYield: 95,
      status: 'active',
      location: 'Puglia, Italia',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const filterOptions = [
    { id: 'all', label: 'Tutti gli Asset', count: assets.length },
    { id: 'real_estate', label: 'Immobiliare', count: assets.filter(a => a.category === 'real_estate').length },
    { id: 'startup', label: 'Startup', count: assets.filter(a => a.category === 'startup').length },
    { id: 'energy', label: 'Energia', count: assets.filter(a => a.category === 'energy').length }
  ];

  const filteredAssets = assets.filter(asset => {
    const matchesFilter = selectedFilter === 'all' || asset.category === selectedFilter;
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalValue = assets.reduce((sum, asset) => sum + (asset.value * asset.ownedTokens / asset.tokens), 0);
  const totalMonthlyYield = assets.reduce((sum, asset) => sum + asset.monthlyYield, 0);
  const averagePerformance = assets.reduce((sum, asset) => sum + asset.performance, 0) / assets.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            I Miei Asset
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestisci e monitora i tuoi asset tokenizzati
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus size={16} />
          <span>Nuovo Asset</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Coins size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <Button variant="ghost" size="sm">
              <Eye size={16} />
            </Button>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              €{totalValue.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Valore Totale Asset</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              averagePerformance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {averagePerformance >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{averagePerformance >= 0 ? '+' : ''}{averagePerformance.toFixed(1)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              €{totalMonthlyYield.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Rendimento Mensile</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Building size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Attivi</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {assets.length}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Asset Tokenizzati</p>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-slate-600 dark:text-slate-400" />
          <div className="flex space-x-2">
            {filterOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedFilter === option.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(option.id)}
                className="flex items-center space-x-2"
              >
                <span>{option.label}</span>
                <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                  {option.count}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssets.map((asset, index) => {
          const Icon = asset.icon;
          const ownership = (asset.ownedTokens / asset.tokens) * 100;
          
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Asset Header */}
              <div className={`bg-gradient-to-r ${asset.color} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{asset.name}</h3>
                      <p className="text-white/80 text-sm">{asset.type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <MoreHorizontal size={16} />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      €{(asset.value * ownership / 100).toLocaleString()}
                    </div>
                    <div className="text-white/80 text-sm">
                      {asset.ownedTokens} di {asset.tokens} token ({ownership.toFixed(1)}%)
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    asset.performance >= 0 ? 'text-green-200' : 'text-red-200'
                  }`}>
                    {asset.performance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="font-semibold">
                      {asset.performance >= 0 ? '+' : ''}{asset.performance}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Rendimento Mensile</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      €{asset.monthlyYield.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Posizione</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {asset.location}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Proprietà</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {ownership.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${asset.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${ownership}%` }}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Dettagli
                  </Button>
                  <Button size="sm" className="flex-1">
                    Gestisci
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Nessun asset trovato
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Prova a modificare i filtri di ricerca o aggiungi un nuovo asset.
          </p>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;

