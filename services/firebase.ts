
// Use namespace imports to resolve "no exported member" issues in some environments
import * as firebaseApp from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";

// Extract modular functions from namespaces
const { initializeApp } = firebaseApp;
const { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } = firebaseAuth;
const { getFirestore } = firebaseFirestore;

// Export types correctly
export type FirebaseApp = firebaseApp.FirebaseApp;
export type Auth = firebaseAuth.Auth;
export type Firestore = firebaseFirestore.Firestore;

export interface FirebaseInstance {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  googleProvider: GoogleAuthProvider;
}

let instance: FirebaseInstance | null = null;

// Initialize Firebase with environment variables
export const initFirebase = async (): Promise<FirebaseInstance> => {
  if (instance) return instance;

  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Firebaseの環境変数が設定されていません。ゲストモードで継続します。");
  }

  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();

    instance = { app, auth, db, googleProvider };
    return instance;
  } catch (error: any) {
    console.error("Firebase Initialization Error:", error);
    throw error;
  }
};

// Re-export auth functions to be used by App.tsx
export { onAuthStateChanged, signInWithPopup, signOut };

export const firebaseInitError: string | null = null; // 後方互換性のため維持
