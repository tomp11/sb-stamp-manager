
// 環境変数のシム（Shim）処理
// ESモジュールのインポート順序に関わらず、最初に実行されるように考慮しています
if (typeof window !== 'undefined') {
  const global = window as any;
  if (typeof global.process === 'undefined') {
    global.process = { env: {} };
  }
  
  // Vite 環境変数を process.env に統合
  try {
    // @ts-ignore
    const env = (import.meta as any).env;
    if (env) {
      Object.keys(env).forEach(key => {
        const cleanKey = key.replace('VITE_', '');
        if (!global.process.env[cleanKey]) {
          global.process.env[cleanKey] = env[key];
        }
        global.process.env[key] = env[key];
      });
      
      // 特殊ケース: VITE_GEMINI_API_KEY を API_KEY にマッピング
      if (env.VITE_GEMINI_API_KEY && !global.process.env.API_KEY) {
        global.process.env.API_KEY = env.VITE_GEMINI_API_KEY;
      }
    }
  } catch (e) {
    // import.meta が利用できない環境（AI Studio 等）では無視
  }
}

export {};
