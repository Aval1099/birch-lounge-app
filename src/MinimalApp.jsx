import React from 'react';

/**
 * Minimal React App - Just to test if React is working
 */
function MinimalApp() {
  // Development diagnostic logging
  if (process.env.NODE_ENV === 'development') {
    console.warn('🔍 DIAGNOSTIC: MinimalApp component is rendering!');
  }

  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    console.warn('✅ React hooks are working!');
  }, []);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1>🎉 REACT IS WORKING!</h1>
        <p>✅ This is a minimal React component</p>
        <p>✅ React hooks are functional</p>
        <p>✅ State management is working</p>

        <div style={{ margin: '20px 0' }}>
          <button
            onClick={() => setCount(count + 1)}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Count: {count}
          </button>

          <button
            onClick={() => console.warn('Button clicked!')}
            style={{
              background: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Test Console Log
          </button>
        </div>

        <div style={{
          background: 'rgba(76, 175, 80, 0.2)',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <h3>✅ Diagnostic Results:</h3>
          <ul>
            <li>✅ React component rendering</li>
            <li>✅ JSX compilation working</li>
            <li>✅ Event handlers working</li>
            <li>✅ State updates working</li>
            <li>✅ Inline styles working</li>
          </ul>
        </div>

        <div style={{
          background: 'rgba(255, 193, 7, 0.2)',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <h3>🔍 Next Steps:</h3>
          <p>If you can see this, React is working correctly!</p>
          <p>The issue might be with:</p>
          <ul>
            <li>Complex component imports</li>
            <li>Context providers</li>
            <li>Error boundaries</li>
            <li>CSS/Tailwind configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MinimalApp;
