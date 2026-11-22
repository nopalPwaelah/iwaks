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
  Scale
} from 'lucide-react';

export default function AiDetectionView({ onCatchSaved }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.40);
  const [loading, setLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [items, setItems] = useState([]);
  const [sampleImages, setSampleImages] = useState([]);
  const [speciesCatalog, setSpeciesCatalog] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [actualWeightKg, setActualWeightKg] = useState(15.0);
  const [catchNotes, setCatchNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const canvasRef = useRef(null);

  // Fetch samples and species on mount
  useEffect(() => {
    fetch('/api/sample-images')
      .then((r) => r.json())
      .then((data) => setSampleImages(data))
      .catch((err) => console.error(err));

    fetch('/api/fish-species')
      .then((r) => r.json())
      .then((data) => setSpeciesCatalog(data))
      .catch((err) => console.error(err));
  }, []);

  // Draw bounding boxes on canvas whenever detectionResult or items change
  useEffect(() => {
    if (!detectionResult || !canvasRef.current || !previewUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = previewUrl;

    img.onload = () => {
      canvas.width = img.naturalWidth || detectionResult.image.width;
      canvas.height = img.naturalHeight || detectionResult.image.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Colors for bounding boxes
      const colors = ['#0284c7', '#0d9488', '#e11d48', '#d97706', '#7c3aed', '#2563eb', '#16a34a', '#db2777'];

      items.forEach((item, idx) => {
        const [x1, y1, x2, y2] = item.bbox_xyxy;
        const color = colors[(item.species_id || idx) % colors.length];

        // Draw Box
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.005));
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        // Fill semi-transparent overlay
        ctx.fillStyle = `${color}20`;
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

        // Label Tag
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
  }, [detectionResult, items, previewUrl]);

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
      
      // Auto run detection on sample
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
    const selectedSp = speciesCatalog.find((s) => s.id === parseInt(newSpeciesId));
    if (!selectedSp) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      species_id: selectedSp.id,
      class_label: `${selectedSp.scientific_name} (${selectedSp.common_name})`,
      category: selectedSp.category
    };
    setItems(updated);
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  const handleConfirmAndSaveCatch = async () => {
    if (!detectionResult) return;

    const payload = {
      items: items.map((it) => ({
        id: it.id,
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
      weight_kg: parseFloat(actualWeightKg) || 15.0,
      notes: catchNotes || `Hasil deteksi AI #${detectionResult.detection_id}`
    };

    try {
      const res = await fetch(`/api/detections/${detectionResult.detection_id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) {
        setIsSaved(true);
        setShowSaveModal(false);
        alert('Hasil deteksi berhasil dikonfirmasi dan dicatat ke Tangkapan!');
        if (onCatchSaved) onCatchSaved();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan hasil konfirmasi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
              <Fish className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Deteksi &amp; Penghitungan Objek Ikan (YOLO)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Modul Computer Vision berbasis model YOLO untuk klasifikasi 8 spesies ikan pesisir dengan dukungan validasi Human-in-the-Loop.
          </p>
        </div>

        {/* Confidence Slider */}
        <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <Sliders className="w-4 h-4 text-slate-500" />
          <div className="text-xs">
            <span className="text-slate-500">Threshold:</span> <span className="font-bold text-slate-800">{Math.round(confidenceThreshold * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.20"
            max="0.85"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            className="w-24 accent-ocean-600 cursor-pointer"
          />
        </div>
      </div>

      {/* 1-Click Dataset Sample Selector */}
      <div className="bg-gradient-to-r from-ocean-50 to-marine-50 p-4 rounded-2xl border border-ocean-100">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-ocean-600" />
          <span className="text-xs font-bold text-ocean-950 uppercase tracking-wide">Uji Cepat 1-Klik dari Dataset Lokal:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleImages.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(s)}
              disabled={loading}
              className="bg-white hover:bg-ocean-600 hover:text-white text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5 text-ocean-500" />
              <span>{s.species}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace: Image Upload / Canvas & Results Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Canvas / Upload (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Visual Bounding Box Canvas</span>
              {detectionResult && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {detectionResult.inference_ms} ms &bull; {items.length} Objek Terdeteksi
                </span>
              )}
            </div>

            <div className="relative min-h-[360px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              {previewUrl ? (
                <canvas ref={canvasRef} className="max-w-full max-h-[500px] object-contain w-auto h-auto rounded" />
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <UploadCloud className="w-12 h-12 mx-auto mb-3 text-slate-500 animate-bounce" />
                  <p className="text-sm font-semibold text-slate-300">Belum ada gambar dipilih</p>
                  <p className="text-xs text-slate-500 mt-1">Unggah foto ikan (JPG, PNG, TIFF) atau klik salah satu sampel di atas.</p>
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                  <div className="w-10 h-10 border-4 border-ocean-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-sm font-bold tracking-wide">Menjalankan Inferensi YOLO...</span>
                  <span className="text-xs text-slate-400 mt-1">Mendeteksi fitur morfologi &amp; koordinat bbox</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition inline-flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <span>Pilih Foto dari Komputer</span>
              <input type="file" accept="image/*,.tif,.tiff" onChange={handleFileChange} className="hidden" />
            </label>

            {file && (
              <button
                onClick={() => runDetectionWithFile(file)}
                disabled={loading}
                className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-ocean-600/30 transition flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Jalankan Deteksi Ulang</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Human-in-the-Loop Review Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Review &amp; Konfirmasi (Human-in-the-Loop)</h3>
                <p className="text-[11px] text-slate-500">Koreksi jenis atau hitungan jika terdapat oklusi/ketidaksesuaian</p>
              </div>
              <span className="text-xs font-extrabold text-ocean-700 bg-ocean-50 px-2 py-1 rounded-lg border border-ocean-200">
                Total: {items.length}
              </span>
            </div>

            {/* List of Detected Fish */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada objek terdeteksi. Unggah foto atau pilih sampel untuk memulai.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-ocean-300 transition text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-ocean-600 text-white flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">{item.class_label}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Hapus objek ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">Keyakinan AI:</span>{' '}
                        <span className="font-bold text-emerald-600">{Math.round(item.confidence * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Est. Panjang:</span>{' '}
                        <span className="font-bold text-ocean-700">{item.estimated_length_cm || '-'} cm</span>
                      </div>
                    </div>

                    {/* Correction Select */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                      <Edit2 className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-500">Koreksi Spesies:</span>
                      <select
                        value={item.species_id || ''}
                        onChange={(e) => handleUpdateItemSpecies(idx, e.target.value)}
                        className="bg-white border border-slate-300 text-slate-800 text-[11px] rounded px-1.5 py-0.5 font-medium focus:ring-1 focus:ring-ocean-500"
                      >
                        {speciesCatalog.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.common_name} ({sp.scientific_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Disclaimer per SRS FR-09 */}
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start space-x-2 text-[11px] text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Ketentuan SRS &amp; PDA:</strong> Estimasi ukuran berbasis kalibrasi piksel optik. Berat riil untuk kalkulasi ekonomi harus diverifikasi melalui timbangan fisik pengguna.
              </p>
            </div>
          </div>

          {/* Confirm & Save Button */}
          {items.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={isSaved}
                className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2 ${
                  isSaved
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaved ? 'Hasil Telah Dikonfirmasi & Disimpan' : 'Konfirmasi & Catat ke Tangkapan'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation & Catch Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Catat Hasil Tangkapan Resmi</h3>
                <p className="text-xs text-slate-500">Konfirmasi data jumlah dan berat timbangan aktual</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Objek Dikonfirmasi:</span>
                <span className="font-bold text-slate-800">{items.length} ekor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Spesies Utama:</span>
                <span className="font-bold text-ocean-700">{items[0]?.class_label || '-'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Berat Aktual Timbangan (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  placeholder="Contoh: 18.5"
                />
                <span className="text-[10px] text-slate-400">Wajib diisi dari hasil timbangan riil pelabuhan/TPI.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows="2"
                  value={catchNotes}
                  onChange={(e) => setCatchNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  placeholder="Contoh: Ditangkap di sekitar Muara Angke, kondisi segar grade A."
                ></textarea>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="w-1/2 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAndSaveCatch}
                className="w-1/2 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/30"
              >
                Simpan Tangkapan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
