import React, { useState } from 'react';
import { 
  TrendingUp, 
  Upload, 
  FileText, 
  Camera, 
  MapPin,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

const TokenizePage = ({ user }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [assetData, setAssetData] = useState({
    name: '',
    type: 'real_estate',
    value: '',
    description: '',
    location: '',
    documents: []
  });

  const steps = [
    { id: 1, title: 'Informazioni Asset', icon: FileText },
    { id: 2, title: 'Documentazione', icon: Upload },
    { id: 3, title: 'Valutazione', icon: DollarSign },
    { id: 4, title: 'Tokenizzazione', icon: TrendingUp }
  ];

  const assetTypes = [
    { id: 'real_estate', label: 'Immobiliare', icon: '🏠' },
    { id: 'startup', label: 'Startup', icon: '🚀' },
    { id: 'energy', label: 'Energia', icon: '⚡' },
    { id: 'art', label: 'Arte', icon: '🎨' },
    { id: 'commodity', label: 'Materie Prime', icon: '📦' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Tokenizza Asset
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Trasforma i tuoi asset fisici in token digitali
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-3 ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`font-medium ${
                      isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Informazioni dell'Asset
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nome Asset
              </label>
              <input
                type="text"
                placeholder="es. Appartamento Milano Centro"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                value={assetData.name}
                onChange={(e) => setAssetData({...assetData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo di Asset
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {assetTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAssetData({...assetData, type: type.id})}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      assetData.type === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {type.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Valore Stimato (€)
              </label>
              <input
                type="number"
                placeholder="100000"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                value={assetData.value}
                onChange={(e) => setAssetData({...assetData, value: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descrizione
              </label>
              <textarea
                rows={4}
                placeholder="Descrivi il tuo asset in dettaglio..."
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                value={assetData.description}
                onChange={(e) => setAssetData({...assetData, description: e.target.value})}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)}>
                Continua
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Placeholder per altri step */}
      {currentStep > 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Step {currentStep} in Sviluppo
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Questa funzionalità sarà disponibile presto.
            </p>
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Indietro
              </Button>
              {currentStep < 4 && (
                <Button onClick={() => setCurrentStep(currentStep + 1)}>
                  Continua
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TokenizePage;

