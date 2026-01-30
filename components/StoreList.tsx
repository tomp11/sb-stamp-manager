
import React, { useState } from 'react';
import { StoreStamp, SortKey, SortOrder } from '../types';
import { Search, ChevronDown, ChevronUp, MapPin, Calendar, Hash, Trash2, Coffee, HelpCircle, ArrowUpDown, Edit3, X, Save } from 'lucide-react';

interface StoreListProps {
  stamps: StoreStamp[];
  onDelete: (id: string) => void;
  onUpdate: (stamp: StoreStamp) => void;
}

const StoreList: React.FC<StoreListProps> = ({ stamps, onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastVisitDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editingStamp, setEditingStamp] = useState<StoreStamp | null>(null);

  const filteredStamps = (stamps || [])
    .filter((s) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      const store = (s?.storeName ?? '').toLowerCase();
      const pref = (s?.prefecture ?? '').toLowerCase();
      return store.includes(term) || pref.includes(term);
    })
    .sort((a, b) => {
      const valA = a?.[sortKey] ?? (sortOrder === 'asc' ? 'zzzz' : '0000');
      const valB = b?.[sortKey] ?? (sortOrder === 'asc' ? 'zzzz' : '0000');
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortIndicator = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'lastVisitDate', label: '訪問日順' },
    { key: 'visitCount', label: '回数順' },
    { key: 'storeName', label: '店舗名順' },
    { key: 'prefecture', label: '都道府県順' },
  ];

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStamp) {
      onUpdate(editingStamp);
      setEditingStamp(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 編集モーダル */}
      {editingStamp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#00704A] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl leading-tight">店舗情報を編集</h3>
                <p className="text-white/70 text-xs mt-1">マイストアパスポートの詳細を修正します</p>
              </div>
              <button onClick={() => setEditingStamp(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">店舗名</label>
                <input
                  autoFocus
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00704A]/20 focus:border-[#00704A] font-bold"
                  value={editingStamp.storeName}
                  onChange={e => setEditingStamp({ ...editingStamp, storeName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">都道府県</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00704A]/20 focus:border-[#00704A]"
                    value={editingStamp.prefecture}
                    onChange={e => setEditingStamp({ ...editingStamp, prefecture: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">訪問回数</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00704A]/20 focus:border-[#00704A] font-black text-[#00704A]"
                    value={editingStamp.visitCount || ''}
                    onChange={e => setEditingStamp({ ...editingStamp, visitCount: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">住所</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00704A]/20 focus:border-[#00704A] text-sm"
                  value={editingStamp.address}
                  onChange={e => setEditingStamp({ ...editingStamp, address: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">最終訪問日</label>
                <input
                  type="text"
                  placeholder="YYYY/MM/DD"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00704A]/20 focus:border-[#00704A]"
                  value={editingStamp.lastVisitDate || ''}
                  onChange={e => setEditingStamp({ ...editingStamp, lastVisitDate: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStamp(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#00704A] text-white rounded-2xl font-bold hover:bg-[#005c3d] transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 検索・ソートヘッダー */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="店舗名・都道府県で検索..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00704A]/20 focus:border-[#00704A]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex sm:hidden items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              className="text-xs font-bold bg-transparent outline-none text-gray-600 appearance-none pr-4"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {sortOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="ml-1">
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-[#00704A]" /> : <ChevronDown className="w-4 h-4 text-[#00704A]" />}
            </button>
          </div>

          <p className="text-sm text-gray-500 font-medium whitespace-nowrap">
            登録数: <span className="text-[#00704A] font-bold">{filteredStamps.length}件</span>
          </p>
        </div>
      </div>

      {/* デスクトップ表示: テーブル形式 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('storeName')}>
                <div className="flex items-center gap-1 whitespace-nowrap">店舗名 <SortIndicator k="storeName" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('prefecture')}>
                <div className="flex items-center gap-1 whitespace-nowrap">都道府県 <SortIndicator k="prefecture" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 text-center" onClick={() => toggleSort('visitCount')}>
                <div className="flex items-center justify-center gap-1 whitespace-nowrap">訪問回数 <SortIndicator k="visitCount" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('lastVisitDate')}>
                <div className="flex items-center gap-1 whitespace-nowrap">最終訪問日 <SortIndicator k="lastVisitDate" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStamps.map((stamp) => (
              <tr key={stamp?.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Coffee className="w-4 h-4 text-[#00704A]" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 leading-tight">{stamp?.storeName}</div>
                      <div className="text-[10px] text-gray-400 flex items-center mt-0.5">
                        <MapPin className="w-2.5 h-2.5 mr-1" /> {stamp?.address}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                    {stamp?.prefecture}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${stamp?.visitCount !== undefined ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    {stamp?.visitCount !== undefined ? <><Hash className="w-3 h-3 mr-1 opacity-60" /> {stamp?.visitCount}回</> : <><HelpCircle className="w-3 h-3 mr-1 opacity-40" /> 未確認</>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center gap-2 text-xs ${stamp?.lastVisitDate ? 'text-gray-500' : 'text-gray-300'}`}>
                    <Calendar className="w-3.5 h-3.5" /> {stamp?.lastVisitDate || '---'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setEditingStamp(stamp)} className="p-2 text-gray-400 hover:text-[#00704A] hover:bg-emerald-50 rounded-lg transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(stamp.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイル表示: カード型リスト */}
      <div className="md:hidden divide-y divide-gray-100">
        {filteredStamps.map((stamp) => (
          <div key={stamp?.id} className="p-4 bg-white active:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Coffee className="w-4.5 h-4.5 text-[#00704A]" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 leading-snug">{stamp?.storeName}</h4>
                  <p className="text-[10px] text-gray-400 flex items-center mt-1">
                    <MapPin className="w-2.5 h-2.5 mr-1 shrink-0" />
                    <span className="line-clamp-1">{stamp?.address}</span>
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200 whitespace-nowrap">
                {stamp?.prefecture}
              </span>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] font-black border ${stamp?.visitCount !== undefined ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                  {stamp?.visitCount !== undefined ? <><Hash className="w-2.5 h-2.5 mr-1" />{stamp?.visitCount}回</> : '回数不明'}
                </div>
                <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] font-bold border bg-gray-50 border-gray-100 ${stamp?.lastVisitDate ? 'text-gray-500' : 'text-gray-300'}`}>
                  <Calendar className="w-2.5 h-2.5 mr-1" /> {stamp?.lastVisitDate || '未記録'}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditingStamp(stamp)} className="p-2 text-gray-400 active:text-[#00704A]">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(stamp.id)} className="p-2 text-gray-400 active:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStamps.length === 0 && (
        <div className="p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
            <Search className="w-8 h-8 text-gray-200" />
          </div>
          <p className="text-gray-400 text-sm">データが見つかりません</p>
        </div>
      )}
    </div>
  );
};

export default StoreList;
