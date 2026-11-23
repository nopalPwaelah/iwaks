import React, { useEffect, useState } from 'react';
import {
  Navigation,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Truck,
  TrendingUp,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function MarketRecommendationView() {
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(1);
  const [weightKg, setWeightKg] = useState(50.0);
  const [transportRatePerKm, setTransportRatePerKm] = useState(5000);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSpeciesCatalog(list);
        if (list.length > 0) {
          setSelectedSpeciesId(list[0].id);
        }
      })
      .catch(() => setSpeciesCatalog([]));
  }, []);

  const fetchRecommendations = () => {
    setLoading(true);
    fetch(`/api/market-recommendations?species_id=${selectedSpeciesId}&weight_kg=${weightKg}&transport_rate_per_km=${transportRatePerKm}`)
      .then((r) => r.json())
      .then((data) => {
        setRecommendations(Array.isArray(data?.recommendations) ? data.recommendations : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setRecommendations([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedSpeciesId, weightKg, transportRatePerKm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
            <Navigation className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">Rekomendasi Pasar Berbasis Nilai Bersih</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Sesuai PDA Section 4.3: Sistem menghitung nilai bersih riil = <code>(berat &times; harga pasar) &minus; biaya distribusi (jarak &times; tarif/km) &minus; retribusi</code>, bukan hanya memilih harga tertinggi.
        </p>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Komoditas Ikan</label>
          <select
            value={selectedSpeciesId}
            onChange={(e) => setSelectedSpeciesId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
          >
            {speciesCatalog.map((s) => (
              <option key={s.id} value={s.id}>{s.common_name} ({s.scientific_name})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Volume Muatan Tangkapan (kg)</label>
          <input
            type="number"
            step="5"
            min="5"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-ocean-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Angkut Distribusi (Rp/km)</label>
          <input
            type="number"
            step="500"
            value={transportRatePerKm}
            onChange={(e) => setTransportRatePerKm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
          />
          <span className="text-[10px] text-slate-400">Asumsi mobil pickup/motor berpendingin.</span>
        </div>
      </div>

      {/* Market Cards Ranking */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Menghitung optimasi nilai bersih pasar...</div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const isTop = rec.rank === 1;
            return (
              <div
                key={rec.market_id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isTop
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                    : 'border-slate-200/90 shadow-sm hover:border-ocean-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Market info */}
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center space-x-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                        isTop ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        #{rec.rank}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{rec.market_name}</h3>
                      {isTop && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                          <Award className="w-3 h-3 text-emerald-700" />
                          <span>Paling Menguntungkan</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rec.address}, {rec.city}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-ocean-700">{rec.distance_km} km</span>
                    </div>

                    {rec.is_stale && (
                      <div className="inline-flex items-center space-x-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Data harga berumur {rec.age_days} hari. Pastikan konfirmasi ke pedagang sebelum berangkat.</span>
                      </div>
                    )}
                  </div>

                  {/* Calculations breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400">Harga Pasar</span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        Rp {rec.price_per_kg.toLocaleString('id-ID')}
                      </span>
                      <span className="block text-[10px] text-slate-400">/ kg</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400">Pendapatan Kotor</span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        Rp {rec.gross_revenue.toLocaleString('id-ID')}
                      </span>
                      <span className="block text-[10px] text-slate-400">{weightKg} kg</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400">Biaya Distribusi</span>
                      <span className="font-bold text-red-500 text-xs sm:text-sm">
                        - Rp {rec.distribution_cost.toLocaleString('id-ID')}
                      </span>
                      <span className="block text-[10px] text-slate-400">{rec.distance_km} km</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border text-left sm:text-right ${
                      isTop ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wide">Nilai Bersih</span>
                      <span className={`font-black text-sm sm:text-base ${
                        isTop ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        Rp {rec.estimated_net_value.toLocaleString('id-ID')}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-medium">Margin Bersih</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
