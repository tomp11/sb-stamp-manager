// Fix: Use separate import statements for values and types to resolve export member errors
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// インスタンスの初期化
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

// 環境変数が存在する場合のみ初期化を実行
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

/**
 * Firebaseインスタンスを即座に取得するための関数
 * すでに初期化済みの場合は即座に返し、未初期化の場合はエラーを投げるかnullを返す
 */
export const getFirebaseInstance = () => {
  if (!isConfigValid) throw new Error("Firebase configuration is missing.");
  if (!auth || !db) throw new Error("Firebase services are not initialized.");
  return { auth, db, googleProvider };
};

// 互換性のための initFirebase (非同期を維持しつつ内部で同期取得)
export const initFirebase = async () => getFirebaseInstance();

// 各種Authメソッドと型を再エクスポート
export { onAuthStateChanged, signInWithPopup, signOut };
export type { Auth, Firestore, FirebaseApp };