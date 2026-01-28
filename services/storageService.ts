
import { initFirebase } from './firebase';
import { StoreStamp } from '../types';

/**
 * ユーザー固有のスタンプデータをFirestoreから取得
 */
export const loadStampsFromDB = async (userId: string): Promise<StoreStamp[]> => {
  try {
    const { db } = await initFirebase();
    const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
    
    const stampsRef = collection(db, "users", userId, "stamps");
    const q = query(stampsRef, orderBy("lastVisitDate", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as StoreStamp));
  } catch (error) {
    console.error("Error loading stamps from Firestore:", error);
    throw new Error("データの読み込みに失敗しました。");
  }
};

/**
 * スタンプを一括保存
 */
export const saveStampsToDB = async (stamps: StoreStamp[], userId: string): Promise<void> => {
  if (!userId || userId === 'local' || userId === 'guest') return;

  try {
    const { db } = await initFirebase();
    const { doc, writeBatch } = await import("firebase/firestore");
    
    const batch = writeBatch(db);
    
    stamps.forEach(stamp => {
      const stampRef = doc(db, "users", userId, "stamps", stamp.id);
      batch.set(stampRef, { ...stamp, updatedAt: new Date().toISOString() }, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error saving stamps to Firestore:", error);
    throw new Error("データの保存に失敗しました。");
  }
};

/**
 * 単一のスタンプを削除
 */
export const deleteStampFromDB = async (userId: string, stampId: string): Promise<void> => {
  try {
    const { db } = await initFirebase();
    const { doc, deleteDoc } = await import("firebase/firestore");
    
    const stampRef = doc(db, "users", userId, "stamps", stampId);
    await deleteDoc(stampRef);
  } catch (error) {
    console.error("Error deleting stamp:", error);
    throw new Error("スタンプの削除に失敗しました。");
  }
};
