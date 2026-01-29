
import { getFirebaseInstance } from './firebase';
import { StoreStamp } from '../types';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  writeBatch, 
  deleteDoc 
} from "firebase/firestore";

/**
 * ユーザー固有のスタンプデータをFirestoreから取得
 * ネットワークエラーでハングするのを防ぐため、タイムアウト処理を導入
 */
export const loadStampsFromDB = async (userId: string): Promise<StoreStamp[]> => {
  const fetchPromise = (async () => {
    try {
      const { db } = getFirebaseInstance();
      const stampsRef = collection(db, "users", userId, "stamps");
      const q = query(stampsRef, orderBy("lastVisitDate", "desc"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as StoreStamp));
    } catch (error) {
      console.error("Error loading stamps from Firestore:", error);
      return [];
    }
  })();

  // 10秒経っても応答がない場合は空配列で解決させる（無限ロード防止）
  const timeoutPromise = new Promise<StoreStamp[]>((resolve) => 
    setTimeout(() => {
      console.warn("Firestore fetch timeout: Returning empty collection.");
      resolve([]);
    }, 10000)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
};

/**
 * スタンプを一括保存 (更新/新規)
 */
export const saveStampsToDB = async (stamps: StoreStamp[], userId: string): Promise<void> => {
  if (!userId || userId === 'local' || userId === 'guest' || stamps.length === 0) return;

  try {
    const { db } = getFirebaseInstance();
    const batch = writeBatch(db);
    
    stamps.forEach(stamp => {
      const stampRef = doc(db, "users", userId, "stamps", stamp.id);
      batch.set(stampRef, { 
        ...stamp, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error saving stamps to Firestore:", error);
    // 保存エラーはユーザーに致命的な影響を与えないよう、ログのみに留める
  }
};

/**
 * 単一のスタンプを削除
 */
export const deleteStampFromDB = async (userId: string, stampId: string): Promise<void> => {
  if (!userId || userId === 'local' || userId === 'guest') return;

  try {
    const { db } = getFirebaseInstance();
    const stampRef = doc(db, "users", userId, "stamps", stampId);
    await deleteDoc(stampRef);
  } catch (error) {
    console.error("Error deleting stamp:", error);
  }
};
