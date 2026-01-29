
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
 */
export const loadStampsFromDB = async (userId: string): Promise<StoreStamp[]> => {
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
    // 認証エラーや設定ミスなどの場合は空配列を返してアプリを止めない
    return [];
  }
};

/**
 * スタンプを一括保存 (更新/新規)
 */
export const saveStampsToDB = async (stamps: StoreStamp[], userId: string): Promise<void> => {
  if (!userId || userId === 'local' || userId === 'guest') return;

  try {
    const { db } = getFirebaseInstance();
    const batch = writeBatch(db);
    
    stamps.forEach(stamp => {
      const stampRef = doc(db, "users", userId, "stamps", stamp.id);
      // updatedAtを追加してメタデータを更新
      batch.set(stampRef, { 
        ...stamp, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error saving stamps to Firestore:", error);
    throw error;
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
    throw error;
  }
};
