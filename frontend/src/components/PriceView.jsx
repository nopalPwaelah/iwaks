import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Store,
  Plus,
  X
} from 'lucide-react';

export default function PriceView({ userRole }) {
  const [prices, setPrices] = useState([]);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form for new price
  const [newSpeciesId, setNewSpeciesId] = useState(1);
  const [newMarketId, setNewMarketId] = useState(1);
  const [newPrice, setNewPrice] = useState(40000);
  const [newSource, setNewSource] = useState('Survei Petugas Pasar');

  const fetchPrices = () => {
    setLoading(true);
    let url = '/api/prices';
    if (selectedSpecies) {
      url += `?species_id=${selectedSpecies}`;
    }
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setPrices(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => setSpeciesCatalog(data));
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [selectedSpecies]);

  const handleAddPrice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species_id: parseInt(newSpeciesId),
          market_id: parseInt(newMarketId),
          price_per_kg: parseFloat(newPrice),
          source_name: newSource,
          currency: 'IDR'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchPrices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Intelijen Harga Komoditas Pasar</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data harga pasar terverifikasi dengan informasi satuan, tanggal observasi, dan transparansi sumber (Provenance).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Species Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">Semua Spesies Ikan</option>
              {speciesCatalog.map((s) => (
                <option key={s.id} value={s.id}>{s.common_name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Update Harga</span>
          </button>
        </div>
      </div>

      {/* Price Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Spesies Ikan</th>
                <th className="py-3.5 px-4">Nama Pasar &amp; Kota</th>
                <th className="py-3.5 px-4">Harga / kg</th>
                <th className="py-3.5 px-4">Sumber Data (Provenance)</th>
                <th className="py-3.5 px-4">Waktu Observasi</th>
                <th className="py-3.5 px-4">Status Kesegaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Memuat data harga pasar...</td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Tidak ada data harga untuk filter ini.</td>
                </tr>
              ) : (
                prices.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.species_common}</div>
                      <div className="text-[11px] text-slate-400 italic">{p.species_scientific}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{p.market_name}</div>
                      <div className="text-[11px] text-slate-500">{p.market_city}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-extrabold text-emerald-700">
                        Rp {p.price_per_kg.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-400"> / kg</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium text-[11px] border border-slate-200">
                        {p.source_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{p.observed_at}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.is_fresh ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Mutakhir (&lt; 3 hari)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>Perlu Verifikasi ({p.age_days} hari)</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Price Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Perbarui / Input Harga Pasar</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Spesies Ikan</label>
                <select
                  value={newSpeciesId}
                  onChange={(e) => setNewSpeciesId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {speciesCatalog.map((s) => (
                    <option key={s.id} value={s.id}>{s.common_name} ({s.scientific_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pasar Tujuan</label>
                <select
                  value={newMarketId}
                  onChange={(e) => setNewMarketId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1">Pasar Ikan Modern Muara Baru (Jakarta Utara)</option>
                  <option value="2">Pasar Ikan Glodok Petak Sembilan (Jakarta Barat)</option>
                  <option value="3">Pasar Induk Kramat Jati (Jakarta Timur)</option>
                  <option value="4">Pasar Ikan Mayestik (Jakarta Selatan)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Harga per Kilogram (IDR)</label>
                <input
                  type="number"
                  step="500"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sumber Data (Provenance)</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Petugas Lelang TPI, Dinas Kelautan"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30"
                >
                  Simpan Harga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
