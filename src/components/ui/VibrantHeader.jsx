import { ChefHat, Moon, Sun, Settings, Plus, Zap } from 'lucide-react';

import VibrantButton from './VibrantButton';

/**
 * Vibrant Header Component - Modern, colorful, and feature-rich
 */
const VibrantHeader = ({
  title = 'Birch Lounge',
  subtitle = 'Cocktail Recipe Manager',
  theme = 'light',
  serviceMode = false,
  onThemeToggle,
  onServiceModeToggle,
  onNewRecipe,
  onSettings,
  className = ''
}) => {
  return (
    <header className={`
      bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600
      dark:from-emerald-700 dark:via-green-700 dark:to-emerald-800
      shadow-lg shadow-emerald-500/20
      border-b border-emerald-400/30
      ${className}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="
              w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl
              flex items-center justify-center
              border border-white/30 shadow-lg
              transform hover:scale-110 transition-transform duration-200
            ">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {title}
              </h1>
              <p className="text-emerald-100 text-sm font-medium">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Service Mode Toggle */}
            <VibrantButton
              variant={serviceMode ? 'vibrant' : 'glass'}
              size="sm"
              onClick={onServiceModeToggle}
              icon={<Zap className="w-4 h-4" />}
              className={`
                ${serviceMode 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30' 
                  : 'text-white hover:bg-white/20'
                }
              `}
            >
              Service Mode
            </VibrantButton>

            {/* New Recipe Button */}
            <VibrantButton
              variant="glass"
              size="sm"
              onClick={onNewRecipe}
              icon={<Plus className="w-4 h-4" />}
              className="text-white hover:bg-white/20"
            >
              New Recipe
            </VibrantButton>

            {/* Theme Toggle */}
            <VibrantButton
              variant="ghost"
              size="sm"
              onClick={onThemeToggle}
              icon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              className="text-white hover:bg-white/20 p-2"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            />

            {/* Settings Button */}
            <VibrantButton
              variant="ghost"
              size="sm"
              onClick={onSettings}
              icon={<Settings className="w-4 h-4" />}
              className="text-white hover:bg-white/20 p-2"
              aria-label="Open settings"
            />
          </div>
        </div>
      </div>

      {/* Service Mode Indicator */}
      {serviceMode && (
        <div className="
          bg-amber-500/90 backdrop-blur-sm
          border-t border-amber-400/50
          px-4 py-2
        ">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-white">
              <Zap className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">
                Service Mode Active - Optimized for bartending workflow
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default VibrantHeader;
