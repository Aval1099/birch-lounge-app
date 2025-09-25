import React from 'react';

/**
 * Minimal Test Component - Just to verify React is working
 */
const TestDemo = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '2rem', marginBottom: '1rem' }}>
        🎉 Hello World!
      </h1>
      <p style={{ color: '#666', fontSize: '1.2rem', marginBottom: '1rem' }}>
        React is working! This is a minimal test component.
      </p>
      <div style={{ 
        backgroundColor: '#007bff', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '8px',
        display: 'inline-block',
        marginBottom: '1rem'
      }}>
        Modern UI Test
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#333', marginBottom: '1rem' }}>Basic Test Elements:</h2>
        <button style={{
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          marginRight: '10px',
          cursor: 'pointer'
        }}>
          Test Button 1
        </button>
        <button style={{
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          marginRight: '10px',
          cursor: 'pointer'
        }}>
          Test Button 2
        </button>
        <button style={{
          backgroundColor: '#6f42c1',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Test Button 3
        </button>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <input 
          type="text" 
          placeholder="Test input field..."
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            width: '300px',
            fontSize: '1rem'
          }}
        />
      </div>
      <div style={{ marginTop: '2rem', color: '#28a745' }}>
        ✅ If you can see this, React and the build system are working correctly!
      </div>
    </div>
  );
};

export default TestDemo;
