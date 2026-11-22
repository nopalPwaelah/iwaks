import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Scale,
  Calendar,
  MapPin,
  DollarSign,
  Fuel,
  Users,
  Package,
  X,
  Store,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Trash2
} from 'lucide-react';

export default function CatchView() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [markets, setMarkets] = useState([]);

  // Form state
  const [locationName, setLocationName] = useState('TPI Muara Angke');
  const [fishermanName, setFishermanName] = useState('Pak Budi (KM Bahari 01)');
  const [targetMarketId, setTargetMarketId] = useState(1);
  const [isSubmitToMarket, setIsSubmitToMarket] = useState(true);
  const [notes, setNotes] = useState('');

  // Multi-species commodity rows
  const [formRows, setFormRows] = useState([
    { id: 1, species_id: 1, quantity: 40, weight_kg: 20.0 }
  ]);

  // Operational costs
  const [fuelCost, setFuelCost] = useState(120000);
  const [iceCost, setIceCost] = useState(35000);
  const [laborCost, setLaborCost] = useState(100000);

  const fetchCatches = () => {
    setLoading(true);
    fetch('/api/catches')
      .then((r) => r.json())
      .then((data) => {
        setCatches(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCatches();
    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => setSpeciesCatalog(data));

    fetch('/api/markets')
      .then((r) => r.json())
      .then((data) => {
        setMarkets(data);
        if (data.length > 0) setTargetMarketId(data[0].id);
      });
  }, []);

  const handleAddFormRow = () => {
    const defaultSp = speciesCatalog[0] || { id: 1 };
    setFormRows([
      ...formRows,
      { id: Date.now(), species_id: defaultSp.id, quantity: 20, weight_kg: 10.0 }
    ]);
  };

  const handleRemoveFormRow = (id) => {
    if (formRows.length <= 1) return;
    setFormRows(formRows.filter((r) => r.id !== id));
  };

  const handleFormRowChange = (id, field, value) => {
    setFormRows(
      formRows.map((r) => (r.id === id ? { ...r, [field]: parseFloat(value) || value } : r))
    );
  };

  const handleCreateCatch = async (e) => {
    e.preventDefault();
    const payload = {
      location_name: locationName,
      target_market_id: isSubmitToMarket ? parseInt(targetMarketId) : null,
      trade_status: isSubmitToMarket ? 'submitted' : 'none',
      fisherman_name: fishermanName,
      notes: notes,
      details: formRows.map((r) => ({
        species_id: parseInt(r.species_id),
        quantity: parseInt(r.quantity),
        weight_kg: parseFloat(r.weight_kg)
      })),
      costs: [
        { cost_type: 'BBM / Solar', amount: parseFloat(fuelCost) || 0 },
        { cost_type: 'Balok Es Pendingin', amount: parseFloat(iceCost) || 0 },
        { cost_type: 'Upah ABK / Tenaga Kerja', amount: parseFloat(laborCost) || 0 }
      ]
    };

    try {
      const res = await fetch('/api/catches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchCatches();
        alert(
          isSubmitToMarket
            ? 'Catatan disimpan & diajukan ke Pengelola Pasar! Menunggu notifikasi ACC/Decline.'
            : 'Catatan tangkapan berhasil disimpan.'
        );
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan catatan tangkapan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Catatan &amp; Status Perdagangan Tangkapan
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status verifikasi dan persetujuan (Accept / Decline) hasil tangkapan dari Pengelola Pasar Ikan.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-ocean-600/30 transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Catatan Tangkapan</span>
        </button>
      </div>

      {/* Catches Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Memuat catatan tangkapan...</div>
      ) : catches.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          Belum ada catatan tangkapan. Klik tombol &quot;Tambah Catatan Tangkapan&quot; atau simpan dari hasil deteksi AI.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catches.map((c) => {
            const isTrade = c.trade_status && c.trade_status !== 'none';
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-ocean-300 transition space-y-3"
              >
                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-ocean-50 text-ocean-700 font-extrabold text-xs rounded-lg border border-ocean-200">
                      Trip #{c.id}
                    </span>
                    <div className="text-xs">
                      <p className="font-bold text-slate-800 leading-tight">
                        {c.user_name || 'Nelayan'}
                      </p>
                      <span className="text-[10px] text-slate-400">{c.location_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{c.catch_date}</span>
                  </div>
                </div>

                {/* Status Badges Penawaran Pasar */}
                {isTrade && (
                  <div className="p-2.5 rounded-xl text-xs flex items-center justify-between border">
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-slate-700">
                        Target: {c.target_market_name || 'Pasar Ikan'}
                      </span>
                    </div>

                    {c.trade_status === 'submitted' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Menunggu ACC Pasar</span>
                      </span>
                    )}

                    {c.trade_status === 'accepted' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>ACC: Diterima Pasar</span>
                      </span>
                    )}

                    {c.trade_status === 'partially_accepted' && (
                      <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold text-[11px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-sky-600" />
                        <span>Sebagian Diterima</span>
                      </span>
                    )}

                    {c.trade_status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px] flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>Ditolak Pasar</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Catatan dari pengelola pasar (jika ada feedback) */}
                {c.market_notes && (
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-[11px]">
                    <strong>Catatan Pengelola Pasar:</strong> &quot;{c.market_notes}&quot;
                  </div>
                )}

                {/* Species details with individual status */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Komposisi &amp; Status Per Komoditas:
                  </span>
                  {c.details?.map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{d.species_name}</span>
                        <span className="text-[11px] text-slate-500">
                          ({d.quantity} ekor &bull; {d.weight_kg} kg)
                        </span>
                      </div>

                      {/* Tag ACC / Decline per item */}
                      <div>
                        {d.status === 'accepted' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            ✅ ACC
                          </span>
                        )}
                        {d.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                            ❌ Ditolak
                          </span>
                        )}
                        {d.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Economic Summary */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-ocean-50/60 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-500">Total Berat</span>
                    <span className="font-bold text-ocean-900">{c.total_weight_kg} kg</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-500">Est. Nilai Jual</span>
                    <span className="font-bold text-emerald-800">
                      Rp {(c.estimated_revenue || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="bg-amber-50/60 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-500">Est. Keuntungan</span>
                    <span className="font-bold text-amber-900">
                      Rp {(c.estimated_profit || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    &quot;{c.notes}&quot;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Catch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Catatan &amp; Ajukan ke Pasar</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Nelayan / Kapal</label>
                  <input
                    type="text"
                    value={fishermanName}
                    onChange={(e) => setFishermanName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Pendaratan / TPI</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                    required
                  />
                </div>
              </div>

              {/* Multi-Spesies Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Daftar Komoditas Ikan</label>
                  <button
                    type="button"
                    onClick={handleAddFormRow}
                    className="text-[11px] font-bold text-ocean-600 bg-ocean-50 hover:bg-ocean-100 px-2.5 py-1 rounded-lg border border-ocean-200 transition flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Ikan</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formRows.map((r, idx) => (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-6">
                        <select
                          value={r.species_id}
                          onChange={(e) => handleFormRowChange(r.id, 'species_id', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-semibold text-slate-800 text-xs"
                        >
                          {speciesCatalog.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.common_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Ekor"
                          value={r.quantity}
                          onChange={(e) => handleFormRowChange(r.id, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-slate-800 text-xs text-center"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          placeholder="kg"
                          value={r.weight_kg}
                          onChange={(e) => handleFormRowChange(r.id, 'weight_kg', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-slate-800 text-xs text-center"
                        />
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveFormRow(r.id)}
                          disabled={formRows.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opsi Ajukan ke Pasar */}
              <div className="p-3 bg-ocean-50 rounded-xl border border-ocean-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-ocean-950">
                  <input
                    type="checkbox"
                    checked={isSubmitToMarket}
                    onChange={(e) => setIsSubmitToMarket(e.target.checked)}
                    className="rounded text-ocean-600 focus:ring-ocean-500 w-4 h-4"
                  />
                  <span>Ajukan Penawaran ke Pengelola Pasar Ikan</span>
                </label>

                {isSubmitToMarket && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Pilih Pasar Tujuan
                    </label>
                    <select
                      value={targetMarketId}
                      onChange={(e) => setTargetMarketId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                    >
                      {markets.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.market_name} ({m.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ocean-500"
                ></textarea>
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
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 shadow-md shadow-ocean-600/30 transition flex items-center justify-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simpan Catatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
