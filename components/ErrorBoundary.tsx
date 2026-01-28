
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  // Fix: Made children optional to prevent 'missing property' errors when used in JSX
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Fix: Explicitly extend Component from react to ensure 'this.props' and 'this.state' are correctly typed and recognized
class ErrorBoundary extends Component<Props, State> {
  // Fix: Initialize state within the constructor while calling super(props) to satisfy inheritance requirements
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleClearData = () => {
    if (confirm("保存されているデータをすべて削除して復旧しますか？\n(アップロードしたスタンプが消去されます)")) {
      localStorage.removeItem('starbucks-stamps');
      window.location.reload();
    }
  };

  public render() {
    // Fix: Access this.state and this.props after ensuring inheritance from Component
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
            <p className="text-gray-500 mb-6">画面の描画中に問題が発生しました。データ形式が不正な可能性があります。</p>
            
            <div className="bg-red-50 rounded-xl p-4 mb-8 text-left overflow-auto max-h-40">
              <p className="text-xs font-mono text-red-700 break-all">
                {this.state.error?.stack || this.state.error?.message}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#00704A] text-white rounded-xl font-bold hover:bg-[#005c3d] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                再読み込み
              </button>
              <button
                onClick={this.handleClearData}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-red-500 border border-red-100 rounded-xl font-bold hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                データをリセットして復旧
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Fix: Successfully return children from props
    return this.props.children;
  }
}

export default ErrorBoundary;
