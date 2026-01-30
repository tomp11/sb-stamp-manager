
import { useState, useEffect, useCallback, useRef } from 'react';
import { StoreStamp } from '../types';
import { loadStampsFromDB, saveStampsToDB, deleteStampFromDB } from '../services/storageService';

const STORAGE_KEY = 'my_store_passports';

const normalizeStoreName = (name: string) => 
  (name || '').trim().normalize('NFKC').replace(/\s+/g, '').replace(/[（(]/g, '(').replace(/[）)]/g, ')');

export const useStamps = (userId: string | null) => {
  const [stamps, setStamps] = useState<StoreStamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // 未同期の変更があるかどうか
  const isInitialLoad = useRef(true);

  // データの取得と移行のフロー
  const initializeData = useCallback(async (currentUserId: string | null) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialLocalStamps: StoreStamp[] = [];
    if (saved) {
      try {
        initialLocalStamps = JSON.parse(saved);
        if (!currentUserId) {
          setStamps(initialLocalStamps);
          setIsLoading(false);
          isInitialLoad.current = false;
        }
      } catch (e) {
        console.error("Local storage parse error", e);
      }
    } else if (!currentUserId) {
      setIsLoading(false);
      isInitialLoad.current = false;
    }

    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const cloudStamps = await loadStampsFromDB(currentUserId);
      
      if (initialLocalStamps.length > 0) {
        const cloudMap = new Map();
        cloudStamps.forEach(s => cloudMap.set(normalizeStoreName(s.storeName), s));

        const stampsToUpload: StoreStamp[] = [];
        const mergedList = [...cloudStamps];
        
        initialLocalStamps.forEach(localS => {
          const normalizedName = normalizeStoreName(localS.storeName);
          const existingCloud = cloudMap.get(normalizedName);

          if (existingCloud) {
            const localDate = localS.lastVisitDate || "";
            const cloudDate = existingCloud.lastVisitDate || "";
            if (localDate > cloudDate || (localS.visitCount || 0) > (existingCloud.visitCount || 0)) {
              const updated = { ...existingCloud, ...localS, id: existingCloud.id };
              stampsToUpload.push(updated);
              const idx = mergedList.findIndex(s => s.id === existingCloud.id);
              if (idx > -1) mergedList[idx] = updated;
            }
          } else {
            const newStamp = { ...localS, userId: currentUserId };
            stampsToUpload.push(newStamp);
            mergedList.push(newStamp);
          }
        });

        if (stampsToUpload.length > 0) {
          await saveStampsToDB(stampsToUpload, currentUserId);
        }
        localStorage.removeItem(STORAGE_KEY);
        setStamps(mergedList);
      } else {
        setStamps(cloudStamps);
      }
    } catch (error) {
      console.error("Cloud data initialization error:", error);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
      setIsDirty(false);
    }
  }, []);

  useEffect(() => {
    initializeData(userId);
  }, [userId, initializeData]);

  // 手動同期関数
  const syncToCloud = useCallback(async () => {
    if (!userId || isSyncing) return;
    setIsSyncing(true);
    try {
      await saveStampsToDB(stamps, userId);
      setIsDirty(false);
    } catch (e) {
      console.error("Cloud sync error:", e);
      throw e;
    } finally {
      setIsSyncing(false);
    }
  }, [stamps, userId, isSyncing]);

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
      
      if (!userId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      } else {
        setIsDirty(true); // ログイン中は未同期フラグを立てる
      }
      return [...updatedList];
    });

    return { added, updated, skipped };
  }, [userId]);

  const updateStamp = useCallback((updatedStamp: StoreStamp) => {
    setStamps(prev => {
      const newList = prev.map(s => s.id === updatedStamp.id ? updatedStamp : s);
      if (!userId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      } else {
        // 【改善】ログイン済みの場合は、即座にFirebaseへ自動同期を試みる
        saveStampsToDB([updatedStamp], userId).catch(err => {
          console.error("Auto-sync failed on update:", err);
          setIsDirty(true); // 同期に失敗した場合は未同期フラグを立てる（後で手動同期可能）
        });
      }
      return newList;
    });
  }, [userId]);

  const deleteStamp = useCallback((id: string) => {
    setStamps(prev => {
      const newList = prev.filter(s => s.id !== id);
      if (!userId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      } else {
        setIsDirty(true); 
      }
      return newList;
    });
    // 削除も即座に反映
    if (userId) {
      deleteStampFromDB(userId, id).catch(console.error);
    }
  }, [userId]);

  return { stamps, isLoading, isSyncing, isDirty, addStamps, updateStamp, deleteStamp, syncToCloud };
};
