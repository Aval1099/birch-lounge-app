

import MainApp from './components/MainApp';
import EnhancedErrorBoundary from './components/ui/EnhancedErrorBoundary';
import { AppProvider } from './context/AppContext';

/**
 * Root App Component
 * Provides global context and error boundary for the entire application
 */
function App() {
  return (
    <EnhancedErrorBoundary
      title="Application Error"
      message="Something went wrong with the Birch Lounge app. Please refresh the page or contact support if the problem persists."
      enableAutoRetry={true}
      maxAutoRetries={1}
      showErrorDetails={true}
      onError={(error, errorInfo, errorContext) => {
        // Global error tracking
        console.error('Global application error:', errorContext);
      }}
    >
      <AppProvider>
        <MainApp />
      </AppProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
