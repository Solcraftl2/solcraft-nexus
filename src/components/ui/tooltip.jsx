import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ 
  children, 
  content, 
  title, 
  position = 'top',
  size = 'md',
  trigger = 'hover',
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);
  const toggleTooltip = () => setIsVisible(!isVisible);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const sizeClasses = {
    sm: 'max-w-xs text-sm',
    md: 'max-w-sm text-base',
    lg: 'max-w-md text-base',
    xl: 'max-w-lg text-lg'
  };

  const triggerProps = trigger === 'hover' 
    ? { onMouseEnter: showTooltip, onMouseLeave: hideTooltip }
    : { onClick: toggleTooltip };

  return (
    <div className={`relative inline-block ${className}`}>
      <div {...triggerProps} className="cursor-help">
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 ${positionClasses[position]} ${sizeClasses[size]}`}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
              {trigger === 'click' && (
                <button
                  onClick={hideTooltip}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              )}
              
              {title && (
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {title}
                </h4>
              )}
              
              <div className="text-gray-700 dark:text-gray-300">
                {content}
              </div>
              
              {/* Arrow */}
              <div 
                className={`absolute w-3 h-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transform rotate-45 ${
                  position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-l-0' :
                  position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-b-0 border-r-0' :
                  position === 'left' ? 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-l-0 border-b-0' :
                  'right-full top-1/2 translate-x-1/2 -translate-y-1/2 border-r-0 border-t-0'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente HelpIcon per uso rapido
export const HelpIcon = ({ content, title, size = 16, className = '' }) => (
  <Tooltip content={content} title={title} trigger="click" size="md">
    <HelpCircle 
      size={size} 
      className={`text-blue-500 hover:text-blue-600 cursor-help ${className}`} 
    />
  </Tooltip>
);

// Componente InfoBox per spiegazioni più dettagliate
export const InfoBox = ({ title, children, type = 'info', className = '' }) => {
  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${typeStyles[type]} ${className}`}>
      {title && (
        <h4 className="font-semibold mb-2">{title}</h4>
      )}
      <div className="text-sm">
        {children}
      </div>
    </div>
  );
};

export default Tooltip;

