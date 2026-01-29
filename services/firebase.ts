
// Fix: Use consolidated modular imports with the 'type' keyword to resolve "no exported member" errors in certain environments.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  type Auth
} from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  type Firestore
} from "firebase/firestore";

// 指定された優先順位で環境変数を取得 (ハイブリッド形式)
const getEnvVal = (key: string): string | undefined => {
  const viteKey = `VITE_FIREBASE_${key}`;
  // Fix: Strictly follow the mandatory hybrid environment variable access format as requested.
  const val = import.meta.env[viteKey] || (typeof process !== 'undefined' ? process.env[viteKey] : '');
  return val || undefined;
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
    
    // 【パフォーマンス改善】オフラインキャッシュを有効化
    // これにより、ネットワーク接続を待たずに前回取得したデータを即座に表示できます
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ 
        tabManager: persistentMultipleTabManager() 
      }),
      experimentalForceLongPolling: true, // ネットワークハング防止を継続
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
