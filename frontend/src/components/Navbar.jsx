import React from 'react';
import {
  Waves,
  Shield,
  Lock,
  LogIn,
  LogOut,
  Fish,
  Store,
  Building2,
  UserCheck
} from 'lucide-react';

export default function Navbar({ currentUser, onOpenAuthModal, onLogout }) {
  const isPublic = !currentUser || currentUser.role === 'Public';
  const role = currentUser?.role || 'Public';

  const getRoleBadge = () => {
    switch (role) {
      case 'Nelayan':
        return {
          icon: Fish,
          label: 'Nelayan',
          classes: 'bg-ocean-50 text-ocean-700 border-ocean-200'
        };
      case 'UMKM':
        return {
          icon: Store,
          label: 'Mitra UMKM',
          classes: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'Pengelola Pasar':
        return {
          icon: Building2,
          label: 'Pengelola Pasar',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'Admin & Stakeholder (DKP)':
      case 'Admin':
      case 'Stakeholder':
        return {
          icon: Shield,
          label: 'Admin & DKP',
          classes: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      default:
        return {
          icon: Waves,
          label: 'Tamu / Publik',
          classes: 'bg-slate-100 text-slate-700 border-slate-200'
        };
    }
  };

  const badgeInfo = getRoleBadge();
  const RoleIcon = badgeInfo.icon;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ocean-700 to-marine-500 flex items-center justify-center text-white shadow-md shadow-ocean-500/20">
            <Waves className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-ocean-950">
                BlueEconomy<span className="text-ocean-600">.AI</span>
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${badgeInfo.classes}`}>
                {isPublic ? 'Mode Publik' : badgeInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Platform Intelijen Ekonomi Pesisir &amp; Maritim Terintegrasi
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {isPublic ? (
            /* Mode Publik: Tombol Masuk / Daftar Akun */
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 hidden md:inline">
                Akses Terbuka untuk Umum
              </span>
              <button
                onClick={onOpenAuthModal}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-ocean-600 to-marine-600 hover:from-ocean-700 hover:to-marine-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-ocean-600/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Daftar</span>
              </button>
            </div>
          ) : (
            /* Mode Terautentikasi: Info Akun & Tombol Keluar */
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    role === 'Admin & Stakeholder (DKP)' || role === 'Admin'
                      ? 'bg-purple-600 text-white'
                      : role === 'Pengelola Pasar'
                      ? 'bg-emerald-600 text-white'
                      : role === 'UMKM'
                      ? 'bg-amber-600 text-white'
                      : 'bg-ocean-600 text-white'
                  }`}
                >
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px]">
                    {currentUser?.name || 'Pengguna'}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {badgeInfo.label}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Keluar dari akun dan kembali ke mode publik"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition border border-slate-200 hover:border-rose-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
