import React, { useEffect, useState } from 'react';
import {
  Fish,
  Scale,
  TrendingUp,
  MapPin,
  Store,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function DashboardView({ onNavigate, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard:', err);
        setLoading(false);
      });
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-ocean-900 via-ocean-800 to-marine-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-ocean-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Platform Intelijen &amp; Pemberdayaan Ekonomi Pesisir</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {data?.user_name || 'Nelayan Hebat'}
          </h1>
          <p className="mt-2 text-ocean-100 text-sm leading-relaxed">
            Optimalkan hasil tangkapan laut dengan bantuan deteksi objek ikan YOLO, intelijen harga komoditas antar pasar, kalkulator keuntungan bersih, dan jaringan UMKM pesisir terintegrasi.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('ai-detection')}
              className="bg-white text-ocean-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-ocean-50 transition shadow-lg flex items-center space-x-2"
            >
              <Fish className="w-4 h-4 text-ocean-700" />
              <span>Mulai Deteksi Ikan YOLO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('market-rec')}
              className="bg-white/10 border border-white/20 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-white/20 transition flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4 text-marine-300" />
              <span>Cek Rekomendasi Pasar</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-ocean-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tangkapan Saya</span>
            <div className="w-10 h-10 rounded-xl bg-ocean-50 text-ocean-600 flex items-center justify-center">
              <Fish className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{metrics.user_catches_count || 0} <span className="text-sm font-normal text-slate-500">Trip</span></div>
            <p className="text-xs text-slate-500 mt-1">Total {metrics.total_catches_all || 0} trip di pelabuhan</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-ocean-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Berat Tercatat</span>
            <div className="w-10 h-10 rounded-xl bg-marine-50 text-marine-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{metrics.total_weight_kg || 0} <span className="text-sm font-normal text-slate-500">kg</span></div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Data timbangan riil terverifikasi</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-ocean-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimasi Nilai Bruto</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-700">
              Rp {(metrics.estimated_revenue_idr || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-500 mt-1">Berdasarkan acuan harga pasar hari ini</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-ocean-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jaringan Pesisir</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics.markets_count || 0} <span className="text-sm font-normal text-slate-500">Pasar &bull; {metrics.umkm_count || 0} UMKM</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{metrics.active_species_count || 8} Spesies ikan prioritas</p>
          </div>
        </div>
      </div>

      {/* Two columns: Recent Catches & Commodity Price Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catches Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catatan Tangkapan Terbaru</h2>
              <p className="text-xs text-slate-500">Hasil pelayaran dan data ikan nelayan terkonfirmasi</p>
            </div>
            <button
              onClick={() => onNavigate('catches')}
              className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 flex items-center space-x-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recent_catches?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">Belum ada riwayat tangkapan tercatat.</div>
            ) : (
              data?.recent_catches?.map((c) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition">
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
                        <span className="text-ocean-700 font-medium">{c.species_list?.join(', ') || 'Ikan'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900">{c.total_weight_kg} kg</span>
                    <span className="block text-[11px] text-emerald-600 font-medium">Terkonfirmasi</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Price Feed Column */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Intelijen Harga Pasar</h2>
              <p className="text-xs text-slate-500">Harga komoditas terverifikasi</p>
            </div>
            <button
              onClick={() => onNavigate('prices')}
              className="text-xs font-semibold text-ocean-600 hover:text-ocean-700"
            >
              Detail
            </button>
          </div>

          <div className="space-y-3">
            {data?.market_price_feed?.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{p.species}</h4>
                  <p className="text-[11px] text-slate-500 italic">{p.scientific}</p>
                  <span className="inline-block text-[10px] text-slate-500 mt-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {p.market}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-ocean-700">Rp {p.price.toLocaleString('id-ID')}</span>
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
