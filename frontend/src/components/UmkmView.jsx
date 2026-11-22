import React, { useEffect, useState } from 'react';
import {
  Store,
  Phone,
  MapPin,
  Tag,
  Package,
  Plus,
  X,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function UmkmView({ currentUser }) {
  const [umkms, setUmkms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedUmkmId, setSelectedUmkmId] = useState(1);

  // New product form
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Olahan Ikan');
  const [productPrice, setProductPrice] = useState(30000);
  const [productUnit, setProductUnit] = useState('Kemasan 250gr');
  const [productDesc, setProductDesc] = useState('');

  const fetchUmkms = () => {
    setLoading(true);
    fetch('/api/umkm')
      .then((r) => r.json())
      .then((data) => {
        setUmkms(data);
        if (data.length > 0) setSelectedUmkmId(data[0].id);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUmkms();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/umkm/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          umkm_id: parseInt(selectedUmkmId),
          product_name: productName,
          category: productCategory,
          price: parseFloat(productPrice),
          unit: productUnit,
          description: productDesc
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProductModal(false);
        setProductName('');
        setProductDesc('');
        fetchUmkms();
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
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Pemberdayaan &amp; Kemitraan UMKM Pesisir</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Menghubungkan nelayan pemasok hasil laut dengan sentra usaha pengolahan ikan, kerupuk, dan produk bernilai tambah.
          </p>
        </div>

        <button
          onClick={() => setShowAddProductModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk UMKM</span>
        </button>
      </div>

      {/* UMKM List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Memuat direktori UMKM...</div>
      ) : (
        <div className="space-y-6">
          {umkms.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              {/* UMKM Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {u.category}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{u.business_name}</h2>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">{u.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.address}, {u.city}</span>
                    </div>
                    <span>&bull;</span>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-700">{u.contact_phone}</span>
                    </div>
                    <span>&bull;</span>
                    <span className="text-slate-600">Pemilik: <strong>{u.owner_name}</strong></span>
                  </div>
                </div>

                {/* Raw Material Need Banner */}
                {u.raw_material_needs && (
                  <div className="bg-ocean-50/80 p-3 rounded-xl border border-ocean-200 max-w-sm text-xs">
                    <div className="flex items-center space-x-1 text-ocean-950 font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-ocean-600" />
                      <span>Kebutuhan Pasokan Bahan Baku:</span>
                    </div>
                    <p className="text-ocean-800 text-[11px] leading-relaxed">{u.raw_material_needs}</p>
                  </div>
                )}
              </div>

              {/* Products Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Katalog Produk Olahan:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {u.products?.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition space-y-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900">{p.product_name}</h4>
                        <span className="text-emerald-700 font-extrabold text-xs">
                          Rp {p.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{p.description}</div>
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60">
                        <span>Kategori: {p.category}</span>
                        <span className="font-semibold text-slate-600">{p.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Produk UMKM Baru</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Unit Usaha UMKM</label>
                <select
                  value={selectedUmkmId}
                  onChange={(e) => setSelectedUmkmId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {umkms.map((u) => (
                    <option key={u.id} value={u.id}>{u.business_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Pempek Ikan Kembung Tenggiri"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga (IDR)</label>
                  <input
                    type="number"
                    step="1000"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan Kemasan</label>
                  <input
                    type="text"
                    value={productUnit}
                    onChange={(e) => setProductUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: 1 Box (500gr)"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Produk</label>
                <textarea
                  rows="2"
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="Informasi keunggulan bahan baku, masa simpan, dll."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
