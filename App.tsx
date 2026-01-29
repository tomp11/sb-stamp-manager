
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { StoreStamp, UserProfile } from './types';
import Uploader from './components/Uploader';
import StoreList from './components/StoreList';
import { ErrorBoundary } from 'react-error-boundary';
import { useStamps } from './hooks/useStamps';
import { initFirebase, onAuthStateChanged, signInWithPopup, signOut } from './services/firebase';
import { Coffee, List, Map, Trophy, AlertCircle, X, Loader2, LogIn, LogOut, CloudUpload, CheckCircle2, RefreshCw, Save } from 'lucide-react';

const StoreMap = lazy(() => import('./components/StoreMap'));

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
      <p className="text-gray-500 mb-6">アプリの実行中に予期せぬエラーが発生しました。</p>
      <div className="bg-red-50 rounded-xl p-4 mb-8 text-left overflow-auto max-h-40">
        <p className="text-xs font-mono text-red-700 break-all">{error?.message || "不明なエラー"}</p>
      </div>
      <button
        onClick={resetErrorBoundary}
        className="flex items-center justify-center gap-2 w-full py-3 bg-[#00704A] text-white rounded-xl font-bold hover:bg-[#005c3d] transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        再読み込みして復旧
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false); 
  const { stamps, isLoading: stampsLoading, isSyncing, isDirty, addStamps, deleteStamp, syncToCloud } = useStamps(user?.id || null);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    const monitorAuth = async () => {
      try {
        const { auth } = await initFirebase();
        onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              picture: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Starbucks'
            });
          } else {
            setUser(null);
          }
        });
      } catch (e) {
        console.error("Auth initialization error:", e);
      }
    };
    monitorAuth();
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const { auth, googleProvider } = await initFirebase();
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setGlobalError(error?.message || "ログインに失敗しました。");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) return;
    try {
      const { auth } = await initFirebase();
      await signOut(auth);
      setUser(null);
    } catch (error) {
      setGlobalError("ログアウト中にエラーが発生しました。");
    }
  };

  const handleManualSync = async () => {
    try {
      await syncToCloud();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (error) {
      setGlobalError("同期中にエラーが発生しました。");
    }
  };

  const storeCount = new Set(stamps?.map(s => s?.storeName)).size;
  const prefCount = new Set(stamps?.map(s => s?.prefecture)).size;

  const showFullLoading = authLoading || (user && stampsLoading && stamps.length === 0);

  if (showFullLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00704A] animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium animate-pulse">
            {authLoading ? '認証中...' : 'コレクションを同期中...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="min-h-screen bg-[#f3f4f6] pb-24 font-sans animate-in fade-in duration-500">
        {globalError && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xl animate-in slide-in-from-top-4">
            <div className="bg-red-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border-2 border-white/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <p className="text-sm font-bold">{globalError}</p>
              </div>
              <button onClick={() => setGlobalError(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        <header className="bg-[#00704A] text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-white p-1.5 rounded-full shadow-inner">
                  <Coffee className="w-5 h-5 text-[#00704A]" />
                </div>
                <h1 className="text-lg font-bold tracking-tight">Stamp Master</h1>
              </div>
              <nav className="flex items-center bg-black/10 rounded-full p-1 ml-2">
                <button 
                  onClick={() => setActiveTab('list')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-white text-[#00704A] shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                  <List className="w-3.5 h-3.5" />
                  リスト
                </button>
                <button 
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'map' ? 'bg-white text-[#00704A] shadow-sm' : 'text-white/80 hover:text-white'}`}
                >
                  <Map className="w-3.5 h-3.5" />
                  マップ
                </button>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all relative ${
                    isDirty 
                      ? 'bg-amber-500 text-white shadow-md animate-pulse hover:bg-amber-600' 
                      : syncSuccess 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : syncSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {isSyncing ? '同期中...' : syncSuccess ? '同期完了' : isDirty ? '未同期あり' : '同期済み'}
                  </span>
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-3 pl-3 border-l border-white/20 group relative">
                   <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-emerald-100 font-bold leading-none">Cloud Connected</p>
                      <p className="text-xs font-bold leading-tight truncate max-w-[100px]">{user?.name}</p>
                   </div>
                   <img 
                    src={user?.picture} 
                    alt={user?.name} 
                    className="w-9 h-9 rounded-full border border-white/30 cursor-pointer"
                   />
                   <button 
                      onClick={handleLogout}
                      className="absolute top-11 right-0 bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex items-center gap-2 border border-gray-100 whitespace-nowrap"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      ログアウト
                    </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#00704A] hover:bg-emerald-50 rounded-full text-xs font-bold transition-all shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  ログイン
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trophy className="w-24 h-24" />
                </div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Your Progress</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-black mb-1 uppercase">Stores</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-4xl font-black text-[#00704A] tracking-tighter">{storeCount}</p>
                      <p className="text-xs font-bold text-[#00704A]/60">pts</p>
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[10px] text-amber-600 font-black mb-1 uppercase">Areas</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-4xl font-black text-amber-700 tracking-tighter">{prefCount}</p>
                      <p className="text-xs font-bold text-amber-700/60">pref</p>
                    </div>
                  </div>
                </div>
                
                {isDirty && user && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-amber-700">クラウドに未保存の変更があります</p>
                    <button 
                      onClick={handleManualSync}
                      className="text-[10px] font-black text-white bg-amber-500 px-3 py-1 rounded-full hover:bg-amber-600 transition-colors"
                    >
                      同期する
                    </button>
                  </div>
                )}
              </div>

              <Uploader onAddStamps={addStamps} />
            </div>

            <div className="lg:col-span-8 min-h-[400px]">
              <Suspense fallback={
                <div className="w-full h-[500px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200">
                   <Loader2 className="w-10 h-10 text-emerald-200 animate-spin mb-4" />
                   <p className="text-gray-400 text-sm font-medium">コンポーネントを読込中...</p>
                </div>
              }>
                {activeTab === 'list' ? (
                  <StoreList stamps={stamps || []} onDelete={deleteStamp} />
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-[#00704A]" />
                        店舗分布マップ
                      </h3>
                    </div>
                    <StoreMap stamps={stamps || []} />
                  </div>
                )}
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
