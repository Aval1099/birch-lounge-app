import { forwardRef } from 'react';

import { useMobileDetection } from '../../hooks';


/**
 * ResponsiveModal Component - Automatically switches between Modal and BottomSheet
 * 
 * Features:
 * - Automatic device detection
 * - Seamless switching between modal and bottom sheet
 * - Consistent API for both components
 * - Maintains all functionality of both components
 */
const ResponsiveModal = forwardRef(({
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
}, ref) => {
  const { isMobile } = useMobileDetection();

  // Determine which component to render
  const shouldUseBottomSheet = forceMobile || (isMobile && !forceDesktop);

  if (shouldUseBottomSheet) {
    return (
      <BottomSheet
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        height={height}
        showCloseButton={showCloseButton}
        backdrop={backdrop}
        swipeToClose={swipeToClose}
        className={className}
        forceRender={forceMobile}
        {...props}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <Modal
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      showCloseButton={showCloseButton}
      backdrop={backdrop}
      className={className}
      {...props}
    >
      {children}
    </Modal>
  );
});

ResponsiveModal.displayName = 'ResponsiveModal';

export default ResponsiveModal;
