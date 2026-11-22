import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Mail,
  KeyRound,
  Phone,
  Fish,
  Store,
  Building2,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { setAuthToken } from '../lib/api';

const DEMO_ACCOUNTS = [
  {
    role: 'Nelayan',
    label: 'Nelayan',
    email: 'nelayan@blueeconomy.id',
    password: 'password123',
    desc: 'Deteksi AI YOLO, catatan hasil tangkapan & tawar dagang pasar',
    icon: Fish,
    tone: 'border-ocean-300 bg-ocean-50 text-ocean-700 hover:bg-ocean-100'
  },
  {
    role: 'UMKM',
    label: 'Mitra UMKM',
    email: 'umkm@blueeconomy.id',
    password: 'password123',
    desc: 'Kelola produk olahan, pantau harga bahan baku nelayan',
    icon: Store,
    tone: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
  },
  {
    role: 'Pengelola Pasar',
    label: 'Pengelola Pasar',
    email: 'pasar@blueeconomy.id',
    password: 'password123',
    desc: 'Pembaruan harga komoditas harian & verifikasi dagang ikan masuk',
    icon: Building2,
    tone: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
  },
  {
    role: 'Admin & Stakeholder (DKP)',
    label: 'Admin & DKP',
    email: 'admin@blueeconomy.id',
    password: 'password123',
    desc: 'Audit pelabuhan, regulator maritim, dan master data katalog',
    icon: Shield,
    tone: 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
  }
];

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultTab = 'login',
  initialRole = 'Nelayan'
}) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'login' | 'register'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState(initialRole);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Email atau kata sandi tidak cocok.');
      }

      setAuthToken(data.token);
      setSuccessMessage(`Selamat datang, ${data.user.name}!`);
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal masuk akun.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName || !regEmail || !regPassword) {
      setErrorMessage('Harap lengkapi semua kolom yang wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          phone: regPhone || null
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Registrasi gagal. Coba email lain.');
      }

      setAuthToken(data.token);
      setSuccessMessage(`Akun ${regRole} berhasil didaftarkan! Mengalihkan...`);
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal mendaftar akun.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (acc) => {
    setLoginEmail(acc.email);
    setLoginPassword(acc.password);
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Demo login gagal.');
      }

      setAuthToken(data.token);
      setSuccessMessage(`Masuk sebagai ${acc.label} (${data.user.name})`);
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 400);
    } catch (err) {
      setErrorMessage(err.message || 'Login demo gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-ocean-900 via-ocean-800 to-marine-800 p-6 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Lock className="w-5 h-5 text-teal-300" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">
              Autentikasi BlueEconomy AI
            </h2>
          </div>
          <p className="text-xs text-ocean-200">
            Akses layanan eksklusif untuk Nelayan, Pelaku Usaha UMKM, dan Pengelola Pasar Ikan.
          </p>

          {/* Switch Tab Masuk / Daftar */}
          <div className="mt-4 flex bg-white/10 p-1 rounded-xl border border-white/20 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                activeTab === 'login'
                  ? 'bg-white text-ocean-950 shadow-sm'
                  : 'text-ocean-100 hover:text-white'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                activeTab === 'register'
                  ? 'bg-white text-ocean-950 shadow-sm'
                  : 'text-ocean-100 hover:text-white'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-700 text-xs">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <div className="space-y-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="contoh: nelayan@blueeconomy.id"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Masukkan kata sandi..."
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-ocean-600 to-marine-600 hover:from-ocean-700 hover:to-marine-700 text-white font-bold rounded-xl text-xs shadow-md shadow-ocean-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Masuk Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Logins */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Uji Coba Cepat 1-Klik Akun Demo:</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const Icon = acc.icon;
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleQuickDemoLogin(acc)}
                        disabled={loading}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2.5 ${acc.tone}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/80 shadow-sm flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold leading-tight truncate">{acc.label}</p>
                          <p className="text-[10px] opacity-75 truncate">{acc.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Daftar Sebagai Peran:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Nelayan', label: 'Nelayan', icon: Fish },
                    { id: 'UMKM', label: 'Mitra UMKM', icon: Store },
                    { id: 'Pengelola Pasar', label: 'Pasar Ikan', icon: Building2 }
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = regRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRegRole(r.id)}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center space-y-1 ${
                          isSelected
                            ? 'border-ocean-600 bg-ocean-50 text-ocean-950 font-bold shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-ocean-600' : 'text-slate-400'}`} />
                        <span className="text-xs">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 italic">
                  {regRole === 'Nelayan' && 'Mendapat akses AI YOLO deteksi ikan, catatan tangkapan, dan kalkulator keuntungan.'}
                  {regRole === 'UMKM' && 'Mendapat akses direktori produk olahan dan pantauan pasokan komoditas nelayan.'}
                  {regRole === 'Pengelola Pasar' && 'Mendapat akses pembaruan harga komoditas dan verifikasi tawaran dagang nelayan.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap / Nama Usaha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="contoh: Pak Budi Santoso / TPI Muara Angke"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="contoh: nama@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    No. Handphone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Daftar Akun {regRole}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
