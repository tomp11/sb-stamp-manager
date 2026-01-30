
// Fix: Use consolidated modular imports with the 'type' keyword to resolve "no exported member" errors in certain environments.
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  setPersistence,
  browserLocalPersistence,
  type Auth
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  type Firestore
} from "firebase/firestore";

// 指定された優先順位で環境変数を取得 (ハイブリッド形式)
const getEnvVal = (key: string): string | undefined => {
  const viteKey = `VITE_FIREBASE_${key}`;
  // Fix: Strictly follow the mandatory hybrid environment variable access format as requested.
  const val = (import.meta as any).env?.[viteKey] || (typeof process !== 'undefined' ? process.env[viteKey] : '');
  return val || undefined;
};

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_API_KEY : ''),
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_AUTH_DOMAIN : ''),
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_PROJECT_ID : ''),
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_STORAGE_BUCKET : ''),
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID : ''),
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || (typeof process !== 'undefined' ? process.env.VITE_FIREBASE_APP_ID : '')
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig as any);
    auth = getAuth(app);
    // 認証状態をタブ/リロード間で保持（Safari等でも安定しやすい）
    // init時に1回だけ設定しておく
    setPersistence(auth, browserLocalPersistence).catch((e) => {
      console.warn("Auth persistence setup failed:", e);
    });

    // 認証状態をタブ/リロード間で保持（Safari等でも安定しやすい）
    // init時に1回だけ設定しておく
    setPersistence(auth, browserLocalPersistence).catch((e) => {
      console.warn("Auth persistence setup failed:", e);
    });

    // 【パフォーマンス改善】オフラインキャッシュを有効化
    // これにより、ネットワーク接続を待たずに前回取得したデータを即座に表示できます
    // Firestoreの内部通信ログ（切り分け用）
    try {
      const env = (import.meta as any).env || {};
      // 通常はノイズが多いので warn に抑える。必要な時だけ .env で有効化する。
      // VITE_FIRESTORE_DEBUG=true のときのみ debug
      const debugEnabled = String(env.VITE_FIRESTORE_DEBUG || '').toLowerCase() === 'true';
      setLogLevel(debugEnabled ? 'debug' : 'warn');
    } catch {
      // no-op
    }
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalForceLongPolling: true, // ネットワークハング防止を継続
    });
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

export const getFirebaseInstance = () => {
  if (!isConfigValid || !auth || !db) {
    throw new Error("Firebase is not configured or failed to initialize.");
  }
  return { auth, db, googleProvider };
};

export const initFirebase = async () => getFirebaseInstance();

export {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  setPersistence,
  browserLocalPersistence,
};
export {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  setPersistence,
  browserLocalPersistence,
};
export type { Auth, Firestore, FirebaseApp };
