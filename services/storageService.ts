
import { getFirebaseInstance } from './firebase';
import { StoreStamp } from '../types';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  deleteDoc
} from "firebase/firestore";

const SYNC_TIMEOUT_MS = 15000;
const BATCH_MAX_OPS = 450; // Firestoreの上限(500)に余裕を持たせる

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let t: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (t) clearTimeout(t);
  }
};

/**
 * ユーザー固有のスタンプデータをFirestoreから取得
 * ネットワークエラーでハングするのを防ぐため、タイムアウト処理を導入
 */
export const loadStampsFromDB = async (userId: string): Promise<StoreStamp[]> => {
  const fetchPromise = (async () => {
    try {
      const { db } = getFirebaseInstance();
      const stampsRef = collection(db, "users", userId, "stamps");
      // 復元は「欠けない」ことが最優先なので、常に全件取得→クライアント側ソートにする
      const querySnapshot = await getDocs(stampsRef);
      const docs = querySnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as StoreStamp));
      console.info(`[sync] loadStampsFromDB: userId=${userId}, docs=${docs.length}`);
      console.info(`[sync] loadStampsFromDB docIds:`, querySnapshot.docs.map((d) => d.id));
      const missingStoreName = docs.filter((s) => !s?.storeName).length;
      const missingVisitCount = docs.filter((s) => s?.visitCount === undefined).length;
      const missingLastVisitDate = docs.filter((s) => !s?.lastVisitDate).length;
      if (missingStoreName || missingVisitCount || missingLastVisitDate) {
        console.info(
          `[sync] loadStampsFromDB missing fields: storeName=${missingStoreName}, visitCount=${missingVisitCount}, lastVisitDate=${missingLastVisitDate}`
        );
      }
      // 表示順のためのクライアントソート（空は末尾寄せ）
      docs.sort((a, b) => {
        const da = (a?.lastVisitDate ?? '') as any;
        const dbb = (b?.lastVisitDate ?? '') as any;
        // 文字列以外（Timestamp等）は安全側で後ろに回す
        const sa = typeof da === 'string' ? da : '';
        const sb = typeof dbb === 'string' ? dbb : '';
        if (sa < sb) return 1;
        if (sa > sb) return -1;
        return 0;
      });
      return docs;
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
    const { db, auth } = getFirebaseInstance();
    const startedAt = performance.now();
    console.info(`[sync] saveStampsToDB start: stamps=${stamps.length}, online=${typeof navigator !== 'undefined' ? navigator.onLine : 'n/a'}`);

    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      // Firestoreが認証トークンを取れずに待ち続けるケースを避け、原因を明確化
      throw new Error("[sync] auth.currentUser is null (not signed in yet?)");
    }
    if (currentUid !== userId) {
      throw new Error(`[sync] uid mismatch: auth=${currentUid} param=${userId}`);
    }

    // デバッグ：ID衝突（上書き）を検出
    const idCounts = new Map<string, number>();
    for (const s of stamps) {
      const id = String(s?.id ?? '');
      if (!id) continue;
      idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }
    const dupIds = [...idCounts.entries()].filter(([, c]) => c > 1);
    if (dupIds.length > 0) {
      console.warn(`[sync] duplicate stamp ids detected: ${dupIds.length}`, dupIds.slice(0, 10));
    }

    const groups = chunk(stamps, BATCH_MAX_OPS);
    for (let i = 0; i < groups.length; i++) {
      const batch = writeBatch(db);
      const group = groups[i];
      group.forEach((stamp) => {
        if (!stamp.id) {
          throw new Error(`[sync] stamp.id is missing (storeName=${stamp.storeName ?? ''})`);
        }
        const stampRef = doc(db, "users", userId, "stamps", stamp.id);
        batch.set(
          stampRef,
          {
            ...stamp,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });

      console.info(`[sync] committing batch ${i + 1}/${groups.length}: ops=${group.length}`);
      await withTimeout(batch.commit(), SYNC_TIMEOUT_MS, `[sync] batch.commit(${i + 1}/${groups.length})`);
    }

    const ms = Math.round(performance.now() - startedAt);
    console.info(`[sync] saveStampsToDB done: ${ms}ms`);
  } catch (error) {
    console.error("Error saving stamps to Firestore:", error);
    // ここで握りつぶすとUIが「同期完了」扱いになり切り分けできないため呼び出し元へ伝播
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
  }
};
