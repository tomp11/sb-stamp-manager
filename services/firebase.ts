
// Fix: Consolidate modular imports to ensure correct member resolution for Firebase v9+ in TypeScript.
import { initializeApp, type FirebaseApp } from 'firebase/app';
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
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  type Firestore,
} from 'firebase/firestore';

// 指定された優先順位で環境変数を取得 (ハイブリッド形式)
// Fix: Strictly follow the mandatory hybrid environment variable access format as requested for all configuration keys.
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

    // 【パフォーマンス改善】オフラインキャッシュを有効化
    try {
      // Fix: Use mandatory hybrid environment variable access for debug logs.
      const debugVal = (import.meta as any).env?.VITE_FIRESTORE_DEBUG || (typeof process !== 'undefined' ? process.env.VITE_FIRESTORE_DEBUG : '');
      const debugEnabled = String(debugVal || '').toLowerCase() === 'true';
      setLogLevel(debugEnabled ? 'debug' : 'warn');
    } catch {
      // no-op
    }
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
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
export type { Auth, Firestore, FirebaseApp };
