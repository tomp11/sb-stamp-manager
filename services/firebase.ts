
// Fix: Consolidated imports and using standard modular syntax to resolve "no exported member" issues.
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  Auth
} from "firebase/auth";
import { initializeFirestore, Firestore } from "firebase/firestore";

// Fix: Use mandatory hybrid environment variable access format as per project guidelines.
const getEnvVal = (key: string): string | undefined => {
  const viteKey = `VITE_FIREBASE_${key}`;
  
  // Explicit hybrid check for compatibility between Vite and other environments
  const val = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) || 
              (typeof process !== 'undefined' && process.env && process.env[viteKey]) || 
              undefined;
  
  return val;
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
