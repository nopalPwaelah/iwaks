import React, { useEffect, useState } from 'react';
import {
  Store,
  Phone,
  MapPin,
  Tag,
  Package,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  ArrowRight,
  Fish
} from 'lucide-react';

export default function UmkmView({ currentUser, onOpenAuthModal }) {
  const [umkms, setUmkms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Tab mode untuk pemilik UMKM: 'my_store' (default) atau 'public_preview'
  const [umkmTab, setUmkmTab] = useState('my_store');

  // New product form state
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Olahan Ikan');
  const [productPrice, setProductPrice] = useState(35000);
  const [productUnit, setProductUnit] = useState('Kemasan 250gr');
  const [productDesc, setProductDesc] = useState('');

  const isUmkmOwner = currentUser?.role === 'UMKM';
  const isAdmin = currentUser?.role === 'Admin & Stakeholder (DKP)' || currentUser?.role === 'Admin';
  const isPublic = !isUmkmOwner && !isAdmin;

  const fetchUmkms = () => {
    setLoading(true);
    fetch('/api/umkm')
      .then((r) => r.json())
      .then((data) => {
        setUmkms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Gagal mengambil data UMKM:', err);
        setUmkms([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUmkms();
  }, []);

  // Cari UMKM milik pengguna saat login sebagai UMKM
  const myUmkm = isUmkmOwner
    ? umkms.find((u) =>
        (currentUser?.id && u.user_id === currentUser.id) ||
        (currentUser?.name && u.owner_name && u.owner_name.toLowerCase().includes(currentUser.name.toLowerCase()))
      ) || umkms[0]
    : null;

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productName || !productPrice) return;

    const targetUmkmId = myUmkm ? myUmkm.id : (umkms[0]?.id || 1);
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/umkm/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          umkm_id: parseInt(targetUmkmId),
          product_name: productName,
          category: productCategory,
          price: parseFloat(productPrice),
          unit: productUnit,
          description: productDesc
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Produk "${productName}" berhasil ditambahkan ke etalase jualan Anda!` });
        setProductName('');
        setProductDesc('');
        setProductPrice(35000);
        fetchUmkms();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Gagal menambahkan produk.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Terjadi kesalahan koneksi server.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId, pName) => {
    if (!window.confirm(`Hapus produk "${pName}" dari etalase jualan Anda?`)) return;

    try {
      const res = await fetch(`/api/umkm/products/${productId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Produk "${pName}" berhasil dihapus.` });
        fetchUmkms();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Gagal menghapus produk:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-sm">
              <Store className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isUmkmOwner
                  ? `Kelola Produk Jualan: ${myUmkm?.business_name || 'Toko Saya'}`
                  : 'Rekomendasi Sentra UMKM & Produk Olahan Pesisir'}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 inline-block mt-0.5">
                {isUmkmOwner ? 'Mode Penjual UMKM' : 'Etalase Terbuka Publik'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-2xl">
            {isUmkmOwner
              ? 'Tambahkan dan kelola barang olahan hasil laut yang Anda jual. Produk yang Anda masukkan otomatis tampil di etalase belanja publik.'
              : 'Jelajahi berbagai aneka produk olahan ikan, kerupuk, abon, dan makanan olahan laut bermutu tinggi langsung dari pelaku UMKM pesisir.'}
          </p>
        </div>

        {/* Tab switch untuk akun UMKM */}
        {isUmkmOwner && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setUmkmTab('my_store')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                umkmTab === 'my_store'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 text-amber-600" />
              <span>Produk Usaha Saya</span>
            </button>
            <button
              onClick={() => setUmkmTab('public_preview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                umkmTab === 'public_preview'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Lihat Etalase Publik</span>
            </button>
          </div>
        )}

        {/* Call to Action for Public Guests */}
        {isPublic && (
          <button
            onClick={onOpenAuthModal}
            className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20 transition flex items-center space-x-1.5"
          >
            <Store className="w-4 h-4" />
            <span>Punya Usaha UMKM? Masuk / Daftar</span>
          </button>
        )}
      </div>

      {/* Alert Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ================= TAMPILAN KHUSUS PEMILIK UMKM: TOKO & PRODUK SAYA ================= */}
      {isUmkmOwner && umkmTab === 'my_store' && (
        <div className="space-y-6">
          {/* 1. Form Tambahkan Produk yang Dijual */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Tambahkan Produk yang Dijual
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Unit Usaha: <strong className="text-slate-800">{myUmkm?.business_name}</strong>
              </span>
            </div>

            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nama Produk Olahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bandeng Presto Vacuum Gurih / Kerupuk Kemplang Super"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Kategori Produk
                </label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Olahan Ikan">Olahan Ikan</option>
                  <option value="Camilan Laut">Camilan Laut</option>
                  <option value="Makanan Siap Saji">Makanan Siap Saji</option>
                  <option value="Olahan Kering">Olahan Kering</option>
                  <option value="Ikan Asap & Asin">Ikan Asap &amp; Asin</option>
                  <option value="Bumbu & Sambal Pesisir">Bumbu &amp; Sambal Pesisir</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Harga Jual (IDR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="35000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Satuan Kemasan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kemasan 250gr / 1 Box (2 ekor) / Toples 300gr"
                  value={productUnit}
                  onChange={(e) => setProductUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Deskripsi / Keterangan Singkat
                </label>
                <input
                  type="text"
                  placeholder="Komposisi bahan, ketahanan simpan, atau keunggulan rasa..."
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Tambahkan Produk yang Dijual'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Daftar Produk Milik Sendiri (Penjualan Toko Saya) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Daftar Produk yang Sedang Anda Jual
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Produk-produk ini aktif tampil di etalase pembeli publik.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Total: {myUmkm?.products?.length || 0} Produk Aktif
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Memuat produk Anda...</div>
            ) : !myUmkm?.products || myUmkm.products.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Belum ada produk yang dijual.</p>
                <p className="text-xs text-slate-400">Gunakan formulir di atas untuk mempublikasikan produk olahan pertama Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myUmkm.products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-amber-300 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                          {p.category}
                        </span>
                        <span className="text-emerald-700 font-extrabold text-sm">
                          Rp {(p.price || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {p.product_name}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {p.description || 'Produk olahan perikanan khas pesisir siap dikonsumsi.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {p.unit}
                      </span>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.product_name)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                        title="Hapus produk ini dari etalase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Profil Informasi Usaha & Pasokan Bahan Baku */}
          {myUmkm && (
            <div className="bg-gradient-to-r from-ocean-50 to-teal-50 rounded-2xl p-5 border border-ocean-200 flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-ocean-700" />
                  <h3 className="text-sm font-bold text-ocean-950">
                    Informasi Profil Toko: {myUmkm.business_name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{myUmkm.address}, {myUmkm.city}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold">{myUmkm.contact_phone}</span>
                  </div>
                </div>
              </div>

              {myUmkm.raw_material_needs && (
                <div className="bg-white/80 p-3 rounded-xl border border-ocean-200 max-w-sm text-xs">
                  <span className="font-bold text-ocean-900 block mb-0.5">
                    Kebutuhan Pasokan Bahan Baku dari Nelayan:
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {myUmkm.raw_material_needs}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAMPILAN PUBLIK / PREVIEW: PENJUALAN ORANG LAIN & SELURUH UMKM ================= */}
      {(isPublic || isAdmin || (isUmkmOwner && umkmTab === 'public_preview')) && (
        <div className="space-y-6">
          <div className="bg-ocean-50/70 p-4 rounded-2xl border border-ocean-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-5 h-5 text-ocean-700 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-ocean-950">
                  Etalase Belanja Hasil Olahan Pesisir (Publik)
                </h3>
                <p className="text-xs text-ocean-800">
                  Menampilkan seluruh produk olahan yang dijual oleh mitra UMKM pesisir untuk masyarakat umum, wisatawan, dan pembeli.
                </p>
              </div>
            </div>
          </div>

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
                          <Fish className="w-3.5 h-3.5 text-ocean-600" />
                          <span>Kebutuhan Pasokan Bahan Baku:</span>
                        </div>
                        <p className="text-ocean-800 text-[11px] leading-relaxed">{u.raw_material_needs}</p>
                      </div>
                    )}
                  </div>

                  {/* Products Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Katalog Produk Olahan yang Dijual:
                    </h3>
                    {!u.products || u.products.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 text-xs italic">
                        Belum ada produk aktif yang didaftarkan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {u.products.map((p) => (
                          <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition space-y-1.5 text-xs">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-900">{p.product_name}</h4>
                              <span className="text-emerald-700 font-extrabold text-xs">
                                Rp {(p.price || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 leading-relaxed">
                              {p.description || 'Olahan hasil laut bermutu tinggi khas pesisir.'}
                            </div>
                            <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60">
                              <span>Kategori: {p.category}</span>
                              <span className="font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {p.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
