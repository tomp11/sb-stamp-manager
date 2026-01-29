
// Fix: Separated type and value imports to resolve "no exported member" errors in modular Firebase SDK
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

/**
 * AI Studio (process.env) と Vite (import.meta.env) の両方から環境変数を安全に取得するためのヘルパー
 */
const getEnvVar = (key: string): string | undefined => {
  // process.env をチェック (AI Studio / Node環境)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // import.meta.env をチェック (Vite環境)
  // key に VITE_ プレフィックスを付けて再試行
  const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  return undefined;
};

// 安全な Firebase 設定の構築
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID')
};

// インスタンスの初期化
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

// 最小限の必須項目がある場合のみ初期化を実行
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig as any);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
} else {
  console.warn("Firebase configuration is missing or incomplete. Cloud features will be disabled.");
}

/**
 * Firebaseインスタンスを取得するための関数
 */
export const getFirebaseInstance = () => {
  if (!isConfigValid || !auth || !db) {
    throw new Error("Firebase is not configured or failed to initialize.");
  }
  return { auth, db, googleProvider };
};

// 互換性のための initFirebase
export const initFirebase = async () => getFirebaseInstance();

// 各種Authメソッドと型を再エクスポート
export { onAuthStateChanged, signInWithPopup, signOut };
export type { Auth, Firestore, FirebaseApp };
