// =============================================================================
// RESPONSIVE GRID COMPONENT
// =============================================================================

import React, { memo } from 'react';
import { useMobileDetection } from '../../hooks';

/**
 * Responsive grid component that adapts to screen size
 */
const ResponsiveGrid = memo(({ 
  children, 
  className = '',
  cols = {
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },
  gap = 'gap-4',
  ...props 
}) => {
  const { screenSize } = useMobileDetection();

  // Generate responsive grid classes
  const getGridCols = () => {
    const colsMap = {
      xs: `grid-cols-${cols.xs}`,
      sm: `sm:grid-cols-${cols.sm}`,
      md: `md:grid-cols-${cols.md}`,
      lg: `lg:grid-cols-${cols.lg}`,
      xl: `xl:grid-cols-${cols.xl}`
    };

    return Object.values(colsMap).join(' ');
  };

  const gridClasses = [
    'grid',
    getGridCols(),
    gap,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
});

ResponsiveGrid.displayName = 'ResponsiveGrid';

/**
 * Responsive card component with touch-optimized interactions
 */
export const ResponsiveCard = memo(({ 
  children, 
  className = '',
  onClick = null,
  onLongPress = null,
  interactive = false,
  ...props 
}) => {
  const { isMobile, isTouch } = useMobileDetection();

  const baseClasses = [
    'bg-white dark:bg-gray-800',
    'rounded-xl shadow-sm',
    'border border-gray-200 dark:border-gray-700',
    'overflow-hidden',
    'transition-all duration-200'
  ];

  const interactiveClasses = interactive ? [
    'cursor-pointer',
    isMobile || isTouch 
      ? 'active:scale-95 active:shadow-lg' 
      : 'hover:shadow-md hover:-translate-y-1'
  ] : [];

  const cardClasses = [
    ...baseClasses,
    ...interactiveClasses,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleTouchStart = (e) => {
    if (onLongPress && (isMobile || isTouch)) {
      const timer = setTimeout(() => {
        onLongPress(e);
      }, 500);

      const cleanup = () => {
        clearTimeout(timer);
        document.removeEventListener('touchend', cleanup);
        document.removeEventListener('touchcancel', cleanup);
      };

      document.addEventListener('touchend', cleanup);
      document.addEventListener('touchcancel', cleanup);
    }
  };

  return (
    <div 
      className={cardClasses}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

ResponsiveCard.displayName = 'ResponsiveCard';

/**
 * Mobile-optimized list component
 */
export const ResponsiveList = memo(({ 
  items = [], 
  renderItem, 
  className = '',
  itemClassName = '',
  emptyMessage = 'No items found',
  ...props 
}) => {
  const { isMobile } = useMobileDetection();

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const listClasses = [
    'space-y-2',
    isMobile ? 'px-4' : '',
    className
  ].filter(Boolean).join(' ');

  const defaultItemClasses = [
    'bg-white dark:bg-gray-800',
    'rounded-lg shadow-sm',
    'border border-gray-200 dark:border-gray-700',
    'p-4',
    isMobile ? 'min-h-[48px]' : '',
    itemClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={listClasses} {...props}>
      {items.map((item, index) => (
        <div key={item.id || index} className={defaultItemClasses}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

ResponsiveList.displayName = 'ResponsiveList';

/**
 * Responsive container with proper padding and max-width
 */
export const ResponsiveContainer = memo(({ 
  children, 
  className = '',
  size = 'default',
  ...props 
}) => {
  const { isMobile } = useMobileDetection();

  const sizeClasses = {
    sm: 'max-w-2xl',
    default: 'max-w-7xl',
    lg: 'max-w-full',
    full: 'w-full'
  };

  const containerClasses = [
    sizeClasses[size],
    'mx-auto',
    isMobile ? 'px-4 py-4' : 'px-4 sm:px-6 lg:px-8 py-8',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

/**
 * Mobile-optimized modal component
 */
export const ResponsiveModal = memo(({ 
  isOpen, 
  onClose, 
  children, 
  title = '',
  className = '',
  size = 'default',
  ...props 
}) => {
  const { isMobile, viewportHeight } = useMobileDetection();

  if (!isOpen) return null;

  const sizeClasses = {
    sm: isMobile ? 'w-full h-full' : 'max-w-md',
    default: isMobile ? 'w-full h-full' : 'max-w-2xl',
    lg: isMobile ? 'w-full h-full' : 'max-w-4xl',
    full: 'w-full h-full'
  };

  const modalClasses = [
    'fixed inset-0 z-50 flex',
    isMobile ? 'items-start' : 'items-center justify-center',
    'p-0'
  ].join(' ');

  const contentClasses = [
    'bg-white dark:bg-gray-800',
    isMobile ? 'w-full h-full rounded-none' : 'rounded-xl shadow-xl',
    sizeClasses[size],
    isMobile ? 'overflow-y-auto' : 'max-h-[90vh] overflow-hidden',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={modalClasses} {...props}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        className={contentClasses}
        style={isMobile ? { height: `${viewportHeight}px` } : {}}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {children}
      </div>
    </div>
  );
});

ResponsiveModal.displayName = 'ResponsiveModal';

export default ResponsiveGrid;
