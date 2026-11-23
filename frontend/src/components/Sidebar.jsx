import React from 'react';
import {
  LayoutDashboard,
  ScanEye,
  ClipboardList,
  TrendingUp,
  Calculator,
  Navigation,
  MapPin,
  Store,
  BookOpen,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
  { id: 'ai-detection', label: 'AI Deteksi & Hitung Ikan', icon: ScanEye, badge: 'YOLO v11' },
  { id: 'catches', label: 'Catatan Tangkapan', icon: ClipboardList },
  { id: 'prices', label: 'Intelijen Harga', icon: TrendingUp },
  { id: 'profit', label: 'Analisis Keuntungan', icon: Calculator },
  { id: 'market-rec', label: 'Rekomendasi Pasar', icon: Navigation, badge: 'Optimal' },
  { id: 'gis', label: 'Coastal GIS Pesisir', icon: MapPin },
  { id: 'umkm', label: 'Direktori & Produk UMKM', icon: Store },
  { id: 'species', label: 'Katalog 8 Spesies Ikan', icon: BookOpen }
];

export default function Sidebar({ currentTab, onSelectTab, allowedTabs, isMobileOpen, onCloseMobile }) {
  // Kalau allowedTabs tidak dikirim, tampilkan semua menu (tidak error).
  const items = Array.isArray(allowedTabs)
    ? NAV_ITEMS.filter((item) => allowedTabs.includes(item.id))
    : NAV_ITEMS;

  const handleItemClick = (id) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavContent = () => (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Modul Platform</p>
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${isActive
                    ? 'bg-gradient-to-r from-ocean-600 to-marine-600 text-white shadow-md shadow-ocean-700/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-ocean-950 text-ocean-400 border border-ocean-800'
                    }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Info card */}
      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-xs">
        <p className="font-semibold text-white mb-1">Human-in-the-Loop</p>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Hasil deteksi YOLO merupakan asisten rekomendasi otomatis. Pengguna dapat meninjau & mengoreksi sebelum disimpan.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Tampil di layar besar md ke atas) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-shrink-0 min-h-[calc(100vh-4rem)] p-4 flex-col justify-between">
        {renderNavContent()}
        <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800 text-center">
          BlueEconomy AI &copy; 2026. SRS &amp; PDA v1.0 Compliance.
        </div>
      </aside>

      {/* Mobile Drawer (Tampil saat tombol hamburger diklik di layar HP) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop Blur Gelap */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 min-h-full p-4 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Navigasi Modul</span>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderNavContent()}
            </div>
            <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800 text-center mt-6">
              BlueEconomy AI &copy; 2026.
            </div>
          </div>
        </div>
      )}
    </>
  );
}