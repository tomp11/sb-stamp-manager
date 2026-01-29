import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for non-React errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, error);
  const root = document.getElementById('root');
  if (root && (root.innerHTML === '' || root.innerHTML.includes('loading'))) {
    root.innerHTML = `
      <div style="padding: 40px; color: #333; font-family: sans-serif; text-align: center; background: white; min-height: 100vh;">
        <h1 style="color: #e53e3e; font-size: 24px; font-weight: bold;">アプリを起動できません</h1>
        <p style="margin-top: 10px;">環境変数やブラウザの設定を確認してください。</p>
        <pre style="text-align: left; background: #f7fafc; padding: 20px; border-radius: 8px; overflow: auto; max-width: 800px; margin: 20px auto; font-size: 12px; border: 1px solid #edf2f7;">${message}</pre>
        <button onclick="location.reload()" style="padding: 12px 24px; background: #00704A; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 20px;">再試行</button>
      </div>
    `;
  }
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
