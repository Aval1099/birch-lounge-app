import { memo } from 'react';

/**
 * Icon wrapper component for Lucide React icons
 * Provides consistent sizing and accessibility features
 */
const Icon = memo(({ 
  name: IconComponent, 
  size = 16, 
  className = '', 
  ariaLabel,
  ariaHidden = false,
  ...props 
}) => {
  if (!IconComponent) {
    console.warn('Icon component not provided to Icon wrapper');
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
});

Icon.displayName = 'Icon';

export default Icon;
