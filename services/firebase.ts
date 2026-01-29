
// Fix: Split type and value imports to resolve "no exported member" errors in certain environments.
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut
} from "firebase/auth";
import type { Auth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

// Fix: Use hybrid environment variable access as per project guidelines (VITE_ prefix is mandatory).
const getEnvVal = (key: string): string | undefined => {
  const viteKey = `VITE_FIREBASE_${key}`;
  const directKey = `FIREBASE_${key}`;
  
  // Explicit hybrid check for compatibility between Vite and other environments
  const viteVal = (import.meta as any).env?.[viteKey];
  const procVal = typeof process !== 'undefined' ? (process as any).env?.[viteKey] || (process as any).env?.[directKey] : undefined;
  
  return viteVal || procVal;
};

const firebaseConfig = {
  apiKey: getEnvVal('API_KEY'),
  authDomain: getEnvVal('AUTH_DOMAIN'),
  projectId: getEnvVal('PROJECT_ID'),
  storageBucket: getEnvVal('STORAGE_BUCKET'),
  messagingSenderId: getEnvVal('MESSAGING_SENDER_ID'),
  appId: getEnvVal('APP_ID')
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
    
    // 【重要】ネットワークのハングを防止する設定
    // experimentalForceLongPolling: true は、WebSocketsが不安定な環境で
    // Firestoreの接続を劇的に安定させ、読み込みの「止まり」を解消します。
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      experimentalForceLongPolling: true, 
      useFetchStreams: false 
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

export { onAuthStateChanged, signInWithPopup, signOut };
export type { Auth, Firestore, FirebaseApp };
