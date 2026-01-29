// Fix: Consolidate modular Firebase imports to resolve "no exported member" errors in certain environments
import { initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  type Auth 
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// 指定された優先順位で環境変数を取得するヘルパー
const getEnv = (key: string): string | undefined => {
  const viteKey = `VITE_FIREBASE_${key}`;
  const directKey = `FIREBASE_${key}`;
  
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const val = (import.meta as any).env[viteKey];
    if (val) return val;
  }
  
  if (typeof process !== 'undefined' && process.env) {
    return process.env[viteKey] || process.env[directKey];
  }
  
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('API_KEY'),
  authDomain: getEnv('AUTH_DOMAIN'),
  projectId: getEnv('PROJECT_ID'),
  storageBucket: getEnv('STORAGE_BUCKET'),
  messagingSenderId: getEnv('MESSAGING_SENDER_ID'),
  appId: getEnv('APP_ID')
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
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}
console.log(firebaseConfig)
/**
 * Returns the shared Firebase instances for Auth, Firestore, and Google Provider.
 * Throws an error if configuration is invalid or services failed to start.
 */
export const getFirebaseInstance = () => {
  if (!isConfigValid || !auth || !db) {
    throw new Error("Firebase is not configured or failed to initialize.");
  }
  return { auth, db, googleProvider };
};

export const initFirebase = async () => getFirebaseInstance();

export { onAuthStateChanged, signInWithPopup, signOut };
export type { Auth, Firestore, FirebaseApp };