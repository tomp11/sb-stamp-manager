
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { StoreStamp, UserProfile } from './types';
import Uploader from './components/Uploader';
import StoreList from './components/StoreList';
import { ErrorBoundary } from 'react-error-boundary';
import { useStamps } from './hooks/useStamps';
import { initFirebase, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from './services/firebase';
import { Coffee, List, Map, Trophy, AlertCircle, X, Loader2, LogIn, LogOut, CloudUpload, CheckCircle2, RefreshCw } from 'lucide-react';


const StoreMap = lazy(() => import('./components/StoreMap'));

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
      <button onClick={resetErrorBoundary} className="py-3 px-6 bg-[#00704A] text-white rounded-xl font-bold">
        再試行
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const { stamps, isLoading: stampsLoading, isSyncing, isDirty, addStamps, updateStamp, deleteStamp, syncToCloud } = useStamps(user?.id || null);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    const monitorAuth = async () => {
      try {
        const { auth } = await initFirebase();
        try { await getRedirectResult(auth); } catch (e) { console.warn(e); }
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
      } catch (e) { console.error(e); }
    };
    monitorAuth();
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const { auth, googleProvider } = await initFirebase();
      try { await signInWithPopup(auth, googleProvider); } catch (error: any) {
        if (error?.code === 'auth/popup-blocked') await signInWithRedirect(auth, googleProvider);
        else throw error;
      }
    } catch (error: any) { setGlobalError(error?.message || "ログイン失敗"); } finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) return;
    const { auth } = await initFirebase();
    await signOut(auth);
    setUser(null);
  };

  const handleManualSync = async () => {
    try {
      await syncToCloud();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (error) { setGlobalError("同期失敗"); }
  };

  const storeCount = new Set(stamps?.map(s => s?.storeName)).size;
  const prefCount = new Set(stamps?.map(s => s?.prefecture)).size;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-[#00704A] animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="min-h-screen bg-[#f3f4f6] pb-10 font-sans">
        {globalError && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xl bg-red-600 text-white p-2 rounded-lg text-[10px] flex justify-between">
            {globalError} <button onClick={() => setGlobalError(null)}><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* ヘッダー: タブなし・アイコン潰れ防止版 */}
        <header className="bg-[#00704A] text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-white p-1 rounded-full shrink-0 shadow-sm">
                <Coffee className="w-4 h-4 text-[#00704A]" />
              </div>
              <h1 className="text-[14px] sm:text-xl font-black tracking-tight whitespace-nowrap">SB Stamp Collection</h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user && (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className={`p-2 rounded-full transition-all shadow-sm ${isDirty ? 'bg-amber-500 animate-pulse' : syncSuccess ? 'bg-emerald-500' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : syncSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CloudUpload className="w-3.5 h-3.5" />}
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-white/20 group relative h-9">
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-white/30 cursor-pointer shadow-sm hover:border-white transition-all" />
                  <button onClick={handleLogout} className="absolute top-11 right-0 bg-white text-gray-800 px-4 py-2 rounded-xl text-[11px] font-bold shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-gray-100">
                    ログアウト
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center justify-center flex-nowrap whitespace-nowrap gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-[#00704A] hover:bg-emerald-50 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-md shrink-0 min-w-fit"
                >
                  <svg className="w-4 h-4 shrink-0 min-w-[16px] min-h-[16px]" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.86 32.659 29.296 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.843 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.046 0 20-8.954 20-20 0-1.341-.138-2.651-.389-3.917z" />
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.843 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.35 4.327-17.694 10.691z" />
                    <path fill="#4CAF50" d="M24 44c5.195 0 9.892-1.989 13.461-5.23l-6.214-5.259C29.232 35.091 26.715 36 24 36c-5.274 0-9.818-3.317-11.279-7.946l-6.518 5.02C9.505 39.556 16.227 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.056 5.511l.003-.002 6.214 5.259C36.971 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z" />
                  </svg>
                  <span className="hidden sm:inline">Googleでログイン</span>
                  <span className="sm:hidden">ログイン</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
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
              </div>
              <Uploader onAddStamps={addStamps} />
            </div>

            <div className="lg:col-span-8 space-y-4">
              {/* リスト/マップ切り替えボタンをここに移植 */}
              <div className="flex justify-center sm:justify-start">
                <nav className="inline-flex items-center bg-gray-200/50 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === 'list' ? 'bg-white text-[#00704A] shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <List className="w-4 h-4 shrink-0" />
                    <span>リスト表示</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === 'map' ? 'bg-white text-[#00704A] shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Map className="w-4 h-4 shrink-0" />
                    <span>マップ表示</span>
                  </button>
                </nav>
              </div>

              <Suspense fallback={<div className="flex justify-center p-20 bg-white rounded-2xl border border-gray-100"><Loader2 className="animate-spin text-[#00704A] opacity-20" /></div>}>
                {activeTab === 'list' ? (
                  <StoreList stamps={stamps || []} onDelete={deleteStamp} onUpdate={updateStamp} />
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                      <h3 className="font-black text-gray-700 flex items-center gap-2 px-2 text-xs uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-[#00704A]" />
                        Distribution Map
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400">全国の訪問店舗を可視化</p>
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