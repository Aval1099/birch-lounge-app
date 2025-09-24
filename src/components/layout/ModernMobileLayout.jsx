import { memo, useState, useEffect } from 'react';
import { cn } from '../../utils';
import { ModernHeader, ModernMobileNav } from '../ui';

/**
 * Modern Mobile Layout - Premium mobile-first layout
 * Features: Safe areas, gesture support, optimized spacing
 */
const ModernMobileLayout = memo(({ 
  children,
  header,
  navigation,
  activeTab = 'recipes',
  onTabChange,
  className = '',
  headerProps = {},
  navigationProps = {},
  ...props 
}) => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);

  // Measure header and navigation heights for proper spacing
  useEffect(() => {
    const measureElements = () => {
      const headerEl = document.querySelector('[data-header]');
      const navEl = document.querySelector('[data-navigation]');
      
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight);
      }
      
      if (navEl) {
        setNavHeight(navEl.offsetHeight);
      }
    };

    measureElements();
    window.addEventListener('resize', measureElements);
    return () => window.removeEventListener('resize', measureElements);
  }, []);

  return (
    <div 
      className={cn(
        'min-h-screen bg-neutral-50 dark:bg-neutral-950',
        'flex flex-col',
        className
      )}
      {...props}
    >
      {/* Header */}
      {header !== false && (
        <div data-header>
          {header || (
            <ModernHeader
              onTabChange={onTabChange}
              {...headerProps}
            />
          )}
        </div>
      )}
      
      {/* Main Content Area */}
      <main 
        className={cn(
          'flex-1 relative',
          'overflow-x-hidden',
          // Account for header and navigation spacing
          header !== false && 'pt-safe-top',
          navigation !== false && 'pb-safe-bottom'
        )}
        style={{
          paddingBottom: navigation !== false ? `${navHeight + 16}px` : undefined,
        }}
      >
        {/* Content Container */}
        <div className={cn(
          'container mx-auto px-4 py-6',
          'max-w-7xl',
          // Responsive spacing
          'sm:px-6 lg:px-8',
          'space-y-6'
        )}>
          {children}
        </div>
        
        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-accent-50/30 dark:from-primary-950/30 dark:to-accent-950/30" />
          
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <svg width="60" height="60" viewBox="0 0 60 60" className="w-full h-full">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
      </main>
      
      {/* Bottom Navigation */}
      {navigation !== false && (
        <div data-navigation>
          {navigation || (
            <ModernMobileNav
              activeTab={activeTab}
              onTabChange={onTabChange}
              {...navigationProps}
            />
          )}
        </div>
      )}
      
      {/* Scroll to top button */}
      <ScrollToTopButton />
    </div>
  );
});

/**
 * Scroll to Top Button Component
 */
const ScrollToTopButton = memo(() => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-20 right-4 z-40',
        'w-12 h-12 rounded-full',
        'bg-primary-500 hover:bg-primary-600',
        'text-white shadow-lg shadow-primary-500/25',
        'transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
        'active:scale-95 transform',
        'animate-fade-in'
      )}
      aria-label="Scroll to top"
    >
      <svg
        className="w-6 h-6 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
});

ScrollToTopButton.displayName = 'ScrollToTopButton';
ModernMobileLayout.displayName = 'ModernMobileLayout';

export default ModernMobileLayout;
