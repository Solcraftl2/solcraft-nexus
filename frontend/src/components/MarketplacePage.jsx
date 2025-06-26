import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Briefcase,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

const MarketplacePage = ({ user }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('performance');

  // Dati marketplace simulati
  const marketplaceAssets = [
    {
      id: 1,
      name: 'Villa Toscana Premium',
      type: 'Immobiliare',
      category: 'real_estate',
      totalValue: 450000,
      availableTokens: 200,
      totalTokens: 1000,
      tokenPrice: 450,
      performance: 8.7,
      monthlyYield: 2.1,
      location: 'Firenze, Italia',
      rating: 4.8,
      investors: 45,
      timeLeft: '12 giorni',
      icon: Building,
      color: 'from-blue-500 to-blue-600',
      featured: true
    },
    {
      id: 2,
      name: 'AI Startup Berlin',
      type: 'Startup',
      category: 'startup',
      totalValue: 120000,
      availableTokens: 150,
      totalTokens: 500,
      tokenPrice: 240,
      performance: 15.2,
      monthlyYield: 3.8,
      location: 'Berlino, Germania',
      rating: 4.6,
      investors: 28,
      timeLeft: '5 giorni',
      icon: Briefcase,
      color: 'from-green-500 to-green-600',
      featured: false
    },
    {
      id: 3,
      name: 'Parco Eolico Sardegna',
      type: 'Energia',
      category: 'energy',
      totalValue: 280000,
      availableTokens: 75,
      totalTokens: 800,
      tokenPrice: 350,
      performance: 6.4,
      monthlyYield: 1.9,
      location: 'Sardegna, Italia',
      rating: 4.5,
      investors: 62,
      timeLeft: '8 giorni',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      featured: false
    }
  ];

  const categories = [
    { id: 'all', label: 'Tutti', count: marketplaceAssets.length },
    { id: 'real_estate', label: 'Immobiliare', count: marketplaceAssets.filter(a => a.category === 'real_estate').length },
    { id: 'startup', label: 'Startup', count: marketplaceAssets.filter(a => a.category === 'startup').length },
    { id: 'energy', label: 'Energia', count: marketplaceAssets.filter(a => a.category === 'energy').length }
  ];

  const sortOptions = [
    { id: 'performance', label: 'Performance' },
    { id: 'yield', label: 'Rendimento' },
    { id: 'price', label: 'Prezzo Token' },
    { id: 'rating', label: 'Rating' }
  ];

  const filteredAssets = marketplaceAssets
    .filter(asset => {
      const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.performance - a.performance;
        case 'yield':
          return b.monthlyYield - a.monthlyYield;
        case 'price':
          return a.tokenPrice - b.tokenPrice;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Marketplace
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Investi in asset tokenizzati da tutto il mondo
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {marketplaceAssets.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Asset Disponibili</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                €{marketplaceAssets.reduce((sum, asset) => sum + asset.totalValue, 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Valore Totale</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {marketplaceAssets.reduce((sum, asset) => sum + asset.investors, 0)}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Investitori Attivi</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {(marketplaceAssets.reduce((sum, asset) => sum + asset.performance, 0) / marketplaceAssets.length).toFixed(1)}%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Performance Media</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca asset per nome o località..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-slate-600 dark:text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.count})
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                Ordina per {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssets.map((asset, index) => {
          const Icon = asset.icon;
          const availabilityPercentage = (asset.availableTokens / asset.totalTokens) * 100;
          
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Asset Header */}
              <div className={`bg-gradient-to-r ${asset.color} p-4 text-white relative`}>
                {asset.featured && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                      <Star size={12} />
                      <span>Featured</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{asset.name}</h3>
                    <p className="text-white/80 text-sm">{asset.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">
                      €{asset.tokenPrice}
                    </div>
                    <div className="text-white/80 text-sm">per token</div>
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
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">{asset.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-yellow-500" />
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {asset.rating}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Rendimento Mensile</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {asset.monthlyYield}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Investitori</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {asset.investors}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Disponibilità</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {asset.availableTokens}/{asset.totalTokens} token
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${asset.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${100 - availabilityPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock size={14} />
                    <span>{asset.timeLeft} rimasti</span>
                  </div>
                  <Button size="sm" className="group-hover:scale-105 transition-transform">
                    Investi Ora
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
            Prova a modificare i filtri di ricerca.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;

