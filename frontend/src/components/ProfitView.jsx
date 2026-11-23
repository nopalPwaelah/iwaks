import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Scale,
  DollarSign,
  Fuel,
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  PieChart,
  Plus,
  Trash2,
  Fish
} from 'lucide-react';

export default function ProfitView() {
  const [speciesCatalog, setSpeciesCatalog] = useState([]);

  // Multi-species commodity list (Revisi: Banyak pilihan komoditas, tidak satu per satu)
  const [catchItems, setCatchItems] = useState([
    { id: 1, species_id: 1, species_name: 'Ikan Bandeng', weight_kg: 35.0, price_per_kg: 38000 },
    { id: 2, species_id: 7, species_name: 'Ikan Kembung', weight_kg: 25.0, price_per_kg: 42000 }
  ]);

  // Operational costs (Biaya Riil Melaut)
  const [fuelCost, setFuelCost] = useState(120000);
  const [iceCost, setIceCost] = useState(40000);
  const [laborCost, setLaborCost] = useState(150000);
  const [otherCost, setOtherCost] = useState(25000);

  useEffect(() => {
    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSpeciesCatalog(list);
        if (list.length > 0 && catchItems.length === 0) {
          setCatchItems([
            { id: 1, species_id: list[0].id, species_name: list[0].common_name, weight_kg: 30.0, price_per_kg: list[0].avg_price_idr }
          ]);
        }
      })
      .catch(() => setSpeciesCatalog([]));
  }, []);

  const handleAddCommodity = () => {
    const defaultSp = speciesCatalog[0] || { id: 1, common_name: 'Ikan Bandeng', avg_price_idr: 38000 };
    setCatchItems([
      ...catchItems,
      {
        id: Date.now(),
        species_id: defaultSp.id,
        species_name: defaultSp.common_name,
        weight_kg: 15.0,
        price_per_kg: defaultSp.avg_price_idr
      }
    ]);
  };

  const handleRemoveCommodity = (id) => {
    if (catchItems.length <= 1) return;
    setCatchItems(catchItems.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setCatchItems(
      catchItems.map((item) => {
        if (item.id !== id) return item;

        if (field === 'species_id') {
          const sp = speciesCatalog.find((s) => s.id === parseInt(value));
          return {
            ...item,
            species_id: parseInt(value),
            species_name: sp ? sp.common_name : item.species_name,
            price_per_kg: sp ? sp.avg_price_idr : item.price_per_kg
          };
        }

        return { ...item, [field]: parseFloat(value) || 0 };
      })
    );
  };

  // Kalkulasi Finansial Multi-Spesies
  const totalWeightKg = catchItems.reduce((acc, it) => acc + (parseFloat(it.weight_kg) || 0), 0);
  const grossRevenue = catchItems.reduce(
    (acc, it) => acc + (parseFloat(it.weight_kg) || 0) * (parseFloat(it.price_per_kg) || 0),
    0
  );
  const totalCosts =
    (parseFloat(fuelCost) || 0) +
    (parseFloat(iceCost) || 0) +
    (parseFloat(laborCost) || 0) +
    (parseFloat(otherCost) || 0);

  const netProfit = grossRevenue - totalCosts;
  const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const avgPricePerKg = totalWeightKg > 0 ? grossRevenue / totalWeightKg : 0;
  const breakEvenWeight = avgPricePerKg > 0 ? totalCosts / avgPricePerKg : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Kalkulator Analisis Keuntungan (Multi-Spesies)
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Perhitungan riil marjin nelayan untuk berbagai jenis ikan hasil tangkapan dalam satu trip
          melaut, dikurangi seluruh komponen operasional kapal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Fish className="w-4 h-4 text-ocean-600" />
              <span>1. Komposisi Tangkapan Ikan (Banyak Spesies)</span>
            </h2>
            <button
              type="button"
              onClick={handleAddCommodity}
              className="flex items-center space-x-1 text-xs font-bold text-ocean-600 hover:text-ocean-700 bg-ocean-50 hover:bg-ocean-100 px-2.5 py-1 rounded-lg border border-ocean-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Ikan</span>
            </button>
          </div>

          {/* List of species inputs */}
          <div className="space-y-3">
            {catchItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 text-xs"
              >
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Spesies Ikan #{idx + 1}
                  </label>
                  <select
                    value={item.species_id}
                    onChange={(e) => handleItemChange(item.id, 'species_id', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                  >
                    {speciesCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.common_name} ({s.scientific_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-28">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Berat (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={item.weight_kg}
                    onChange={(e) => handleItemChange(item.id, 'weight_kg', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-ocean-500"
                  />
                </div>

                <div className="w-32">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Harga Acuan (Rp/kg)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={item.price_per_kg}
                    onChange={(e) => handleItemChange(item.id, 'price_per_kg', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-emerald-700 focus:ring-2 focus:ring-ocean-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveCommodity(item.id)}
                    disabled={catchItems.length <= 1}
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                    title="Hapus baris komoditas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-ocean-50 p-3 rounded-xl border border-ocean-100 text-xs">
            <span className="font-bold text-ocean-950">
              Total Tangkapan: {totalWeightKg.toFixed(1)} kg ({catchItems.length} Spesies)
            </span>
            <span className="font-extrabold text-ocean-800">
              Est. Nilai Bruto: Rp {grossRevenue.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Operational Costs */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Fuel className="w-4 h-4 text-amber-600" />
              <span>2. Komponen Biaya Operasional Melaut</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bahan Bakar Solar (Rp)</label>
                <input
                  type="number"
                  step="5000"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Balok Es Pendingin (Rp)</label>
                <input
                  type="number"
                  step="5000"
                  value={iceCost}
                  onChange={(e) => setIceCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Upah ABK / Tenaga Kerja (Rp)</label>
                <input
                  type="number"
                  step="10000"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Biaya Perbekalan / Lainnya (Rp)</label>
                <input
                  type="number"
                  step="5000"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Economic Outputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Ringkasan Analisis Keuntungan
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Pendapatan Kotor (Bruto)</span>
                <span className="text-sm font-extrabold text-slate-900">
                  Rp {grossRevenue.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Total Beban Operasional</span>
                <span className="text-sm font-bold text-rose-600">
                  - Rp {totalCosts.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 bg-slate-50 px-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900">Keuntungan Bersih (Net Profit)</span>
                <span
                  className={`text-base font-extrabold ${
                    netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  Rp {netProfit.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="block text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                    Marjin Bersih
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    {marginPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-ocean-50 rounded-xl border border-ocean-200 text-center">
                  <span className="block text-[10px] text-ocean-800 font-bold uppercase tracking-wider">
                    Titik Impas (BEP)
                  </span>
                  <span className="text-lg font-black text-ocean-900">
                    {breakEvenWeight.toFixed(1)} kg
                  </span>
                </div>
              </div>

              {netProfit < 0 ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Hasil tangkapan belum menutup biaya melaut. Minimal tangkapan impas:{' '}
                    <strong>{breakEvenWeight.toFixed(1)} kg</strong>.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Trip melaut untung! Marjin keuntungan Anda sebesar{' '}
                    <strong>{marginPercent.toFixed(1)}%</strong>.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
