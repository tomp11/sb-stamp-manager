
import React, { useState, useRef } from 'react';
import { extractStampData } from '../services/geminiService';
import { StoreStamp } from '../types';
import { 
  Upload, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Image as ImageIcon, 
  LayoutGrid, 
  ArrowLeft 
} from 'lucide-react';

interface UploaderProps {
  onAddStamps: (stamps: StoreStamp[]) => { added: number; updated: number; skipped: number };
}

interface UploadSummary {
  added: number;
  updated: number;
  skipped: number;
  total: number;
}

type UploadStep = 'idle' | 'select' | 'processing';

const Uploader: React.FC<UploaderProps> = ({ onAddStamps }) => {
  const [step, setStep] = useState<UploadStep>('idle');
  const [error, setError] = useState<{message: string, isQuota: boolean} | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [isMockMode, setIsMockMode] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("画像のデコードに失敗しました"));
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

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    setStep('processing');
    setError(null);
    setSummary(null);

    try {
      let results;
      if (isMockMode) {
        results = await extractStampData("", true);
      } else {
        const compressedBase64 = await resizeImage(file);
        // 1. 送信データのサイズを確認
        const stringLength = compressedBase64.length;
        const sizeInKB = (stringLength * (3 / 4)) / 1024; // Base64から概算バイト計算
        console.log("Sending Image Size (Base64):", sizeInKB.toFixed(2), "KB");

        // 2. 実際にAIに送る画像を新しいタブで開く（目視確認用）
        // ※ 開発中のみ有効にしてください
        // const debugWindow = window.open();
        // debugWindow?.document.write(`<img src="${compressedBase64}" />`);

        // 3. 通信直前のタイムスタンプ
        console.log("Gemini API call started at:", new Date().toLocaleTimeString());
        // --- デバッグ終了 ---
        results = await extractStampData(compressedBase64, false);
      }

      if (!results || results?.length === 0) {
        throw new Error("スタンプを検出できませんでした。画像が鮮明であることを確認してください。");
      }

      const tempStamps: StoreStamp[] = results.map((data: any) => ({
        id: crypto.randomUUID(),
        userId: 'guest',
        ...data,
        lastVisitDate: data?.lastVisitDate,
        visitCount: data?.visitCount,
      }));

      const counts = onAddStamps(tempStamps);
      setSummary({ ...counts, total: results?.length });

      if (event.target) event.target.value = '';
      setStep('idle');
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg = err?.message || "";
      const isQuota = msg?.includes('429') || msg?.toLowerCase()?.includes('quota') || msg?.includes('RESOURCE_EXHAUSTED');
      setError({
        message: isQuota 
          ? "API制限に達しました。デモモードをオンにすると、APIを消費せずにテストできます。" 
          : msg,
        isQuota
      });
      setStep('idle');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
        
        {/* モード切替エリア */}
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

        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
        />

        <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 sm:p-10 transition-all relative ${
          step === 'processing' ? 'border-gray-100 bg-gray-50' : 'border-gray-200'
        }`}>
          
          {/* STEP 1: 初期状態 */}
          {step === 'idle' && (
            <div 
              className="flex flex-col items-center cursor-pointer w-full py-4" 
              onClick={() => setStep('select')}
            >
              <div className="bg-[#E6F1ED] p-4 sm:p-5 rounded-full mb-3 sm:mb-4 hover:scale-110 transition-transform">
                {isMockMode ? <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#00704A]" /> : <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-[#00704A]" />}
              </div>
              <p className="text-gray-700 font-bold text-lg sm:text-xl mb-1.5 sm:mb-2 text-center">
                {isMockMode ? 'サンプルを読み込む' : 'スタンプ画像から取り込み'}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm text-center">タップして開始</p>
            </div>
          )}

          {/* STEP 2: 選択ガイド */}
          {step === 'select' && (
            <div className="w-full animate-in fade-in zoom-in duration-300">
              <div 
                className="flex items-center gap-2 mb-6 cursor-pointer hover:text-gray-800 text-gray-400 transition-colors" 
                onClick={() => setStep('idle')}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold">戻る</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={openFilePicker} 
                  className="flex flex-col items-center p-4 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl cursor-pointer border border-transparent hover:border-emerald-200 transition-all group"
                >
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-[#00704A]" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">スタンプ1枚</span>
                </div>
                <div 
                  onClick={openFilePicker} 
                  className="flex flex-col items-center p-4 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl cursor-pointer border border-transparent hover:border-emerald-200 transition-all group"
                >
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <LayoutGrid className="w-6 h-6 text-[#00704A]" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">スタンプリスト</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-6 text-center font-bold uppercase tracking-widest">Select Screenshot Type</p>
            </div>
          )}

          {/* STEP 3: 解析中 */}
          {step === 'processing' && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-[#00704A] animate-spin mb-3 sm:mb-4" />
              <p className="text-gray-700 font-bold text-base sm:text-lg">
                {isMockMode ? 'デモデータを生成中...' : 'AIが解析中...'}
              </p>
            </div>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className={`mt-4 p-4 rounded-xl flex items-start text-sm animate-in slide-in-from-top-2 shadow-sm ${error?.isQuota ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
            {error?.isQuota ? <Clock className="w-5 h-5 mr-3 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />}
            <div className="flex-1">
              <p className="font-bold mb-1">{error?.isQuota ? 'API制限に達しました' : '解析に失敗しました'}</p>
              <p className="opacity-90 leading-relaxed">{error?.message}</p>
            </div>
          </div>
        )}

        {/* サマリー表示 */}
        {summary && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-[#00704A] font-bold mb-2 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              解析完了（{summary?.total}件）
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-white/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-gray-500 block">新規</span>
                <span className="text-base font-black text-[#00704A]">{summary?.added}</span>
              </div>
              <div className="bg-white/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-gray-500 block">更新</span>
                <span className="text-base font-black text-amber-600">{summary?.updated}</span>
              </div>
              <div className="bg-white/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-gray-500 block">重複</span>
                <span className="text-base font-black text-gray-400">{summary?.skipped}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Uploader;
