
// Fix: Consolidated modular imports to resolve member resolution errors.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  type Auth
} from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";

// 指定された優先順位で環境変数を取得
const getEnvVal = (key: string): string | undefined => {
  const viteKey = `VITE_FIREBASE_${key}`;
  const directKey = `FIREBASE_${key}`;
  return (import.meta as any).env?.[viteKey] || 
         (process as any).env?.[viteKey] || 
         (process as any).env?.[directKey];
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
    // ネットワークの安定性を高める設定を追加
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
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
