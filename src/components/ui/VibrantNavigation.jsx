import { useState, useEffect } from 'react';

/**
 * Vibrant Mobile Navigation Component - Modern, colorful, and touch-optimized
 */
const VibrantNavigation = ({ tabs = [], activeTab, onTabChange, className = '' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-50
      bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
      border-t border-emerald-200 dark:border-emerald-800
      shadow-lg shadow-emerald-500/10
      ${className}
    `}>
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center
                min-h-[60px] min-w-[60px] px-2 py-1
                rounded-xl transition-all duration-200 ease-out
                transform active:scale-95
                ${isActive 
                  ? `
                    bg-gradient-to-br from-emerald-500 to-green-600
                    text-white shadow-lg shadow-emerald-500/30
                    scale-105 -translate-y-1
                  ` 
                  : `
                    text-gray-600 dark:text-gray-400
                    hover:text-emerald-600 dark:hover:text-emerald-400
                    hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                    hover:scale-105
                  `
                }
              `}
              aria-label={`Switch to ${tab.label} tab`}
            >
              <Icon className={`
                w-5 h-5 mb-1 transition-all duration-200
                ${isActive ? 'scale-110' : ''}
              `} />
              <span className={`
                text-xs font-medium leading-tight
                ${isActive ? 'font-semibold' : ''}
              `}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * Vibrant Desktop Navigation Component
 */
export const VibrantDesktopNavigation = ({ tabs = [], activeTab, onTabChange, className = '' }) => {
  return (
    <nav className={`
      bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
      border-b border-emerald-200 dark:border-emerald-800
      shadow-sm
      ${className}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-1 py-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  transition-all duration-200 ease-out
                  transform hover:scale-105 active:scale-95
                  ${isActive 
                    ? `
                      bg-gradient-to-r from-emerald-500 to-green-600
                      text-white shadow-lg shadow-emerald-500/30
                    ` 
                    : `
                      text-gray-600 dark:text-gray-400
                      hover:text-emerald-600 dark:hover:text-emerald-400
                      hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                    `
                  }
                `}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default VibrantNavigation;
