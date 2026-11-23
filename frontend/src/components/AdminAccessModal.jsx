import React, { useState } from 'react';
import { Shield, KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { setAuthToken } from '../lib/api';

export default function AdminAccessModal({ isOpen, onClose, onAdminSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Kata sandi admin tidak tepat.');
      }

      setAuthToken(data.token);
      setSuccessMessage('Akses Admin & DKP Terbuka!');
      setTimeout(() => {
        onAdminSuccess(data.user);
        onClose();
        setPassword('');
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || 'Kata sandi salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </span>
            <h2 className="text-lg font-extrabold tracking-tight">Kunci Akses Admin &amp; DKP</h2>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">
            Hanya untuk petugas Dinas Kelautan &amp; Pengelola Sistem untuk akses master data dan audit.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Masukkan Kata Sandi Administrator
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-purple-700/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Buka Panel Admin'}
            </button>

            <button
              type="button"
              onClick={() => setPassword('password123')}
              className="w-full text-center text-[11px] text-slate-400 hover:text-purple-600 underline font-medium pt-1"
            >
              Gunakan sandi bawaan (password123)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
