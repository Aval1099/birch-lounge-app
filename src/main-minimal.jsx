import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import MinimalApp from './MinimalApp';

console.warn('🔍 DIAGNOSTIC: main-minimal.jsx is loading...');

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ DIAGNOSTIC: Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial;">❌ ERROR: Root element not found!</div>';
} else {
  console.warn('✅ DIAGNOSTIC: Root element found');

  try {
    console.warn('🔍 DIAGNOSTIC: Creating React root...');
    const root = createRoot(rootElement);

    console.warn('🔍 DIAGNOSTIC: Rendering MinimalApp...');
    root.render(
      <StrictMode>
        <MinimalApp />
      </StrictMode>
    );

    console.warn('✅ DIAGNOSTIC: React app rendered successfully!');
  } catch (error) {
    console.error('❌ DIAGNOSTIC: Error rendering React app:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h1>❌ React Rendering Error</h1>
        <p>Error: ${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
}
