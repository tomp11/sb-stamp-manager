
import React, { useState } from 'react';
import { StoreStamp, SortKey, SortOrder } from '../types';
import { Search, ChevronDown, ChevronUp, MapPin, Calendar, Hash, Trash2, Coffee, HelpCircle } from 'lucide-react';

interface StoreListProps {
  stamps: StoreStamp[];
  onDelete: (id: string) => void;
}

const StoreList: React.FC<StoreListProps> = ({ stamps, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastVisitDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredStamps = stamps
    .filter(s => 
      s.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.prefecture.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // 未取得のデータはソート順で最後に持ってくる
      const valA = a[sortKey] ?? (sortOrder === 'asc' ? 'zzzz' : '0000');
      const valB = b[sortKey] ?? (sortOrder === 'asc' ? 'zzzz' : '0000');
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
        <p className="text-sm text-gray-500 font-medium">
          登録数: <span className="text-[#00704A] font-bold">{filteredStamps.length}件</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-100">
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSort('storeName')}
              >
                <div className="flex items-center gap-1">店舗名 <SortIndicator k="storeName" /></div>
              </th>
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSort('prefecture')}
              >
                <div className="flex items-center gap-1">都道府県 <SortIndicator k="prefecture" /></div>
              </th>
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 text-center"
                onClick={() => toggleSort('visitCount')}
              >
                <div className="flex items-center justify-center gap-1">訪問回数 <SortIndicator k="visitCount" /></div>
              </th>
              <th 
                className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSort('lastVisitDate')}
              >
                <div className="flex items-center gap-1">最終訪問日 <SortIndicator k="lastVisitDate" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStamps.map((stamp) => (
              <tr key={stamp.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Coffee className="w-4 h-4 text-[#00704A]" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{stamp.storeName}</div>
                      <div className="text-[10px] text-gray-400 flex items-center mt-0.5">
                        <MapPin className="w-2.5 h-2.5 mr-1" /> {stamp.address}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                    {stamp.prefecture}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${
                    stamp.visitCount !== undefined 
                      ? 'bg-amber-50 text-amber-700 border-amber-100' 
                      : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}>
                    {stamp.visitCount !== undefined ? (
                      <><Hash className="w-3 h-3 mr-1 opacity-60" /> {stamp.visitCount}回</>
                    ) : (
                      <><HelpCircle className="w-3 h-3 mr-1 opacity-40" /> 未確認</>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center gap-2 text-xs ${stamp.lastVisitDate ? 'text-gray-500' : 'text-gray-300'}`}>
                    <Calendar className="w-3.5 h-3.5" /> {stamp.lastVisitDate || '---'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button 
                    onClick={() => onDelete(stamp.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
