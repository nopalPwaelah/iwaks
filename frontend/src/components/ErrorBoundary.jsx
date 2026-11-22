import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-slate-200 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                Terjadi Kendala Tampilan
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aplikasi mendeteksi pembaruan data atau kendala sesi sementara. Silakan segarkan halaman untuk memuat ulang sistem intelijen maritim.
              </p>
              {this.state.error && (
                <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] font-mono text-slate-600 overflow-x-auto text-left border border-slate-100 max-h-24">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-ocean-600 hover:bg-ocean-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-ocean-600/20 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Segarkan Halaman</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Coba Kembali</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
