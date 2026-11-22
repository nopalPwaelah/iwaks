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
  PieChart
} from 'lucide-react';

export default function ProfitView() {
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(1);
  const [weightKg, setWeightKg] = useState(30.0);
  const [customPrice, setCustomPrice] = useState(38000);

  // Operational costs
  const [fuelCost, setFuelCost] = useState(120000);
  const [iceCost, setIceCost] = useState(40000);
  const [laborCost, setLaborCost] = useState(150000);
  const [otherCost, setOtherCost] = useState(25000);

  useEffect(() => {
    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => {
        setSpeciesCatalog(data);
        if (data.length > 0) {
          setSelectedSpeciesId(data[0].id);
          setCustomPrice(data[0].avg_price_idr);
        }
      });
  }, []);

  const handleSpeciesChange = (spId) => {
    setSelectedSpeciesId(spId);
    const sp = speciesCatalog.find((s) => s.id === parseInt(spId));
    if (sp) {
      setCustomPrice(sp.avg_price_idr);
    }
  };

  // Calculations per PDA Section 4.2
  const grossRevenue = (parseFloat(weightKg) || 0) * (parseFloat(customPrice) || 0);
  const totalCosts = (parseFloat(fuelCost) || 0) + (parseFloat(iceCost) || 0) + (parseFloat(laborCost) || 0) + (parseFloat(otherCost) || 0);
  const netProfit = grossRevenue - totalCosts;
  const marginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const breakEvenWeight = customPrice > 0 ? totalCosts / customPrice : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">Kalkulator Analisis Pendapatan &amp; Keuntungan</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Simulasi transparansi ekonomi nelayan berbasis rumus SRS FR-12 &amp; FR-13: Pendapatan kotor dikurangi seluruh komponen biaya riil operasional melaut.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Parameter Tangkapan &amp; Penjualan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Spesies Komoditas</label>
              <select
                value={selectedSpeciesId}
                onChange={(e) => handleSpeciesChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
              >
                {speciesCatalog.map((s) => (
                  <option key={s.id} value={s.id}>{s.common_name} ({s.scientific_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Berat Tangkapan Riil (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-ocean-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Harga Jual per Kilogram (IDR)
            </label>
            <input
              type="number"
              step="1000"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-ocean-700 focus:ring-2 focus:ring-ocean-500"
            />
            <span className="text-[10px] text-slate-400">Dapat disesuaikan dengan harga tawaran tengkulak/pembeli di TPI.</span>
          </div>

          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 pt-2">
            2. Rincian Biaya Operasional (Beban Melaut)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Fuel className="w-3.5 h-3.5 text-amber-500" />
                <span>BBM / Solar (IDR)</span>
              </label>
              <input
                type="number"
                step="5000"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Package className="w-3.5 h-3.5 text-cyan-500" />
                <span>Balok Es Pendingin (IDR)</span>
              </label>
              <input
                type="number"
                step="5000"
                value={iceCost}
                onChange={(e) => setIceCost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>Upah ABK / Tenaga Kerja (IDR)</span>
              </label>
              <input
                type="number"
                step="10000"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biaya Lain-lain &amp; Logistik (IDR)
              </label>
              <input
                type="number"
                step="5000"
                value={otherCost}
                onChange={(e) => setOtherCost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Right: Economic Output Dashboard (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ocean-400">Hasil Kalkulasi Ekonomi</span>
              <span className="text-[10px] font-semibold bg-ocean-950 text-ocean-300 px-2 py-0.5 rounded border border-ocean-800">
                Formula SRS
              </span>
            </div>

            {/* Net Profit Card */}
            <div className={`p-5 rounded-2xl border transition ${
              netProfit >= 0 ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-red-950/40 border-red-500/40'
            }`}>
              <span className="text-xs font-medium text-slate-300">Estimasi Keuntungan Bersih (Net Profit)</span>
              <div className={`text-3xl font-black mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Rp {netProfit.toLocaleString('id-ID')}
              </div>
              <div className="flex items-center space-x-2 mt-2 text-xs">
                <span className="text-slate-400">Margin Keuntungan:</span>
                <span className={`font-bold ${marginPercent >= 20 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {marginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total Pendapatan Bruto ({weightKg} kg &times; Rp {customPrice.toLocaleString('id-ID')})</span>
                <span className="font-bold text-white">Rp {grossRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total Biaya Operasional</span>
                <span className="font-bold text-red-400">- Rp {totalCosts.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Titik Impas (Break-even Catch)</span>
                <span className="font-bold text-ocean-300">{breakEvenWeight.toFixed(1)} kg</span>
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Proporsi Pengeluaran vs Keuntungan:</span>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, Math.max(0, (totalCosts / (grossRevenue || 1)) * 100))}%` }}
                  className="bg-amber-500 h-full"
                  title="Biaya Operasional"
                ></div>
                <div
                  style={{ width: `${Math.max(0, marginPercent)}%` }}
                  className="bg-emerald-500 h-full"
                  title="Keuntungan Bersih"
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  <span>Biaya Operasional ({((totalCosts / (grossRevenue || 1)) * 100).toFixed(0)}%)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Keuntungan ({Math.max(0, marginPercent).toFixed(0)}%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-ocean-400 flex-shrink-0 mt-0.5" />
            <p>
              Simulasi ini membantu nelayan memperkirakan batas minimal hasil tangkapan agar tidak merugi saat melaut.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
