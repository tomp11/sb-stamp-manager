
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Shim for process.env in browser environment
// Fix: Added cast to any for window to avoid property 'process' does not exist error
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: {} } as any;
}

// Global error handler for non-React errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, error);
  const root = document.getElementById('root');
  if (root && (root.innerHTML === '' || root.innerHTML.includes('loading'))) {
    root.innerHTML = `
      <div style="padding: 40px; color: #333; font-family: sans-serif; text-align: center; background: white; min-height: 100vh;">
        <h1 style="color: #e53e3e;">エラーが発生しました</h1>
        <p>アプリの起動中に問題が発生しました。コンソールログを確認してください。</p>
        <pre style="text-align: left; background: #f7fafc; padding: 20px; border-radius: 8px; overflow: auto; max-width: 800px; margin: 20px auto;">${message}\n${error?.stack || ''}</pre>
        <button onclick="location.reload()" style="padding: 12px 24px; background: #00704A; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">再読み込み</button>
      </div>
    `;
  }
};

window.onunhandledrejection = function(event) {
  console.error("Unhandled Promise Rejection:", event.reason);
};

console.log("App initializing...");

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
