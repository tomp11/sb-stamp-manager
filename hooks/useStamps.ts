
import { useState, useEffect, useCallback, useRef } from 'react';
import { StoreStamp } from '../types';
import { loadStampsFromDB, saveStampsToDB, deleteStampFromDB } from '../services/storageService';

const STORAGE_KEY = 'my_store_passports';

// 店舗名の正規化（名寄せ用）
const normalizeStoreName = (name: string) => 
  (name || '').trim().normalize('NFKC').replace(/\s+/g, '').replace(/[（(]/g, '(').replace(/[）)]/g, ')');

export const useStamps = (userId: string | null) => {
  const [stamps, setStamps] = useState<StoreStamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isInitialLoad = useRef(true);

  // 初回読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (userId) {
        // クラウドモード
        const cloudData = await loadStampsFromDB(userId);
        setStamps(cloudData);
      } else {
        // ゲストモード（LocalStorage）
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setStamps(JSON.parse(saved));
          } catch (e) {
            console.error("LocalStorage parse error:", e);
            setStamps([]);
          }
        }
      }
      setIsLoading(false);
      isInitialLoad.current = false;
    };

    loadData();
  }, [userId]);

  // データ変更時の保存処理（同期）
  useEffect(() => {
    if (isLoading || isInitialLoad.current) return;

    if (userId) {
      const sync = async () => {
        setIsSyncing(true);
        try {
          await saveStampsToDB(stamps, userId);
        } catch (e) {
          console.error("Cloud sync error:", e);
        } finally {
          setIsSyncing(false);
        }
      };
      const timer = setTimeout(sync, 1000);
      return () => clearTimeout(timer);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps));
    }
  }, [stamps, userId, isLoading]);

  /**
   * スマート・マイグレーション: ログイン時のLocalからCloudへのデータ引き継ぎ
   */
  const migrateLocalToCloud = useCallback(async (newUserId: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const localStamps: StoreStamp[] = JSON.parse(saved);
      if (localStamps.length === 0) return;

      setIsSyncing(true);
      
      // 1. クラウド側の既存データを取得してマージの準備
      const cloudStamps = await loadStampsFromDB(newUserId);
      const cloudMap = new Map();
      cloudStamps.forEach(s => cloudMap.set(normalizeStoreName(s.storeName), s));

      const stampsToUpload: StoreStamp[] = [];
      
      // 2. LocalデータをCloudデータと比較してマージ
      localStamps.forEach(localS => {
        const normalizedName = normalizeStoreName(localS.storeName);
        const existingCloud = cloudMap.get(normalizedName);

        if (existingCloud) {
          // すでにクラウドにある場合、より「進んでいる」データを採用
          const localDate = localS.lastVisitDate || "";
          const cloudDate = existingCloud.lastVisitDate || "";
          const localCount = localS.visitCount || 0;
          const cloudCount = existingCloud.visitCount || 0;

          if (localDate > cloudDate || localCount > cloudCount) {
            // Localの方が新しい、または訪問回数が多い場合は更新対象
            stampsToUpload.push({
              ...existingCloud,
              ...localS,
              id: existingCloud.id // Cloud側のIDを維持
            });
          }
        } else {
          // クラウドにない場合は新規追加
          stampsToUpload.push({ ...localS, userId: newUserId });
        }
      });

      // 3. 必要なデータのみFirestoreへ保存
      if (stampsToUpload.length > 0) {
        await saveStampsToDB(stampsToUpload, newUserId);
      }

      // 4. Firestore保存成功後のみLocalStorageをクリア (Atomic cleanup)
      localStorage.removeItem(STORAGE_KEY);
      
      // 5. 最新の統合データを画面に反映
      const finalData = await loadStampsFromDB(newUserId);
      setStamps(finalData);
      
      console.log(`Migration complete: ${stampsToUpload.length} stamps integrated.`);
    } catch (e) {
      console.error("Migration error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const addStamps = useCallback((newStamps: StoreStamp[]) => {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    setStamps(prev => {
      const updatedList = [...prev];
      newStamps.forEach(newS => {
        const normalizedNew = normalizeStoreName(newS.storeName);
        const existingIndex = updatedList.findIndex(s => normalizeStoreName(s.storeName) === normalizedNew);

        if (existingIndex > -1) {
          const existing = updatedList[existingIndex];
          const isMoreRecent = (newS.lastVisitDate || "") > (existing.lastVisitDate || "");
          const isMoreVisits = (newS.visitCount || 0) > (existing.visitCount || 0);

          if (isMoreRecent || isMoreVisits) {
            updatedList[existingIndex] = {
              ...existing,
              ...newS,
              visitCount: isMoreVisits ? newS.visitCount : existing.visitCount,
              lastVisitDate: isMoreRecent ? newS.lastVisitDate : existing.lastVisitDate,
              id: existing.id
            };
            updated++;
          } else {
            skipped++;
          }
        } else {
          updatedList.unshift({ ...newS, userId: userId || 'guest' });
          added++;
        }
      });
      return [...updatedList];
    });

    return { added, updated, skipped };
  }, [userId]);

  const deleteStamp = useCallback((id: string) => {
    setStamps(prev => prev.filter(s => s.id !== id));
    if (userId) {
      deleteStampFromDB(userId, id).catch(console.error);
    }
  }, [userId]);

  return { stamps, isLoading, isSyncing, addStamps, deleteStamp, migrateLocalToCloud };
};
