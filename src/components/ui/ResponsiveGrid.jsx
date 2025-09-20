// =============================================================================
// RESPONSIVE GRID COMPONENT
// =============================================================================

import { memo } from 'react';

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
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e);
        }
      }}
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
 * Enhanced ResponsiveModal - Automatically switches between Modal and BottomSheet
 *
 * Features:
 * - Automatic device detection
 * - Bottom sheet on mobile with gesture support
 * - Traditional modal on desktop
 * - Consistent API for both components
 */
export const ResponsiveModal = memo(({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'md',
  height = 'auto',
  showCloseButton = true,
  backdrop = true,
  swipeToClose = true,
  forceDesktop = false,
  forceMobile = false,
  className = '',
  ...props
}) => {
  const { isMobile } = useMobileDetection();

  // Determine which component to render
  const shouldUseBottomSheet = forceMobile || (isMobile && !forceDesktop);

  if (!isOpen) return null;

  if (shouldUseBottomSheet) {
    // Mobile: Use bottom sheet style
    return (
      <>
        {/* Backdrop */}
        {backdrop && (
          <div
            className={`
              fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
              transition-opacity duration-300 ease-out
              ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Bottom Sheet */}
        <div
          className={`
            fixed bottom-0 left-0 right-0 z-50
            bg-white dark:bg-gray-900
            rounded-t-2xl shadow-2xl
            transform transition-transform duration-300 ease-out
            ${isOpen ? 'translate-y-0' : 'translate-y-full'}
            ${height === 'auto' ? 'max-h-[80vh]' :
              height === 'half' ? 'h-[50vh]' :
                height === 'full' ? 'h-[90vh]' : height}
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'bottom-sheet-title' : undefined}
          {...props}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2
                id="bottom-sheet-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </>
    );
  }

  // Desktop: Use traditional modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" {...props}>
      {/* Backdrop */}
      {backdrop && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Modal Content */}
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-xl shadow-xl
          ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden
          ${className}
        `}
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
