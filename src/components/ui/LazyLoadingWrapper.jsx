import { AlertTriangle, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

import EnhancedErrorBoundary from './EnhancedErrorBoundary';

/**
 * Loading component for lazy-loaded features
 */
const FeatureLoading = ({ featureName = 'Feature' }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="flex items-center gap-3 mb-4">
      <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
        Loading {featureName}...
      </span>
    </div>
    <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse" />
    </div>
  </div>
);

/**
 * Error fallback component for lazy-loaded features
 */
const FeatureError = ({ featureName = 'Feature', onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <div className="flex items-center gap-3 mb-4">
      <AlertTriangle className="w-6 h-6 text-red-500" />
      <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
        Failed to load {featureName}
      </span>
    </div>
    <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
      There was an error loading this feature. Please check your connection and try again.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
      >
        Try Again
      </button>
    )}
  </div>
);

/**
 * Wrapper component for lazy-loaded features with loading states and error boundaries
 */
const LazyLoadingWrapper = ({
  children,
  featureName = 'Feature',
  fallback = null,
  onError = null
}) => {
  const loadingComponent = fallback || <FeatureLoading featureName={featureName} />;

  return (
    <EnhancedErrorBoundary
      fallback={<FeatureError featureName={featureName} onRetry={onError} />}
      onError={onError}
    >
      <Suspense fallback={loadingComponent}>
        {children}
      </Suspense>
    </EnhancedErrorBoundary>
  );
};

export default LazyLoadingWrapper;
export { FeatureLoading, FeatureError };
