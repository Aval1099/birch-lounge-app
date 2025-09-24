import { memo, useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Plus, 
  BookOpen, 
  Settings,
  ChefHat,
  Zap
} from 'lucide-react';
import { cn } from '../../utils';

/**
 * Modern Mobile Navigation - Premium bottom navigation
 * Features: Glassmorphism, haptic feedback, smooth animations, gesture support
 */
const ModernMobileNav = memo(({ 
  activeTab = 'recipes',
  onTabChange,
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Navigation items
  const navItems = [
    {
      id: 'recipes',
      label: 'Recipes',
      icon: ChefHat,
      color: 'text-primary-600',
      activeColor: 'text-primary-600',
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      color: 'text-neutral-600',
      activeColor: 'text-accent-600',
    },
    {
      id: 'add',
      label: 'Add',
      icon: Plus,
      color: 'text-neutral-600',
      activeColor: 'text-success-600',
      special: true, // Special styling for add button
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: BookOpen,
      color: 'text-neutral-600',
      activeColor: 'text-warning-600',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-neutral-600',
      activeColor: 'text-neutral-700',
    },
  ];

  // Auto-hide navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Hide when scrolling down
      } else {
        setIsVisible(true); // Show when scrolling up
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Handle tab change with haptic feedback
  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
    
    onTabChange?.(tabId);
  };

  return (
    <nav
      className={cn(
        // Base layout
        'fixed bottom-0 left-0 right-0 z-50',
        'transition-all duration-300 ease-out',
        
        // Glassmorphism background
        'bg-white/80 backdrop-blur-xl',
        'dark:bg-neutral-900/80',
        
        // Border and shadow
        'border-t border-neutral-200/50',
        'dark:border-neutral-700/50',
        'shadow-lg shadow-black/5',
        
        // Safe area for mobile devices
        'pb-safe-bottom',
        
        // Hide/show animation
        isVisible ? 'translate-y-0' : 'translate-y-full',
        
        className
      )}
      {...props}
    >
      {/* Navigation container */}
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={cn(
                // Base button styles
                'relative flex flex-col items-center justify-center',
                'min-w-[60px] min-h-[60px] p-2',
                'rounded-2xl transition-all duration-200 ease-out',
                'touch-manipulation select-none',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                
                // Special styling for add button
                item.special && [
                  'bg-gradient-to-br from-primary-500 to-primary-600',
                  'shadow-lg shadow-primary-500/25',
                  'scale-110 -mt-2',
                  isActive && 'from-primary-600 to-primary-700',
                ],
                
                // Regular button styling
                !item.special && [
                  'hover:bg-neutral-100/60',
                  'dark:hover:bg-neutral-800/60',
                  isActive && [
                    'bg-primary-50/80 dark:bg-primary-900/20',
                    'shadow-sm',
                  ],
                ],
                
                // Active state transform
                'active:scale-95 transform'
              )}
            >
              {/* Icon */}
              <Icon 
                className={cn(
                  'w-6 h-6 transition-colors duration-200',
                  item.special 
                    ? 'text-white' 
                    : isActive 
                      ? item.activeColor 
                      : item.color,
                  'dark:text-neutral-400',
                  isActive && !item.special && 'dark:text-white'
                )}
              />
              
              {/* Label */}
              <span 
                className={cn(
                  'text-xs font-medium mt-1 transition-colors duration-200',
                  item.special 
                    ? 'text-white' 
                    : isActive 
                      ? item.activeColor 
                      : 'text-neutral-600',
                  'dark:text-neutral-400',
                  isActive && !item.special && 'dark:text-white'
                )}
              >
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && !item.special && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-primary-500 rounded-full animate-pulse" />
                </div>
              )}
              
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Home indicator for devices with home gesture */}
      <div className="flex justify-center pb-1">
        <div className="w-32 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full opacity-60" />
      </div>
    </nav>
  );
});

ModernMobileNav.displayName = 'ModernMobileNav';

export default ModernMobileNav;
