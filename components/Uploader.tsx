
import React, { useState } from 'react';
import { extractStampData } from '../services/geminiService';
import { StoreStamp } from '../types';
import { Upload, Loader2, AlertCircle, Sparkles, CheckCircle2, Info, Clock, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface UploaderProps {
  onAddStamps: (stamps: StoreStamp[]) => { added: number; updated: number; skipped: number };
}

interface UploadSummary {
  added: number;
  updated: number;
  skipped: number;
  total: number;
}

const Uploader: React.FC<UploaderProps> = ({ onAddStamps }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{message: string, isQuota: boolean} | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [isMockMode, setIsMockMode] = useState(false); 

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1600; 
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSummary(null);

    try {
      let results;
      if (isMockMode) {
        results = await extractStampData("", true);
      } else {
        const compressedBase64 = await resizeImage(file);
        results = await extractStampData(compressedBase64, false);
      }
      
      if (!results || results.length === 0) {
        throw new Error("スタンプを検出できませんでした。画像が鮮明であることを確認してください。");
      }

      const tempStamps: StoreStamp[] = results.map((data: any) => ({
        id: crypto.randomUUID(),
        userId: 'guest', // ゲスト用ID
        ...data,
        lastVisitDate: data.lastVisitDate,
        visitCount: data.visitCount,
      }));
      
      const counts = onAddStamps(tempStamps);
      setSummary({ ...counts, total: results.length });
      
      event.target.value = '';
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg = err.message || "";
      const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      setError({
        message: isQuota 
          ? "API制限に達しました。右上の「デモモード」をオンにすると、APIを消費せずにテストできます。" 
          : msg,
        isQuota
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
        <div className="flex justify-between items-center mb-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`relative w-10 h-5 rounded-full transition-colors ${isMockMode ? 'bg-[#00704A]' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isMockMode ? 'translate-x-5' : ''}`} />
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isMockMode} 
                onChange={(e) => setIsMockMode(e.target.checked)} 
              />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isMockMode ? 'text-[#00704A]' : 'text-gray-400 group-hover:text-gray-600'}`}>
              {isMockMode ? 'デモモード (API OFF)' : '通常モード (API ON)'}
            </span>
          </label>
        </div>

        <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 transition-all relative group ${
          isProcessing ? 'border-gray-100 bg-gray-50' : 'border-gray-200 hover:border-[#00704A] hover:bg-emerald-50/30 cursor-pointer'
        }`}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <Loader2 className="w-16 h-16 text-[#00704A] animate-spin mb-4" />
              <p className="text-gray-700 font-bold text-lg">{isMockMode ? 'デモデータを生成中...' : 'AIが解析中...'}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-[#E6F1ED] p-5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                {isMockMode ? <ShieldCheck className="w-10 h-10 text-[#00704A]" /> : <Upload className="w-10 h-10 text-[#00704A]" />}
              </div>
              <p className="text-gray-700 font-bold text-xl mb-2">
                {isMockMode ? 'サンプルを読み込む' : 'スタンプを解析'}
              </p>
              <p className="text-gray-500 text-sm text-center">
                画像から店舗情報を抽出します
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className={`mt-4 p-4 rounded-xl flex items-start text-sm animate-in slide-in-from-top-2 shadow-sm ${
            error.isQuota ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {error.isQuota ? <Clock className="w-5 h-5 mr-3 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />}
            <div className="flex-1">
              <p className="font-bold mb-1">{error.isQuota ? 'API制限に達しました' : '解析に失敗しました'}</p>
              <p className="opacity-90 leading-relaxed">{error.message}</p>
            </div>
          </div>
        )}

        {summary && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-[#00704A] font-bold mb-2 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              解析完了（{summary.total}件）
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-white/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-gray-500 block">新規</span>
                <span className="text-base font-black text-[#00704A]">{summary.added}</span>
              </div>
              <div className="bg-white/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-gray-500 block">更新</span>
                <span className="text-base font-black text-amber-600">{summary.updated}</span>
              </div>
              <div className="bg-white/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-gray-500 block">重複</span>
                <span className="text-base font-black text-gray-400">{summary.skipped}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Uploader;
