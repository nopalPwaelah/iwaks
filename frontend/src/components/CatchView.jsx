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
  X
} from 'lucide-react';

export default function CatchView() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);

  // Form state
  const [locationName, setLocationName] = useState('TPI Muara Angke');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(1);
  const [quantity, setQuantity] = useState(50);
  const [weightKg, setWeightKg] = useState(20.0);
  const [notes, setNotes] = useState('');
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
  }, []);

  const handleCreateCatch = async (e) => {
    e.preventDefault();
    const payload = {
      location_name: locationName,
      notes: notes,
      details: [
        {
          species_id: parseInt(selectedSpeciesId),
          quantity: parseInt(quantity),
          weight_kg: parseFloat(weightKg)
        }
      ],
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
            <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Catatan Hasil Tangkapan Nelayan</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan data hasil tangkapan terstruktur per spesies, berat riil timbangan, dan rincian biaya operasional laut.
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
          {catches.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-ocean-300 transition space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-ocean-50 text-ocean-700 font-extrabold text-xs rounded-lg border border-ocean-200">
                    Trip #{c.id}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{c.location_name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{c.catch_date}</span>
                </div>
              </div>

              {/* Species details */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Komposisi Tangkapan:</span>
                {c.details?.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-800">{d.species_name}</span>
                    <span className="text-slate-600">
                      {d.quantity} ekor &bull; <strong className="text-slate-900">{d.weight_kg} kg</strong>
                    </span>
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
                  <span className="block text-[10px] text-slate-500">Est. Pendapatan</span>
                  <span className="font-bold text-emerald-800">Rp {(c.estimated_revenue || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-amber-50/60 p-2 rounded-xl">
                  <span className="block text-[10px] text-slate-500">Keuntungan Bersih</span>
                  <span className="font-bold text-amber-900">Rp {(c.estimated_profit || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {c.notes && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">&quot;{c.notes}&quot;</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Catch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Catatan Tangkapan Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Pendaratan / TPI</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ocean-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Spesies Ikan</label>
                  <select
                    value={selectedSpeciesId}
                    onChange={(e) => setSelectedSpeciesId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium focus:ring-2 focus:ring-ocean-500"
                  >
                    {speciesCatalog.map((s) => (
                      <option key={s.id} value={s.id}>{s.common_name} ({s.scientific_name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah (Ekor)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ocean-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Berat Riil Timbangan (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-ocean-500"
                  required
                />
              </div>

              {/* Operating costs inputs */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="block font-bold text-slate-800 text-[11px] uppercase tracking-wide">Biaya Operasional Trip Ini (Rp):</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">BBM / Solar</label>
                    <input
                      type="number"
                      value={fuelCost}
                      onChange={(e) => setFuelCost(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Balok Es</label>
                    <input
                      type="number"
                      value={iceCost}
                      onChange={(e) => setIceCost(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Upah ABK</label>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ocean-500"
                  placeholder="Kondisi cuaca, kedalaman penangkapan, dll."
                ></textarea>
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
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 shadow-md shadow-ocean-600/30"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
