
export interface StoreStamp {
  id: string;
  userId: string; // 将来のFirebase移行を見据えた追加
  storeName: string;
  prefecture: string;
  address: string;
  lastVisitDate?: string;
  visitCount?: number;
  latitude?: number;
  longitude?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export type SortKey = 'visitCount' | 'lastVisitDate' | 'storeName' | 'prefecture';
export type SortOrder = 'asc' | 'desc';
