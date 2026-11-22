import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Store,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  Send,
  Fish,
  Scale
} from 'lucide-react';

export default function PriceView({ userRole }) {
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' | 'offers'

  const [prices, setPrices] = useState([]);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Trade offers state (Revisi Dokumen: Pengelola Pasar review penawaran nelayan)
  const [tradeOffers, setTradeOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [reviewDecisions, setReviewDecisions] = useState({}); // { [catchId]: { [detailId]: { status, note } } }
  const [marketNotes, setMarketNotes] = useState({});

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
        setPrices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setPrices([]);
        setLoading(false);
      });
  };

  const fetchTradeOffers = () => {
    setLoadingOffers(true);
    fetch('/api/trade-offers')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTradeOffers(list);
        // Inisialisasi status default untuk review
        const initial = {};
        list.forEach((c) => {
          initial[c.catch_id] = {};
          (c.items || []).forEach((it) => {
            initial[c.catch_id][it.detail_id] = {
              status: it.status === 'pending' ? 'accepted' : it.status,
              note: it.response_note || ''
            };
          });
        });
        setReviewDecisions(initial);
        setLoadingOffers(false);
      })
      .catch((err) => {
        console.error(err);
        setTradeOffers([]);
        setLoadingOffers(false);
      });
  };

  useEffect(() => {
    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => setSpeciesCatalog(data));
  }, []);

  useEffect(() => {
    fetchPrices();
    fetchTradeOffers();
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

  // Handler Pengelola Pasar memutuskan Accept / Decline per item
  const handleItemDecision = (catchId, detailId, status) => {
    setReviewDecisions((prev) => ({
      ...prev,
      [catchId]: {
        ...prev[catchId],
        [detailId]: {
          ...prev[catchId]?.[detailId],
          status: status
        }
      }
    }));
  };

  const handleItemNoteChange = (catchId, detailId, note) => {
    setReviewDecisions((prev) => ({
      ...prev,
      [catchId]: {
        ...prev[catchId],
        [detailId]: {
          ...prev[catchId]?.[detailId],
          note: note
        }
      }
    }));
  };

  const handleSendReview = async (catchId) => {
    const decisions = reviewDecisions[catchId] || {};
    const items = Object.entries(decisions).map(([detailId, val]) => ({
      detail_id: parseInt(detailId),
      status: val.status,
      response_note: val.note || ''
    }));

    try {
      const res = await fetch(`/api/trade-offers/${catchId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_notes: marketNotes[catchId] || 'Telah ditinjau pengelola pasar.',
          items: items
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Keputusan berhasil dikirim ke nelayan! Status penawaran: ${data.trade_status}`);
        fetchTradeOffers();
      }
    } catch (err) {
      console.error('Gagal mengirim review:', err);
      alert('Gagal mengirim review keputusan.');
    }
  };

  const isMarketOfficer =
    userRole === 'Pengelola Pasar' ||
    userRole === 'Admin & Stakeholder (DKP)' ||
    userRole === 'Admin';

  const safePrices = Array.isArray(prices) ? prices : [];
  const safeOffers = Array.isArray(tradeOffers) ? tradeOffers : [];
  const pendingOffersCount = safeOffers.filter((o) => o.trade_status === 'submitted').length;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              {isMarketOfficer
                ? 'Portal Pasar Ikan & Intelijen Harga'
                : 'Papan Intelijen Harga Komoditas Ikan Pesisir'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isMarketOfficer
              ? 'Pembaruan harga komoditas harian pasar serta peninjauan penawaran ikan masuk dari nelayan.'
              : 'Acuan harga komoditas ikan harian terverifikasi di berbagai pasar pesisir.'}
          </p>
        </div>

        {/* Tab Switcher - Hanya untuk Pengelola Pasar & Admin */}
        {isMarketOfficer && (
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('prices')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'prices' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Papan Harga Komoditas
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'offers' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pengajuan Dagang Nelayan</span>
              {pendingOffersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">
                  {pendingOffersCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ================= TAB 1: HARGA PASAR ================= */}
      {(activeTab === 'prices' || !isMarketOfficer) && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">Semua Spesies Ikan</option>
                {speciesCatalog.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.common_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Update Harga hanya untuk Pengelola Pasar & Admin */}
            {isMarketOfficer && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Update Harga Pasar</span>
              </button>
            )}
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
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        Memuat data harga pasar...
                      </td>
                    </tr>
                  ) : safePrices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        Tidak ada data harga untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    safePrices.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.species_common}
                          <span className="block text-[10px] font-normal text-slate-400 italic">
                            {p.species_scientific}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <span className="font-semibold">{p.market_name}</span>
                          <span className="block text-[10px] text-slate-400">{p.market_city}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-black text-sm text-emerald-700">
                            Rp {p.price_per_kg.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400"> / kg</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center space-x-1.5">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.source_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.observed_at}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {!p.is_stale ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle className="w-3 h-3" />
                              <span>Segar ({p.data_age_days}h lalu)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3" />
                              <span>Kadaluarsa ({p.data_age_days}h lalu)</span>
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
        </div>
      )}

      {/* ================= TAB 2: PENGAJUAN DAGANG NELAYAN ================= */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Daftar Pengajuan Penjualan Ikan dari Nelayan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sebagai Pengelola Pasar, Anda berhak memilih komoditas mana yang ingin Anda{' '}
              <strong>Terima (Accept)</strong> atau <strong>Tolak (Decline)</strong> sesuai kapasitas dan kebutuhan lapak pasar.
            </p>
          </div>

          {loadingOffers ? (
            <div className="text-center py-12 text-slate-400 text-xs">Memuat pengajuan dagang...</div>
          ) : safeOffers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 text-xs">
              Belum ada pengajuan hasil tangkapan dari nelayan saat ini.
            </div>
          ) : (
            <div className="space-y-4">
              {safeOffers.map((offer) => (
                <div
                  key={offer.catch_id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-emerald-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {offer.fisherman_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-ocean-50 text-ocean-700 text-[10px] font-bold border border-ocean-200">
                          Trip #{offer.catch_id}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Diajukan ke: <strong>{offer.target_market_name}</strong> &bull; Waktu: {offer.created_at}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl">
                        Total: {offer.total_weight_kg} kg &bull; Est. Rp {offer.estimated_value.toLocaleString('id-ID')}
                      </span>
                      {offer.trade_status === 'submitted' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                          Menunggu Keputusan
                        </span>
                      )}
                      {offer.trade_status === 'accepted' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                          ✅ ACC Penuh
                        </span>
                      )}
                      {offer.trade_status === 'partially_accepted' && (
                        <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold text-[11px]">
                          ⚠️ ACC Sebagian
                        </span>
                      )}
                      {offer.trade_status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px]">
                          ❌ Ditolak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* List of items inside this offer */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pilih Komoditas yang Disetujui (Accept / Decline):
                    </span>
                    {offer.items.map((it) => {
                      const curDecision =
                        reviewDecisions[offer.catch_id]?.[it.detail_id]?.status || it.status;
                      const curNote =
                        reviewDecisions[offer.catch_id]?.[it.detail_id]?.note || '';

                      return (
                        <div
                          key={it.detail_id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                              <Fish className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{it.species_name}</p>
                              <span className="text-[11px] text-slate-500">
                                {it.quantity} ekor &bull; <strong>{it.weight_kg} kg</strong> &bull; Acuan: Rp {it.price_per_kg.toLocaleString('id-ID')}/kg
                              </span>
                            </div>
                          </div>

                          {/* Action Accept or Decline buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              placeholder="Alasan / Catatan (mis: siap tampung)"
                              value={curNote}
                              onChange={(e) =>
                                handleItemNoteChange(offer.catch_id, it.detail_id, e.target.value)
                              }
                              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 w-44"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleItemDecision(offer.catch_id, it.detail_id, 'accepted')
                              }
                              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 transition ${
                                curDecision === 'accepted'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept (Terima)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleItemDecision(offer.catch_id, it.detail_id, 'rejected')
                              }
                              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 transition ${
                                curDecision === 'rejected'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline (Tolak)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit review */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Pesan keseluruhan untuk nelayan..."
                      value={marketNotes[offer.catch_id] || ''}
                      onChange={(e) =>
                        setMarketNotes({ ...marketNotes, [offer.catch_id]: e.target.value })
                      }
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendReview(offer.catch_id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Keputusan ke Nelayan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Price Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Update Harga Komoditas Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Spesies Ikan</label>
                <select
                  value={newSpeciesId}
                  onChange={(e) => setNewSpeciesId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ocean-500 font-semibold"
                >
                  {speciesCatalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.common_name} ({s.scientific_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Pasar</label>
                <select
                  value={newMarketId}
                  onChange={(e) => setNewMarketId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ocean-500 font-semibold"
                >
                  <option value="1">Pasar Ikan Modern Muara Baru</option>
                  <option value="2">Pasar Ikan Glodok Petak Sembilan</option>
                  <option value="3">Pasar Induk Kramat Jati</option>
                  <option value="4">Pasar Ikan Mayestik</option>
                  <option value="5">Pasar Pabean Cantian Surabaya</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Harga Per Kilogram (IDR)</label>
                <input
                  type="number"
                  step="1000"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ocean-500 font-bold text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sumber Pengamatan (Provenance)</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ocean-500"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition"
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
