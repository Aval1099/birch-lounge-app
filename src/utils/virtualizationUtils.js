// =============================================================================
// VIRTUALIZATION UTILITIES
// =============================================================================

import { useMemo } from 'react';

/**
 * Hook to determine if virtualization should be enabled
 * Based on item count and performance considerations
 */
export const useVirtualization = (itemCount, threshold = 50) => {
  return useMemo(() => {
    return itemCount > threshold;
  }, [itemCount, threshold]);
};
