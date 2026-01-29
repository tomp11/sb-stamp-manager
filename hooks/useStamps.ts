
import { useState, useEffect, useCallback, useRef } from 'react';
import { StoreStamp } from '../types';
import { loadStampsFromDB, saveStampsToDB, deleteStampFromDB } from '../services/storageService';

const STORAGE_KEY = 'my_store_passports';

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
    // 初回読み込み完了前は保存しない
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
      // デバウンスを少し短縮して体感速度を向上
      const timer = setTimeout(sync, 1000);
      return () => clearTimeout(timer);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps));
    }
  }, [stamps, userId, isLoading]);

  // ログイン時のマイグレーション
  const migrateLocalToCloud = useCallback(async (newUserId: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const localStamps: StoreStamp[] = JSON.parse(saved);
      if (localStamps.length > 0) {
        setIsSyncing(true);
        await saveStampsToDB(localStamps, newUserId);
        localStorage.removeItem(STORAGE_KEY);
        const mergedData = await loadStampsFromDB(newUserId);
        setStamps(mergedData);
        setIsSyncing(false);
      }
    } catch (e) {
      console.error("Migration error:", e);
      setIsSyncing(false);
    }
  }, []);

  const addStamps = useCallback((newStamps: StoreStamp[]) => {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    const normalizeName = (name: string) => 
      name.trim().normalize('NFKC').replace(/\s+/g, '').replace(/[（(]/g, '(').replace(/[）)]/g, ')');

    setStamps(prev => {
      const updatedList = [...prev];
      newStamps.forEach(newS => {
        const normalizedNew = normalizeName(newS.storeName);
        const existingIndex = updatedList.findIndex(s => normalizeName(s.storeName) === normalizedNew);

        if (existingIndex > -1) {
          const existing = updatedList[existingIndex];
          const newHasDate = !!newS.lastVisitDate;
          const newHasCount = newS.visitCount !== undefined;
          
          const isMoreRecent = newHasDate && (!existing.lastVisitDate || newS.lastVisitDate > existing.lastVisitDate);
          const isMoreVisits = newHasCount && (existing.visitCount === undefined || (newS.visitCount || 0) > (existing.visitCount || 0));

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
    // Firestoreからも即座に削除
    if (userId) {
      deleteStampFromDB(userId, id).catch(console.error);
    }
  }, [userId]);

  return { stamps, isLoading, isSyncing, addStamps, deleteStamp, migrateLocalToCloud };
};
