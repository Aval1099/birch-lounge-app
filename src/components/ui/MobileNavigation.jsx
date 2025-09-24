// =============================================================================
// MOBILE NAVIGATION COMPONENT
// =============================================================================


import { ChefHat, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

import { ActionType } from '../../constants';
import { useMobileDetection, useSwipeGesture } from '../../hooks';
import { useApp } from '../../hooks/useApp';

import Button from './Button';


/**
 * Mobile-optimized navigation component with swipe gestures
 */
const MobileNavigation = memo(({ tabs = [] }) => {
  const { state, dispatch } = useApp();
  const { activeTab } = state;
  const { isMobile, screenSize: _screenSize } = useMobileDetection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  // Find current tab index
  useEffect(() => {
    const index = tabs.findIndex(tab => tab.id === activeTab);
    setCurrentTabIndex(index >= 0 ? index : 0);
  }, [activeTab, tabs]);

  // Swipe gesture handlers for tab navigation
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (currentTabIndex < tabs.length - 1) {
        const nextTab = tabs[currentTabIndex + 1];
        dispatch({
          type: ActionType.SET_ACTIVE_TAB,
          payload: nextTab.id
        });
      }
    },
    onSwipeRight: () => {
      if (currentTabIndex > 0) {
        const prevTab = tabs[currentTabIndex - 1];
        dispatch({
          type: ActionType.SET_ACTIVE_TAB,
          payload: prevTab.id
        });
      }
    }
  });

  const handleTabChange = (tabId) => {
    dispatch({
      type: ActionType.SET_ACTIVE_TAB,
      payload: tabId
    });
    setIsMenuOpen(false);
  };

  // Mobile hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Birch Lounge
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {tabs.find(t => t.id === activeTab)?.label || 'Cocktail Manager'}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="ghost"
              size="md"
              className="p-2"
              ariaLabel="Toggle navigation menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsMenuOpen(false);
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
            tabIndex={-1}
          >
            <div
              className="bg-white dark:bg-gray-800 w-80 h-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="navigation"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 id="mobile-nav-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Navigation
                  </h2>
                  <Button
                    onClick={() => setIsMenuOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    ariaLabel="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <nav className="p-4">
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors min-h-[48px] ${isActive
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        aria-label={`Switch to ${tab.label} tab`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{tab.label}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-amber-600 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Swipe Area for Tab Navigation */}
        <div
          className="h-2 bg-gray-100 dark:bg-gray-800 relative"
          {...swipeHandlers}
        >
          {/* Tab Indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-amber-600 transition-all duration-300"
              style={{
                width: `${100 / tabs.length}%`,
                transform: `translateX(${currentTabIndex * 100}%)`
              }}
            />
          </div>

          {/* Navigation Arrows */}
          {currentTabIndex > 0 && (
            <button
              onClick={() => {
                const prevTab = tabs[currentTabIndex - 1];
                handleTabChange(prevTab.id);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
              aria-label="Previous tab"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {currentTabIndex < tabs.length - 1 && (
            <button
              onClick={() => {
                const nextTab = tabs[currentTabIndex + 1];
                handleTabChange(nextTab.id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
              aria-label="Next tab"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </>
    );
  }

  // Desktop/Tablet horizontal tabs
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap min-h-[48px] ${isActive
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                aria-label={`Switch to ${tab.label} tab`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

MobileNavigation.displayName = 'MobileNavigation';

export default MobileNavigation;
