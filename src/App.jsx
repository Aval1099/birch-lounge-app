
/* eslint-disable unused-imports/no-unused-imports */
import MainApp from './components/MainApp';
import { ErrorBoundary } from './components/ui';
import { AppProvider } from './context/AppContext';

/**
 * Root App Component
 * Provides global context and error boundary for the entire application
 */
function App() {
  return (
    <ErrorBoundary
      title="Application Error"
      message="Something went wrong with the Birch Lounge app. Please refresh the page or contact support if the problem persists."
    >
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
