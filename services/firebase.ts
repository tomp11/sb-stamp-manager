import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Safe helper to access environment variables without ReferenceError
const safeGetEnv = (key: string): string | undefined => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch {
    return undefined;
  }
};

const firebaseConfig = {
  apiKey: safeGetEnv('FIREBASE_API_KEY'),
  authDomain: safeGetEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: safeGetEnv('FIREBASE_PROJECT_ID'),
  storageBucket: safeGetEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: safeGetEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: safeGetEnv('FIREBASE_APP_ID')
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Use combined imports and modern named export syntax for Firebase v9+ to fix recognition issues
if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig as any);
    auth = getAuth(app);
    db = getFirestore(app);
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

export { onAuthStateChanged, signInWithPopup, signOut };
export type { Auth, Firestore, FirebaseApp };
