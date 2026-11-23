import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Fish,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Save,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Plus,
  Scale,
  Send,
  Store,
  Calculator,
  Navigation
} from 'lucide-react';

export default function AiDetectionView({ onCatchSaved, onNavigate }) {
  // Input mode: 'ai' (Deteksi Sensor AI YOLO) vs 'manual' (Hitung Manual Timbangan)
  const [activeMode, setActiveMode] = useState('ai');

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.40);
  const [loading, setLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [items, setItems] = useState([]);
  const [sampleImages, setSampleImages] = useState([]);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [markets, setMarkets] = useState([]);

  // Save / Offer modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [actualWeightKg, setActualWeightKg] = useState(15.0);
  const [catchNotes, setCatchNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Trade offer options
  const [isSubmitToMarket, setIsSubmitToMarket] = useState(true);
  const [selectedMarketId, setSelectedMarketId] = useState(1);
  const [fishermanName, setFishermanName] = useState('Pak Budi (KM Bahari 01)');

  // State untuk Mode Manual
  const [manualRows, setManualRows] = useState([
    { id: 1, species_id: 1, quantity: 20, weight_kg: 10.0 },
    { id: 2, species_id: 7, quantity: 30, weight_kg: 8.0 }
  ]);

  const canvasRef = useRef(null);

  // Fetch samples, species, and markets on mount
  useEffect(() => {
    fetch('/api/sample-images')
      .then((r) => r.json())
      .then((data) => setSampleImages(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setSampleImages([]);
      });

    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => setSpeciesCatalog(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setSpeciesCatalog([]);
      });

    fetch('/api/markets')
      .then((r) => r.json())
      .then((data) => {
        const mList = Array.isArray(data) ? data : [];
        setMarkets(mList);
        if (mList.length > 0) setSelectedMarketId(mList[0].id);
      })
      .catch((err) => {
        console.error(err);
        setMarkets([]);
      });
  }, []);

  // Draw bounding boxes on canvas whenever detectionResult or items change
  useEffect(() => {
    if (activeMode !== 'ai' || !detectionResult || !canvasRef.current || !previewUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = previewUrl;

    img.onload = () => {
      canvas.width = img.naturalWidth || detectionResult.image.width;
      canvas.height = img.naturalHeight || detectionResult.image.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const colors = ['#0284c7', '#0d9488', '#e11d48', '#d97706', '#7c3aed', '#2563eb', '#16a34a', '#db2777'];

      items.forEach((item, idx) => {
        const [x1, y1, x2, y2] = item.bbox_xyxy;
        const color = colors[(item.species_id || idx) % colors.length];

        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.005));
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        ctx.fillStyle = `${color}20`;
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

        const label = `${item.class_label} (${Math.round(item.confidence * 100)}%)`;
        ctx.font = `bold ${Math.max(14, Math.round(canvas.width * 0.024))}px system-ui, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const padX = 8;
        const padY = 6;
        const tagHeight = Math.max(22, Math.round(canvas.width * 0.035));

        ctx.fillStyle = color;
        ctx.fillRect(x1, Math.max(0, y1 - tagHeight), textWidth + padX * 2, tagHeight);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x1 + padX, Math.max(tagHeight - padY, y1 - padY));
      });
    };
  }, [activeMode, detectionResult, items, previewUrl]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setDetectionResult(null);
      setItems([]);
      setIsSaved(false);
    }
  };

  const handleSelectSample = async (sample) => {
    setLoading(true);
    setIsSaved(false);
    try {
      const res = await fetch(sample.sample_url);
      const blob = await res.blob();
      const sampleFile = new File([blob], sample.filename, { type: blob.type || 'image/jpeg' });
      setFile(sampleFile);
      setPreviewUrl(sample.sample_url);
      setDetectionResult(null);
      setItems([]);
      runDetectionWithFile(sampleFile);
    } catch (err) {
      console.error('Error loading sample:', err);
      setLoading(false);
    }
  };

  const runDetectionWithFile = async (targetFile) => {
    const f = targetFile || file;
    if (!f) return;

    setLoading(true);
    setIsSaved(false);

    const formData = new FormData();
    formData.append('file', f);
    formData.append('confidence_threshold', confidenceThreshold);

    try {
      const res = await fetch('/api/detections', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setDetectionResult(data);
        setItems(data.detections || []);
        if (data.image_url) {
          setPreviewUrl(data.image_url);
        }
      } else {
        alert(data.message || 'Gagal memproses inferensi AI');
      }
    } catch (err) {
      console.error('Deteksi gagal:', err);
      alert('Terjadi kesalahan jaringan saat inferensi AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemSpecies = (index, newSpeciesId) => {
    const sp = speciesCatalog.find((s) => s.id === parseInt(newSpeciesId));
    if (!sp) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      species_id: sp.id,
      class_label: `${sp.scientific_name} (${sp.common_name})`
    };
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleAddManualBox = () => {
    const defaultSp = speciesCatalog[0] || { id: 1, scientific_name: 'Chanos Chanos', common_name: 'Ikan Bandeng' };
    const w = detectionResult?.image?.width || 520;
    const h = detectionResult?.image?.height || 390;
    const newItem = {
      species_id: defaultSp.id,
      class_label: `${defaultSp.scientific_name} (${defaultSp.common_name})`,
      confidence: 0.95,
      bbox_xyxy: [Math.round(w * 0.2), Math.round(h * 0.2), Math.round(w * 0.8), Math.round(h * 0.8)],
      estimated_length_cm: 30.0
    };
    setItems([...items, newItem]);
  };

  // Helper mode manual
  const handleAddManualRow = () => {
    const sp = speciesCatalog[0] || { id: 1 };
    setManualRows([...manualRows, { id: Date.now(), species_id: sp.id, quantity: 15, weight_kg: 8.0 }]);
  };

  const handleRemoveManualRow = (id) => {
    if (manualRows.length <= 1) return;
    setManualRows(manualRows.filter((r) => r.id !== id));
  };

  const handleManualRowChange = (id, field, value) => {
    setManualRows(
      manualRows.map((r) => (r.id === id ? { ...r, [field]: parseFloat(value) || value } : r))
    );
  };

  const totalManualWeight = manualRows.reduce((acc, r) => acc + (parseFloat(r.weight_kg) || 0), 0);
  const totalManualQty = manualRows.reduce((acc, r) => acc + (parseInt(r.quantity) || 0), 0);

  // Submit and save catch
  const handleConfirmAndSaveCatch = async () => {
    try {
      if (activeMode === 'ai') {
        const payload = {
          items: items.map((it) => ({
            species_id: it.species_id || 1,
            class_label: it.class_label,
            confidence: it.confidence,
            x1: it.bbox_xyxy[0],
            y1: it.bbox_xyxy[1],
            x2: it.bbox_xyxy[2],
            y2: it.bbox_xyxy[3],
            estimated_length_cm: it.estimated_length_cm,
            is_confirmed: true
          })),
          save_as_catch: true,
          weight_kg: parseFloat(actualWeightKg),
          target_market_id: isSubmitToMarket ? parseInt(selectedMarketId) : null,
          trade_status: isSubmitToMarket ? 'submitted' : 'none',
          fisherman_name: fishermanName,
          notes: catchNotes
        };

        const res = await fetch(`/api/detections/${detectionResult.detection_id}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setIsSaved(true);
          setShowSaveModal(false);
          alert(
            isSubmitToMarket
              ? 'Tangkapan berhasil disimpan & diajukan ke Pengelola Pasar! Menunggu review.'
              : 'Catatan tangkapan berhasil disimpan.'
          );
          if (onCatchSaved) onCatchSaved();
        }
      } else {
        // Mode Manual
        const payload = {
          location_name: 'TPI Muara Angke',
          target_market_id: isSubmitToMarket ? parseInt(selectedMarketId) : null,
          trade_status: isSubmitToMarket ? 'submitted' : 'none',
          fisherman_name: fishermanName,
          notes: catchNotes || 'Catatan pendaratan ikan hitung manual',
          details: manualRows.map((r) => ({
            species_id: parseInt(r.species_id),
            quantity: parseInt(r.quantity),
            weight_kg: parseFloat(r.weight_kg)
          })),
          costs: []
        };

        const res = await fetch('/api/catches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setIsSaved(true);
          setShowSaveModal(false);
          alert(
            isSubmitToMarket
              ? 'Data manual berhasil disimpan & diajukan ke Pengelola Pasar! Menunggu review.'
              : 'Catatan manual berhasil disimpan.'
          );
          if (onCatchSaved) onCatchSaved();
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Gagal menyimpan catatan tangkapan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Mode Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
              <Fish className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Pencatatan Hasil Tangkapan (AI &amp; Manual)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pilih metode deteksi otomatis AI YOLO atau input hitung manual timbangan pelabuhan.
          </p>
        </div>

        {/* Dual Mode Tab Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold self-start md:self-auto">
          <button
            onClick={() => setActiveMode('ai')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeMode === 'ai'
                ? 'bg-ocean-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deteksi AI (YOLO)</span>
          </button>
          <button
            onClick={() => setActiveMode('manual')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeMode === 'manual'
                ? 'bg-ocean-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Input Hitung Manual</span>
          </button>
        </div>
      </div>

      {/* ================= MODE HITUNG MANUAL ================= */}
      {activeMode === 'manual' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Formulir Pendaratan Ikan Manual (Tanpa Sensor/Foto)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Catat hasil tangkapan langsung berdasarkan timbangan fisik dan hitungan keranjang ikan.
              </p>
            </div>
            <button
              onClick={handleAddManualRow}
              className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Spesies</span>
            </button>
          </div>

          {/* Table / List of manual items */}
          <div className="space-y-3">
            {manualRows.map((r, idx) => (
              <div
                key={r.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
              >
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Spesies Komoditas #{idx + 1}
                  </label>
                  <select
                    value={r.species_id}
                    onChange={(e) => handleManualRowChange(r.id, 'species_id', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                  >
                    {speciesCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.common_name} ({s.scientific_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Jumlah Ekor
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={r.quantity}
                    onChange={(e) => handleManualRowChange(r.id, 'quantity', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-ocean-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Berat Timbangan (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={r.weight_kg}
                    onChange={(e) => handleManualRowChange(r.id, 'weight_kg', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-ocean-500"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end items-end">
                  <button
                    onClick={() => handleRemoveManualRow(r.id)}
                    disabled={manualRows.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <div>
              <span className="text-slate-600 font-medium">Total Akumulasi Tangkapan Manual:</span>
              <p className="text-sm font-extrabold text-emerald-900">
                {totalManualWeight.toFixed(1)} kg &bull; {totalManualQty} Ekor ({manualRows.length} Spesies)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSaveModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan / Ajukan ke Pasar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODE DETEKSI AI YOLO ================= */}
      {activeMode === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Canvas & Upload (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            {/* Upload Area */}
            {!previewUrl ? (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-ocean-500 transition bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*,.tif,.tiff"
                  id="fish-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="fish-upload" className="cursor-pointer block">
                  <UploadCloud className="w-12 h-12 text-ocean-600 mx-auto mb-3 animate-bounce" />
                  <span className="text-sm font-bold text-slate-800 block">
                    Upload Foto Ikan Hasil Tangkapan
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Mendukung format JPG, PNG, TIF kamera kapal &bull; Model YOLOv11x
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex justify-center">
                <canvas ref={canvasRef} className="max-h-[460px] w-auto object-contain" />
                {loading && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold space-x-2">
                    <Sparkles className="w-4 h-4 animate-spin text-ocean-400" />
                    <span>YOLOv11 sedang memindai objek ikan...</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  id="re-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="re-upload"
                  className="cursor-pointer text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ganti Foto</span>
                </label>
                <button
                  onClick={() => runDetectionWithFile(file)}
                  disabled={loading || !file}
                  className="text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 px-3.5 py-1.5 rounded-xl shadow-md transition flex items-center space-x-1 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Ulang AI</span>
                </button>
              </div>

              {/* Sample images */}
              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Sampel:</span>
                {sampleImages.slice(0, 3).map((sm, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSample(sm)}
                    className="text-[11px] font-semibold text-ocean-700 bg-ocean-50 hover:bg-ocean-100 px-2 py-1 rounded-lg border border-ocean-200 transition"
                  >
                    Sampel #{i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Detection Results (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hasil Deteksi Objek ({items.length} Ikan)</span>
                </h2>
                <button
                  onClick={handleAddManualBox}
                  className="text-[11px] font-bold text-ocean-600 hover:text-ocean-700 bg-ocean-50 hover:bg-ocean-100 px-2 py-1 rounded-lg border border-ocean-200 transition flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Manual</span>
                </button>
              </div>

              {/* List of detected items */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Belum ada objek ikan terdeteksi. Upload foto atau klik tombol sampel.
                  </div>
                ) : (
                  items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs space-x-2"
                    >
                      <div className="flex-1 truncate">
                        <select
                          value={it.species_id || 1}
                          onChange={(e) => handleUpdateItemSpecies(idx, e.target.value)}
                          className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none w-full truncate"
                        >
                          {speciesCatalog.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.common_name} ({s.scientific_name})
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block">
                          Akurasi: {Math.round(it.confidence * 100)}% &bull; Est. Panjang:{' '}
                          {it.estimated_length_cm || 25} cm
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Hapus objek ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              {items.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Konfirmasi &amp; Ajukan ke Pasar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL AJUKAN PENAWARAN KE PASAR ================= */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi &amp; Ajukan Penawaran Ikan
                </h3>
                <p className="text-xs text-slate-500">
                  Data tangkapan akan diajukan ke Pengelola Pasar untuk di-review
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Penginputan:</span>
                <span className="font-bold text-ocean-700">
                  {activeMode === 'ai' ? 'Sensor Kamera AI YOLO' : 'Hitung Manual Timbangan'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Objek/Komoditas:</span>
                <span className="font-bold text-slate-900">
                  {activeMode === 'ai' ? `${items.length} ekor` : `${totalManualWeight.toFixed(1)} kg (${manualRows.length} Spesies)`}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Nelayan / Kapal Nelayan
                </label>
                <input
                  type="text"
                  value={fishermanName}
                  onChange={(e) => setFishermanName(e.target.value)}
                  placeholder="Contoh: Pak Budi - KM Bahari 01"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                />
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
                      Pilih Pasar Ikan Tujuan (Untuk Di-ACC)
                    </label>
                    <select
                      value={selectedMarketId}
                      onChange={(e) => setSelectedMarketId(e.target.value)}
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

              {activeMode === 'ai' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Berat Riil Timbangan Keseluruhan (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={actualWeightKg}
                    onChange={(e) => setActualWeightKg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-ocean-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows="2"
                  value={catchNotes}
                  onChange={(e) => setCatchNotes(e.target.value)}
                  placeholder="Contoh: Kondisi segar baru sandar di dermaga."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-ocean-500"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAndSaveCatch}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition flex items-center justify-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Penawaran</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
