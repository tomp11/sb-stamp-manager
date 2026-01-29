
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
  const isInitialLoad = useRef(true);

  // データの取得と移行を一つのフローに統合
  const initializeData = useCallback(async (currentUserId: string | null) => {
    setIsLoading(true);
    try {
      if (currentUserId) {
        // 1. まずクラウドから最新データを取得
        const cloudStamps = await loadStampsFromDB(currentUserId);
        
        // 2. ローカルに未同期のデータがあるか確認
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const localStamps: StoreStamp[] = JSON.parse(saved);
          if (localStamps.length > 0) {
            // 移行が必要な場合のみ実行
            const cloudMap = new Map();
            cloudStamps.forEach(s => cloudMap.set(normalizeStoreName(s.storeName), s));

            const stampsToUpload: StoreStamp[] = [];
            const mergedList = [...cloudStamps];
            
            localStamps.forEach(localS => {
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
            setIsLoading(false);
            return;
          }
        }
        setStamps(cloudStamps);
      } else {
        // ゲストモードの場合
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setStamps(JSON.parse(saved));
          } catch (e) {
            setStamps([]);
          }
        }
      }
    } catch (error) {
      console.error("Data initialization error:", error);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  // userIdが確定したタイミングで一回だけ走る
  useEffect(() => {
    initializeData(userId);
  }, [userId, initializeData]);

  // 定期的な自動保存（クラウド同期）
  useEffect(() => {
    if (isLoading || isInitialLoad.current || !userId) return;

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

    const timer = setTimeout(sync, 2000); // 頻度を少し下げて負荷を軽減
    return () => clearTimeout(timer);
  }, [stamps, userId, isLoading]);

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

  return { stamps, isLoading, isSyncing, addStamps, deleteStamp };
};
