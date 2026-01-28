
// Use named imports to properly resolve symbols and types from the Firebase SDK
// Fix: Separated value and type imports to resolve resolution issues in certain environments where inline 'type' imports are not supported or cause member resolution failure.
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

// Export types correctly
export type { FirebaseApp, Auth, Firestore };

export interface FirebaseInstance {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  // Named import of GoogleAuthProvider class is now correctly recognized as a type for the instance
  googleProvider: GoogleAuthProvider;
}

let instance: FirebaseInstance | null = null;

// Initialize Firebase with environment variables
export const initFirebase = async (): Promise<FirebaseInstance> => {
  if (instance) return instance;

  // Safe access to process.env
  // Fix: Cast process to any to safely check for env in various browser/build environments
  const env = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env : {};

  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
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
