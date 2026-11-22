import React, { useEffect, useState } from 'react';
import {
  Fish,
  Scale,
  TrendingUp,
  MapPin,
  Store,
  ArrowRight,
  Clock,
  Sparkles,
  Package,
  Building2,
  Database,
  BarChart3,
  ClipboardList,
  Anchor
} from 'lucide-react';
import { apiFetch } from '../lib/api';

/* ---------- helper ---------- */
const fmt = (n) => (Number(n) || 0).toLocaleString('id-ID');
const sumWeight = (list = []) =>
  list.reduce((acc, c) => acc + (Number(c.total_weight_kg) || 0), 0);

// Kelas Tailwind ditulis lengkap (bukan dirangkai) supaya tidak terhapus saat build.
const TONES = {
  ocean: { box: 'bg-ocean-50 text-ocean-600', value: 'text-slate-900' },
  marine: { box: 'bg-teal-50 text-marine-600', value: 'text-slate-900' },
  emerald: { box: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-700' },
  amber: { box: 'bg-amber-50 text-amber-600', value: 'text-slate-900' }
};

/* ---------- konten dashboard per role ---------- */
const ROLE_VIEW = {
  Nelayan: {
    badge: 'Platform Intelijen & Pemberdayaan Ekonomi Pesisir',
    fallbackName: 'Nelayan Hebat',
    desc:
      'Optimalkan hasil tangkapan laut dengan bantuan deteksi objek ikan YOLO, intelijen harga komoditas antar pasar, kalkulator keuntungan bersih, dan jaringan UMKM pesisir terintegrasi.',
    actions: [
      { label: 'Mulai Deteksi Ikan YOLO', icon: Fish, tab: 'ai-detection', primary: true },
      { label: 'Cek Rekomendasi Pasar', icon: TrendingUp, tab: 'market-rec' }
    ],
    kpis: (m) => [
      {
        label: 'Total Tangkapan Saya', icon: Fish, tone: 'ocean',
        value: fmt(m.user_catches_count), unit: 'Trip',
        sub: `Total ${fmt(m.total_catches_all)} trip di pelabuhan`
      },
      {
        label: 'Total Berat Tercatat', icon: Scale, tone: 'marine',
        value: fmt(m.total_weight_kg), unit: 'kg',
        sub: 'Data timbangan riil terverifikasi', good: true
      },
      {
        label: 'Estimasi Nilai Bruto', icon: TrendingUp, tone: 'emerald',
        value: `Rp ${fmt(m.estimated_revenue_idr)}`,
        sub: 'Berdasarkan acuan harga pasar hari ini'
      },
      {
        label: 'Jaringan Pesisir', icon: Store, tone: 'amber',
        value: fmt(m.markets_count), unit: `Pasar • ${fmt(m.umkm_count)} UMKM`,
        sub: `${m.active_species_count || 8} Spesies ikan prioritas`
      }
    ],
    left: {
      title: 'Catatan Tangkapan Terbaru',
      subtitle: 'Hasil pelayaran dan data ikan nelayan terkonfirmasi',
      tab: 'catches', tabLabel: 'Lihat Semua',
      status: 'Terkonfirmasi',
      empty: 'Belum ada riwayat tangkapan tercatat.'
    },
    right: {
      title: 'Intelijen Harga Pasar',
      subtitle: 'Harga komoditas terverifikasi',
      tab: 'prices'
    }
  },

  UMKM: {
    badge: 'Portal Mitra UMKM Pengolahan Hasil Laut',
    fallbackName: 'Mitra UMKM',
    desc:
      'Kelola profil usaha dan katalog produk olahan, pantau ketersediaan bahan baku dari nelayan, dan gunakan acuan harga komoditas untuk menentukan harga produk Anda.',
    actions: [
      { label: 'Kelola Produk UMKM', icon: Store, tab: 'umkm', primary: true },
      { label: 'Lihat Harga Bahan Baku', icon: TrendingUp, tab: 'prices' }
    ],
    kpis: (m, d) => [
      {
        label: 'Mitra UMKM Pesisir', icon: Store, tone: 'amber',
        value: fmt(m.umkm_count), unit: 'UMKM',
        sub: 'Terdaftar di direktori platform'
      },
      {
        label: 'Bahan Baku Prioritas', icon: Fish, tone: 'ocean',
        value: fmt(m.active_species_count || 8), unit: 'Spesies',
        sub: 'Tersedia sebagai pasokan nelayan'
      },
      {
        label: 'Pasokan Nelayan', icon: Package, tone: 'marine',
        value: fmt(m.total_catches_all), unit: 'Trip',
        sub: `${fmt(sumWeight(d?.recent_catches))} kg dari 5 trip terakhir`, good: true
      },
      {
        label: 'Pasar Acuan Harga', icon: TrendingUp, tone: 'emerald',
        value: fmt(m.markets_count), unit: 'Pasar',
        sub: 'Sumber harga bahan baku'
      }
    ],
    left: {
      title: 'Pasokan Bahan Baku Terbaru',
      subtitle: 'Hasil tangkapan nelayan yang tersedia sebagai bahan baku',
      tab: 'umkm', tabLabel: 'Lihat UMKM',
      status: 'Tersedia',
      empty: 'Belum ada pasokan bahan baku tercatat.'
    },
    right: {
      title: 'Harga Bahan Baku',
      subtitle: 'Acuan harga per kg dari pasar',
      tab: 'prices'
    }
  },

  Admin: {
    badge: 'Panel Administrasi & Master Data',
    fallbackName: 'Administrator',
    desc:
      'Kelola master data spesies dan pasar, moderasi data UMKM, serta audit aktivitas tangkapan dan pembaruan harga di seluruh platform.',
    actions: [
      { label: 'Kelola Katalog Spesies', icon: Database, tab: 'species', primary: true },
      { label: 'Audit Intelijen Harga', icon: TrendingUp, tab: 'prices' }
    ],
    kpis: (m) => [
      {
        label: 'Spesies Aktif', icon: Database, tone: 'ocean',
        value: fmt(m.active_species_count || 8), unit: 'Spesies',
        sub: 'Master data katalog ikan'
      },
      {
        label: 'Pasar Terdaftar', icon: Building2, tone: 'amber',
        value: fmt(m.markets_count), unit: 'Pasar',
        sub: 'Master data pasar & TPI'
      },
      {
        label: 'UMKM Terdaftar', icon: Store, tone: 'marine',
        value: fmt(m.umkm_count), unit: 'UMKM',
        sub: 'Perlu moderasi & audit'
      },
      {
        label: 'Trip Tercatat', icon: ClipboardList, tone: 'emerald',
        value: fmt(m.total_catches_all), unit: 'Trip',
        sub: 'Seluruh nelayan', good: true
      }
    ],
    left: {
      title: 'Audit Aktivitas Tangkapan',
      subtitle: 'Catatan trip terbaru untuk moderasi data',
      tab: 'catches', tabLabel: 'Lihat Semua',
      status: 'Terkonfirmasi',
      empty: 'Belum ada aktivitas tangkapan.'
    },
    right: {
      title: 'Pembaruan Harga Terakhir',
      subtitle: 'Pantau sumber & kesegaran data',
      tab: 'prices'
    }
  },

  'Pengelola Pasar': {
    badge: 'Portal Pengelola Pasar Ikan',
    fallbackName: 'Pengelola Pasar',
    desc:
      'Input dan perbarui harga komoditas harian agar nelayan dan UMKM selalu mendapat acuan harga yang akurat dan segar.',
    actions: [
      { label: 'Input Harga Harian', icon: TrendingUp, tab: 'prices', primary: true },
      { label: 'Lihat Peta Pasar', icon: MapPin, tab: 'gis' }
    ],
    kpis: (m) => [
      {
        label: 'Pasar Terpantau', icon: Building2, tone: 'amber',
        value: fmt(m.markets_count), unit: 'Pasar',
        sub: 'Jaringan pasar ikan pesisir'
      },
      {
        label: 'Spesies Dipantau', icon: Fish, tone: 'ocean',
        value: fmt(m.active_species_count || 8), unit: 'Spesies',
        sub: 'Komoditas yang harus diperbarui'
      },
      {
        label: 'Harga di Papan', icon: TrendingUp, tone: 'emerald',
        value: fmt(0), unit: 'Harga',
        sub: 'Harga terbaru dari pasar acuan', good: true, fromFeed: true
      },
      {
        label: 'Pasokan Pelabuhan', icon: Anchor, tone: 'marine',
        value: fmt(m.total_catches_all), unit: 'Trip',
        sub: 'Perkiraan pasokan yang masuk'
      }
    ],
    left: {
      title: 'Pasokan Masuk Pelabuhan',
      subtitle: 'Ikan yang baru didaratkan dan siap masuk pasar',
      tab: 'gis', tabLabel: 'Lihat Peta',
      status: 'Siap dipasarkan',
      empty: 'Belum ada pasokan masuk.'
    },
    right: {
      title: 'Harga Terakhir Diinput',
      subtitle: 'Perbarui harga komoditas harian',
      tab: 'prices'
    }
  },

  Stakeholder: {
    badge: 'Dashboard Kebijakan & Statistik DKP',
    fallbackName: 'Dinas Kelautan & Perikanan',
    desc:
      'Pantau statistik agregat tangkapan, sebaran fasilitas pesisir, dan indikator harga komoditas sebagai dasar laporan serta pengambilan kebijakan ekonomi pesisir.',
    actions: [
      { label: 'Buka Peta Coastal GIS', icon: MapPin, tab: 'gis', primary: true },
      { label: 'Lihat Statistik Tangkapan', icon: BarChart3, tab: 'catches' }
    ],
    kpis: (m, d) => [
      {
        label: 'Total Trip Tangkapan', icon: BarChart3, tone: 'ocean',
        value: fmt(m.total_catches_all), unit: 'Trip',
        sub: 'Agregat seluruh pelabuhan'
      },
      {
        label: 'Berat 5 Trip Terakhir', icon: Scale, tone: 'marine',
        value: fmt(sumWeight(d?.recent_catches)), unit: 'kg',
        sub: 'Data timbangan terverifikasi', good: true
      },
      {
        label: 'Jaringan Pesisir', icon: MapPin, tone: 'amber',
        value: fmt(m.markets_count), unit: `Pasar • ${fmt(m.umkm_count)} UMKM`,
        sub: 'Titik TPI, pasar, dan klaster UMKM'
      },
      {
        label: 'Spesies Prioritas', icon: Fish, tone: 'emerald',
        value: fmt(m.active_species_count || 8), unit: 'Spesies',
        sub: 'Dipantau untuk laporan ekonomi'
      }
    ],
    left: {
      title: 'Statistik Tangkapan Terbaru',
      subtitle: 'Ringkasan trip pelabuhan untuk pemantauan kebijakan',
      tab: 'catches', tabLabel: 'Lihat Semua',
      status: 'Terverifikasi',
      empty: 'Belum ada data tangkapan.'
    },
    right: {
      title: 'Pantauan Harga Komoditas',
      subtitle: 'Indikator harga untuk laporan ekonomi',
      tab: 'prices'
    }
  }
};

/* ---------- komponen ---------- */
export default function DashboardView({ onNavigate, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const view = ROLE_VIEW[user?.role] || ROLE_VIEW.Nelayan;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching dashboard:', err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 space-x-2">
        <div className="w-5 h-5 border-2 border-ocean-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Memuat data intelijen pesisir...</span>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const feed = data?.market_price_feed || [];
  const kpis = view.kpis(metrics, data).map((k) =>
    k.fromFeed ? { ...k, value: fmt(feed.length) } : k
  );
  const displayName = user?.name || data?.user_name || view.fallbackName;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-ocean-900 via-ocean-800 to-marine-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-ocean-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{view.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {displayName}
          </h1>
          <p className="mt-2 text-ocean-100 text-sm leading-relaxed">{view.desc}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            {view.actions.map((a) => {
              const Icon = a.icon;
              return a.primary ? (
                <button
                  key={a.tab}
                  onClick={() => onNavigate(a.tab)}
                  className="bg-white text-ocean-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-ocean-50 transition shadow-lg flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4 text-ocean-700" />
                  <span>{a.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  key={a.tab}
                  onClick={() => onNavigate(a.tab)}
                  className="bg-white/10 border border-white/20 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-white/20 transition flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4 text-teal-300" />
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          const tone = TONES[k.tone];
          return (
            <div
              key={k.label}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-ocean-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{k.label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone.box}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-extrabold ${tone.value}`}>
                  {k.value}{' '}
                  {k.unit && <span className="text-sm font-normal text-slate-500">{k.unit}</span>}
                </div>
                <p className={`text-xs mt-1 ${k.good ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                  {k.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">{view.left.title}</h2>
              <p className="text-xs text-slate-500">{view.left.subtitle}</p>
            </div>
            <button
              onClick={() => onNavigate(view.left.tab)}
              className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 flex items-center space-x-1"
            >
              <span>{view.left.tabLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {!data?.recent_catches?.length ? (
              <div className="py-8 text-center text-slate-400 text-sm">{view.left.empty}</div>
            ) : (
              data.recent_catches.map((c) => (
                <div
                  key={c.id}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold text-xs">
                      #{c.id}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{c.location}</h4>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{c.date}</span>
                        <span>&bull;</span>
                        <span className="text-ocean-700 font-medium">
                          {c.species_list?.join(', ') || 'Ikan'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900">{c.total_weight_kg} kg</span>
                    <span className="block text-[11px] text-emerald-600 font-medium">{view.left.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">{view.right.title}</h2>
              <p className="text-xs text-slate-500">{view.right.subtitle}</p>
            </div>
            <button
              onClick={() => onNavigate(view.right.tab)}
              className="text-xs font-semibold text-ocean-600 hover:text-ocean-700"
            >
              Detail
            </button>
          </div>

          <div className="space-y-3">
            {feed.map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{p.species}</h4>
                  <p className="text-[11px] text-slate-500 italic">{p.scientific}</p>
                  <span className="inline-block text-[10px] text-slate-500 mt-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {p.market}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-ocean-700">Rp {fmt(p.price)}</span>
                  <span className="block text-[10px] text-slate-400">/ kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}