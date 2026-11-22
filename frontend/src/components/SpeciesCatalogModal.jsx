import React, { useEffect, useState } from 'react';
import { BookOpen, Fish, DollarSign, Scale, ArrowRight, Sparkles } from 'lucide-react';

export default function SpeciesCatalogModal({ onTestSpecies }) {
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => {
        setSpeciesList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">Katalog 8 Spesies Ikan Pesisir Prioritas</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Daftar spesies ikan lokal yang telah didukung model YOLO dan terkalibrasi dengan citra pada <code>Fish_Dataset</code>.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Memuat katalog spesies...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {speciesList.map((sp) => (
            <div
              key={sp.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-ocean-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-ocean-50 text-ocean-700 border border-ocean-200">
                    ID #{sp.id}
                  </span>
                  <span className="text-[10px] text-slate-400">{sp.category}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{sp.common_name}</h3>
                  <p className="text-xs text-ocean-600 font-semibold italic">{sp.scientific_name}</p>
                  <p className="text-[11px] text-slate-500">{sp.english_name}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rerata Harga:</span>
                    <strong className="text-emerald-700">Rp {sp.avg_price_idr.toLocaleString('id-ID')} / kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rerata Ukuran:</span>
                    <strong className="text-slate-700">{sp.avg_length_cm} cm</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onTestSpecies(sp.scientific_name)}
                  className="w-full py-2 bg-ocean-50 hover:bg-ocean-600 hover:text-white text-ocean-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Uji Deteksi Citra Ini</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
