import os
from pathlib import Path
from PIL import Image
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset" if (BASE_DIR / "dataset").exists() else BASE_DIR

classes = [
    d for d in os.listdir(DATASET_DIR) 
    if os.path.isdir(DATASET_DIR / d) and not d.startswith('.') and d not in [
        'ai_service', 'backend', 'frontend', 'scripts', 'uploads', 
        'yolo_cfg', 'dataset_yolo', 'node_modules', 'runs', 'dist', 'dataset'
    ]
]

stats = []
total_images = 0
total_bytes = 0

print("=== DETAIL ANALISIS DATASET IKAN (FISH_DATASET) ===")
print(f"Direktori Dataset: {DATASET_DIR}")
print(f"Jumlah Folder Kelas Spesies: {len(classes)}")

for c in sorted(classes):
    class_path = DATASET_DIR / c
    files = [f for f in os.listdir(class_path) if f.lower().endswith(('.tif', '.tiff', '.jpg', '.png'))]
    cnt = len(files)
    total_images += cnt
    
    resolutions = set()
    modes = set()
    bytes_list = []
    aspect_ratios = []
    mean_rgbs = []

    # Sample up to 30 images
    sample_files = files[:30]
    for sf in sample_files:
        p = class_path / sf
        b = os.path.getsize(p)
        bytes_list.append(b)
        try:
            with Image.open(p) as im:
                resolutions.add(im.size)
                modes.add(im.mode)
                w, h = im.size
                aspect_ratios.append(w / h)
                arr = np.array(im.convert("RGB"))
                mean_rgbs.append(np.mean(arr, axis=(0, 1)))
        except Exception as e:
            pass
            
    avg_bytes = sum(bytes_list) / max(1, len(bytes_list))
    total_class_bytes = sum(os.path.getsize(class_path / f) for f in files)
    total_bytes += total_class_bytes
    
    avg_rgb = np.mean(mean_rgbs, axis=0) if mean_rgbs else [0, 0, 0]
    avg_ar = sum(aspect_ratios) / max(1, len(aspect_ratios))

    stats.append({
        'class': c,
        'count': cnt,
        'resolutions': list(resolutions),
        'modes': list(modes),
        'avg_kb': round(avg_bytes / 1024, 1),
        'total_mb': round(total_class_bytes / (1024 * 1024), 2),
        'avg_ar': round(avg_ar, 2),
        'avg_rgb': [round(v, 1) for v in avg_rgb]
    })

print(f"Total Citra Keseluruhan: {total_images} gambar")
print(f"Total Ukuran di Disk: {round(total_bytes / (1024*1024), 2)} MB\n")

print(f"{'No':<3} | {'Nama Spesies':<28} | {'Jumlah':<7} | {'Proporsi':<8} | {'Resolusi':<10} | {'Format':<6} | {'Rasio AR':<8} | {'Ukuran (MB)':<10}")
print("-" * 95)

for idx, s in enumerate(stats, 1):
    prop = (s['count'] / total_images) * 100
    res_str = f"{s['resolutions'][0][0]}x{s['resolutions'][0][1]}" if s['resolutions'] else "N/A"
    print(f"{idx:<3} | {s['class']:<28} | {s['count']:<7} | {prop:>6.2f}% | {res_str:<10} | {s['modes'][0] if s['modes'] else 'RGB':<6} | {s['avg_ar']:<8} | {s['total_mb']:>8.2f} MB")

counts = [s['count'] for s in stats]
min_c, max_c = min(counts), max(counts)
ratio = round(max_c / min_c, 2)
print("-" * 95)
print(f"Rasio Ketidakseimbangan (Max / Min): {ratio}x (Min: {min_c}, Max: {max_c})")
print(f"Rata-rata Citra per Spesies: {round(total_images / len(classes), 1)} gambar")
