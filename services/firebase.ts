
// Fix: Use consolidated import statements to resolve "no exported member" errors in modular Firebase SDK
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Safely access env variables using optional chaining to prevent "Cannot read properties of undefined"
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID
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
} else {
  console.warn("Firebase configuration is missing or incomplete. Some features like Cloud Sync will be unavailable.");
}

/**
 * Firebaseインスタンスを即座に取得するための関数
 */
export const getFirebaseInstance = () => {
  if (!isConfigValid) throw new Error("Firebase configuration is missing.");
  if (!auth || !db) throw new Error("Firebase services are not initialized.");
  return { auth, db, googleProvider };
};

// 互換性のための initFirebase
export const initFirebase = async () => getFirebaseInstance();

// 各種Authメソッドと型を再エクスポート
export { onAuthStateChanged, signInWithPopup, signOut };
export type { Auth, Firestore, FirebaseApp };
