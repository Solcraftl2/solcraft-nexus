import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';

const InteractiveGuide = ({ 
  steps, 
  isOpen, 
  onClose, 
  onComplete,
  title = "Guida Interattiva",
  autoPlay = false,
  autoPlayDelay = 3000
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let interval;
    if (isPlaying && hasStarted && currentStep < steps.length - 1) {
      interval = setInterval(() => {
        setCurrentStep(prev => prev + 1);
      }, autoPlayDelay);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, steps.length, autoPlayDelay, hasStarted]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setHasStarted(true);
    } else {
      onComplete?.();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const restart = () => {
    setCurrentStep(0);
    setHasStarted(false);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!hasStarted) setHasStarted(true);
  };

  if (!isOpen || !steps.length) return null;

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Passo {currentStep + 1} di {steps.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {currentStepData.title}
                </h3>

                {/* Step Image/Video */}
                {currentStepData.media && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {currentStepData.media.type === 'image' ? (
                      <img
                        src={currentStepData.media.src}
                        alt={currentStepData.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : currentStepData.media.type === 'video' ? (
                      <video
                        src={currentStepData.media.src}
                        autoPlay
                        loop
                        muted
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center">
                        <div className="text-4xl">{currentStepData.media.icon}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step Description */}
                <div className="text-gray-700 dark:text-gray-300 mb-4">
                  {currentStepData.description}
                </div>

                {/* Step Tips */}
                {currentStepData.tips && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      💡 Suggerimento
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {currentStepData.tips}
                    </p>
                  </div>
                )}

                {/* Interactive Elements */}
                {currentStepData.interactive && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      🎯 Prova tu stesso
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {currentStepData.interactive}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={restart}
                disabled={currentStep === 0 && !hasStarted}
              >
                <RotateCcw size={16} className="mr-1" />
                Ricomincia
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlay}
                disabled={currentStep === steps.length - 1}
              >
                {isPlaying ? (
                  <>
                    <Pause size={16} className="mr-1" />
                    Pausa
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-1" />
                    Auto
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft size={16} className="mr-1" />
                Indietro
              </Button>
              
              <Button
                onClick={nextStep}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {currentStep === steps.length - 1 ? (
                  'Completa'
                ) : (
                  <>
                    Avanti
                    <ChevronRight size={16} className="ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook per gestire le guide
export const useInteractiveGuide = (guideSteps) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [hasCompletedGuide, setHasCompletedGuide] = useState(false);

  const startGuide = () => {
    setIsGuideOpen(true);
  };

  const closeGuide = () => {
    setIsGuideOpen(false);
  };

  const completeGuide = () => {
    setHasCompletedGuide(true);
    setIsGuideOpen(false);
    // Salva il completamento nel localStorage
    localStorage.setItem(`guide_completed_${guideSteps.id}`, 'true');
  };

  useEffect(() => {
    // Controlla se la guida è già stata completata
    const completed = localStorage.getItem(`guide_completed_${guideSteps.id}`);
    if (completed === 'true') {
      setHasCompletedGuide(true);
    }
  }, [guideSteps.id]);

  return {
    isGuideOpen,
    hasCompletedGuide,
    startGuide,
    closeGuide,
    completeGuide
  };
};

export default InteractiveGuide;
export { InteractiveGuide };

