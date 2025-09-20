/**
 * Error Boundary Utility Functions
 * Separated from ErrorBoundary component to avoid React Fast Refresh issues
 */


/**
 * Provider component that wraps children with ErrorBoundary
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.Component} ErrorBoundary wrapper
 */
export const ErrorBoundaryProvider = ({ children }) => {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

/**
 * Higher-order component that wraps a component with ErrorBoundary
 * @param {React.Component} Component - Component to wrap
 * @param {Object} errorBoundaryProps - Props for error boundary
 * @returns {React.Component} Wrapped component
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook to handle errors in functional components
 * @returns {Function} Error handler function
 */
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // You could dispatch to a global error state here
    // or send to an error reporting service
  };
};
