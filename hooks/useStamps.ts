
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

  // データの取得と移行のフローを高速化
  const initializeData = useCallback(async (currentUserId: string | null) => {
    // ログイン状況にかかわらず、まずローカルストレージの内容を仮表示（LCPの向上）
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialLocalStamps: StoreStamp[] = [];
    if (saved) {
      try {
        initialLocalStamps = JSON.parse(saved);
        if (!currentUserId) {
          setStamps(initialLocalStamps);
          setIsLoading(false); // ゲストならここでロード終了
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

    // ログイン済みの場合のみクラウド同期を実行
    setIsLoading(true);
    try {
      // クラウドから取得（Firebaseの永続性キャッシュが効いている場合は即座に返る）
      const cloudStamps = await loadStampsFromDB(currentUserId);
      
      // 移行ロジック（ローカルに未同期データがある場合）
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
    }
  }, []);

  // userIdが確定したタイミングで走る
  useEffect(() => {
    initializeData(userId);
  }, [userId, initializeData]);

  // クラウド同期（デバウンス処理）
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

    const timer = setTimeout(sync, 2000); 
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
      
      // ゲストモード時は即座にlocalStorageに保存
      if (!userId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      }
      return [...updatedList];
    });

    return { added, updated, skipped };
  }, [userId]);

  const deleteStamp = useCallback((id: string) => {
    setStamps(prev => {
      const newList = prev.filter(s => s.id !== id);
      if (!userId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      }
      return newList;
    });
    if (userId) {
      deleteStampFromDB(userId, id).catch(console.error);
    }
  }, [userId]);

  return { stamps, isLoading, isSyncing, addStamps, deleteStamp };
};
