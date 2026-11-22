# BLUEECONOMY AI &mdash; COASTAL ECONOMIC INTELLIGENCE & EMPOWERMENT PLATFORM

Implementasi kode sumber lengkap berbasis dokumen:
1. **Software Requirements Specification (SRS v1.0)**
2. **Perancangan Desain Aplikasi (PDA v1.0)**

---

## 1. Arsitektur Sistem

Platform **BlueEconomy AI** dibangun dengan pendekatan modular &amp; *API-first*:

- **Presentation Layer (Frontend)**:
  - Dibangun dengan **React.js + Tailwind CSS + Lucide Icons + Leaflet GIS**.
  - Tema visual laut pesisir (*deep ocean, coastal marine teal*).
  - Dilengkapi *interactive canvas* untuk visualisasi *bounding box*, koreksi spesies, dan hitungan objek (*Human-in-the-Loop*).
  - Peta interaktif Coastal GIS untuk TPI pelabuhan, pasar ikan, dan sentra UMKM pesisir.
- **Application & Data Layer (Backend REST API)**:
  - Dibangun dengan **Python FastAPI &amp; SQLAlchemy**.
  - Mengimplementasikan seluruh 14 endpoint utama PDA Bab 6.1 (Auth, Catches, Prices, Profit Analysis, Market Recommendations, GIS, UMKM).
  - Database relasional SQLite (kompatibel langsung dengan PostgreSQL &amp; PostGIS).
- **AI & Computer Vision Layer**:
  - Model deteksi objek &amp; hitung ikan **YOLO v1** terintegrasi dengan citra 8 spesies pada `Fish_Dataset`:
    1. *Chanos Chanos* (Ikan Bandeng)
    2. *Eleutheronema Tetradactylum* (Ikan Kurau / Senangin)
    3. *Johnius Trachycephalus* (Ikan Gulama)
    4. *Nibea Albiflora* (Ikan Samge / Yellow Drum)
    5. *Oreochromis Mossambicus* (Ikan Mujair)
    6. *Oreochromis Niloticus* (Ikan Nila)
    7. *Rastrelliger Faughni* (Ikan Kembung)
    8. *Upeneus Moluccensis* (Ikan Kuniran / Biji Nangka)
  - Fitur estimasi ukuran panjang (cm) dengan *disclaimer* kepatuhan SRS FR-09.

---

## 2. Struktur Direktori Proyek

```text
Fish_Dataset/
├── ai_service/             # Layanan Inferensi AI YOLO & Computer Vision
│   ├── detector.py         # Engine detektor objek, bbox, estimasi ukuran & kalibrasi
│   ├── main.py             # Microservice FastAPI AI (Port 8001)
│   └── yolo_config/        # Konfigurasi sandboxed Ultralytics
├── backend/                # Backend REST API (Port 8000)
│   ├── database.py         # Konfigurasi SQLAlchemy Session & Engine
│   ├── models.py           # Skema ORM: users, detections, catches, prices, umkm, markets
│   ├── seed.py             # Data awal: akun 5 role, 8 spesies, harga, lokasi GIS, UMKM
│   └── main.py             # Router lengkap 20+ endpoint sesuai kontrak PDA
├── frontend/               # Single Page Application React + Tailwind
│   ├── src/
│   │   ├── components/     # Modul UI: Dashboard, YOLO Detection, Catches, Prices, Profit, GIS, UMKM
│   │   ├── App.jsx         # State & Role switcher orchestrator
│   │   └── main.jsx
│   ├── dist/               # Hasil bundle produksi Vite (langsung dilayani backend)
│   └── package.json
├── scripts/
│   └── train_fish_yolo.py  # Pipeline konversi dataset & pelatihan model YOLOv8
├── uploads/                # Direktori penyimpanan citra unggahan & konversi JPEG
├── run_platform.py         # Script sekali klik untuk menjalankan seluruh sistem
├── BlueEconomy_AI_SRS_v1.0.docx
└── BLUEECONOMY AI pda.docx
```

---

## 3. Akun Pengguna Uji (Multi-Role Simulation)

