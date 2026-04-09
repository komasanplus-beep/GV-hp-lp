import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">エラーが発生しました</h1>
            <p className="text-sm text-slate-600">
              {this.state.error?.message || 'ページの読み込み中にエラーが発生しました'}
            </p>
            <div className="text-xs bg-red-50 border border-red-200 rounded-lg p-3 text-left max-h-32 overflow-auto font-mono text-red-700">
              {this.state.error?.stack}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => window.location.href = '/'}>
                ホームへ戻る
              </Button>
              <Button className="flex-1 bg-slate-900 hover:bg-slate-800 gap-2" onClick={this.reset}>
                <RefreshCw className="w-4 h-4" />再試行
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}