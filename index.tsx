
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for non-React errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, error);
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1>致命的なエラーが発生しました</h1>
        <pre>${message}\n${error?.stack || ''}</pre>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #00704A; color: white; border: none; border-radius: 5px; cursor: pointer;">再読み込み</button>
      </div>
    `;
  }
};

// Handle async errors (Gemini API etc.)
window.onunhandledrejection = function(event) {
  console.error("Unhandled Promise Rejection:", event.reason);
  // Optionally trigger a custom event or state update if we want React to show it
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