Sesuai kebutuhan RBAC pada SRS FR-01 &ndash; FR-03, sistem telah dilengkapi akun simulasi untuk 5 role aktor utama:

| Role | Email Login | Password Default | Akses Utama |
|---|---|---|---|
| **Nelayan** | `nelayan@blueeconomy.id` | `password123` | Deteksi YOLO, pencatatan tangkapan, kalkulator keuntungan, rekomendasi pasar |
| **UMKM** | `umkm@blueeconomy.id` | `password123` | Profil usaha, katalog produk olahan, informasi pasokan bahan baku |
| **Admin** | `admin@blueeconomy.id` | `password123` | Manajemen master data spesies, pasar, moderasi dan audit |
| **Pengelola Pasar** | `pasar@blueeconomy.id` | `password123` | Input dan pembaruan harga komoditas pasar harian |
| **Stakeholder (DKP)** | `stakeholder@blueeconomy.id` | `password123` | Statistik agregat tangkapan, GIS pesisir, laporan ekonomi |

> **Catatan:** Pengguna dapat berpindah role secara instan melalui dropdown **Simulasi Role** di navigasi kanan atas antarmuka web.

---

## 4. Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Platform Terintegrasi (Rekomendasi)
Cukup jalankan satu perintah:

```powershell
python run_platform.py
```

Buka peramban (browser) di:
- **Aplikasi Web**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Dokumentasi Interaktif API (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Opsi 2: Menjalankan Mode Pengembangan Frontend (Vite Hot-Reload)
Jika ingin mengedit antarmuka secara *live*:
```powershell
# Terminal 1: Backend API
python run_platform.py

# Terminal 2: Frontend Vite
cd frontend
npm run dev
```
Akses Vite di: [http://localhost:3000](http://localhost:3000)

---

## 5. Ringkasan Modul & Pemenuhan Kebutuhan

1. **AI Fish Detection & Counter (FR-05 s/d FR-09)**:
   - Menerima format JPG, PNG, TIFF (format asli `Fish_Dataset`), dan WEBP.
   - Tersedia tombol **Uji Cepat 1-Klik** dari dataset lokal tanpa perlu mencari foto sendiri.
   - Visualisasi kanvas kotak deteksi (*bounding box*), keyakinan model (*confidence*), dan estimasi ukuran.
   - Panel **Human-in-the-Loop**: nelayan dapat mengoreksi nama spesies, mengubah hitungan objek, lalu langsung menyimpannya ke Catatan Tangkapan resmi.
2. **Catatan Tangkapan & Biaya (FR-10)**:
   - Pencatatan trip perikanan, lokasi pendaratan/TPI, komposisi spesies, dan berat riil timbangan (kg).
   - Pencatatan biaya operasional laut (Solar/BBM, Balok Es, Upah ABK).
3. **Intelijen Harga Pasar (FR-11 & FR-14)**:
   - Harga per kg dengan transparansi sumber data (*Provenance*) dan tanggal pembaruan (*Data Freshness Tag*).
4. **Analisis Pendapatan & Keuntungan Bersih (FR-12 & FR-13)**:
   - Rumus: $\text{Keuntungan Bersih} = (\text{Berat kg} \times \text{Harga/kg}) - \text{Total Biaya Operasional}$.
   - Dilengkapi visualisasi proporsi biaya vs keuntungan dan titik impas (*break-even point*).
5. **Rekomendasi Pasar Optimal (FR-15 & PDA 4.3)**:
   - Rumus: $\text{Nilai Bersih} = (\text{Berat} \times \text{Harga}) - (\text{Jarak km} \times \text{Tarif/km}) - \text{Retribusi}$.
   - Meranking pasar terbaik dan memberi peringatan jika data harga telah kedaluwarsa.
6. **Coastal GIS (FR-16)**:
   - Peta interaktif Leaflet dengan titik TPI, pelabuhan perikanan, pasar ikan, dan klaster UMKM pesisir.
7. **Katalog & Kemitraan UMKM (FR-17)**:
   - Profil UMKM pengolahan hasil laut, katalog produk (Bandeng Presto, Otak-Otak, Abon Ikan, Kerupuk Kemplang), serta papan informasi kebutuhan pasokan bahan baku dari nelayan.
