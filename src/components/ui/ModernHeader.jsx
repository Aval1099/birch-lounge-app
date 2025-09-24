import { memo, useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  Menu, 
  Sun, 
  Moon,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '../../utils';
import ModernButton from './ModernButton';

/**
 * Modern Header Component - Premium mobile-first design
 * Features: Glassmorphism, auto-hide on scroll, status indicators
 */
const ModernHeader = memo(({ 
  title = 'Birch Lounge',
  subtitle,
  onMenuClick,
  onSearchClick,
  onProfileClick,
  onNotificationClick,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  darkMode = false,
  onDarkModeToggle,
  className = '',
  ...props 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header
      className={cn(
        // Base layout
        'sticky top-0 z-40 w-full',
        'transition-all duration-300 ease-out',
        
        // Background with glassmorphism
        'bg-white/80 backdrop-blur-xl',
        'dark:bg-neutral-900/80',
        
        // Border and shadow
        'border-b border-neutral-200/50',
        'dark:border-neutral-700/50',
        
        // Scroll effects
        isScrolled && [
          'shadow-lg shadow-black/5',
          'bg-white/95 dark:bg-neutral-900/95',
        ],
        
        // Safe area for mobile devices
        'pt-safe-top',
        
        className
      )}
      {...props}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-3">
            {/* Menu button */}
            <ModernButton
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
              icon={Menu}
            />
            
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className={cn(
                'w-8 h-8 rounded-xl',
                'bg-gradient-to-br from-primary-500 to-primary-600',
                'flex items-center justify-center',
                'shadow-sm'
              )}>
                <span className="text-white font-bold text-sm">BL</span>
              </div>
              
              {/* Title and subtitle */}
              <div className="hidden sm:block">
                <h1 className={cn(
                  'font-display font-bold text-xl',
                  'text-neutral-900 dark:text-neutral-100',
                  'leading-tight'
                )}>
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Online status indicator */}
            <div className={cn(
              'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full',
              'bg-neutral-100/60 dark:bg-neutral-800/60',
              'border border-neutral-200/50 dark:border-neutral-700/50'
            )}>
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-success-500" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Online
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-error-500" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Offline
                  </span>
                </>
              )}
            </div>
            
            {/* Search button */}
            {showSearch && (
              <ModernButton
                variant="ghost"
                size="icon"
                onClick={onSearchClick}
                icon={Search}
                className="hidden sm:flex"
              />
            )}
            
            {/* Dark mode toggle */}
            <ModernButton
              variant="ghost"
              size="icon"
              onClick={onDarkModeToggle}
              icon={darkMode ? Sun : Moon}
              className="hidden sm:flex"
            />
            
            {/* Notifications */}
            {showNotifications && (
              <div className="relative">
                <ModernButton
                  variant="ghost"
                  size="icon"
                  onClick={onNotificationClick}
                  icon={Bell}
                />
                {/* Notification badge */}
                <div className={cn(
                  'absolute -top-1 -right-1',
                  'w-3 h-3 rounded-full',
                  'bg-error-500 border-2 border-white dark:border-neutral-900',
                  'animate-pulse'
                )} />
              </div>
            )}
            
            {/* Profile */}
            {showProfile && (
              <ModernButton
                variant="ghost"
                size="icon"
                onClick={onProfileClick}
                icon={User}
                className={cn(
                  'ring-2 ring-transparent',
                  'hover:ring-primary-500/20'
                )}
              />
            )}
          </div>
        </div>
        
        {/* Mobile title (when menu is collapsed) */}
        <div className="sm:hidden mt-2">
          <h1 className={cn(
            'font-display font-bold text-lg',
            'text-neutral-900 dark:text-neutral-100'
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Progress bar for loading states */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-200 dark:bg-neutral-700">
        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transform origin-left scale-x-0 transition-transform duration-300" />
      </div>
    </header>
  );
});

ModernHeader.displayName = 'ModernHeader';

export default ModernHeader;
