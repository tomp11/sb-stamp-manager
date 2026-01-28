
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Vite環境 (import.meta.env) と一般的な Node 形式 (process.env) の互換性を確保するためのシム
 */
const setupEnvShim = () => {
  if (typeof window === 'undefined') return;

  const anyWin = window as any;
  if (!anyWin.process) {
    anyWin.process = { env: {} };
  }

  try {
    // Vite (import.meta.env) が存在する場合、その内容を process.env に統合
    // @ts-ignore
    const viteEnv = import.meta.env;
    if (viteEnv) {
      // VITE_ で始まる変数をすべて process.env にコピー
      Object.assign(anyWin.process.env, viteEnv);
      
      // Gemini API 向けの特別なマッピング
      // SDK は process.env.API_KEY を期待するため、VITE_GEMINI_API_KEY などを転送
      const apiKey = viteEnv.VITE_GEMINI_API_KEY || viteEnv.VITE_API_KEY || viteEnv.API_KEY;
      if (apiKey && !anyWin.process.env.API_KEY) {
        anyWin.process.env.API_KEY = apiKey;
      }
    }
  } catch (e) {
    console.debug("Env shim failed (not a Vite environment?):", e);
  }
};

// アプリ起動前にシムを確実に実行
setupEnvShim();

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

console.log("App initialized with environment shim.");

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
