"""
BlueEconomy AI - Script Pelatihan Model YOLOv11 Extra Large (YOLO11x)
Mengonversi 50 citra dari masing-masing folder Fish_Dataset dan melatih model YOLOv11 Extra Large (yolo11x.pt).
"""

import os
import shutil
import random
from pathlib import Path
from PIL import Image
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_DIR = BASE_DIR / "ai_service" / "yolo_config"
(CONFIG_DIR / "Ultralytics").mkdir(parents=True, exist_ok=True)
os.environ["YOLO_CONFIG_DIR"] = str(CONFIG_DIR)

CLASSES = [
    "Chanos Chanos",
    "Eleutheronema Tetradactylum",
    "Johnius Trachycephalus",
    "Nibea Albiflora",
    "Oreochromis Mossambicus",
    "Oreochromis Niloticus",
    "Rastrelliger Faughni",
    "Upeneus Moluccensis"
]

import cv2
import numpy as np

def extract_fish_bbox(img_np: np.ndarray) -> tuple[float, float, float, float]:
    """
    Ekstraksi bounding box aktual ikan menggunakan segmentasi kontur adaptif & Otsu.
    Mengembalikan normalized YOLO coords: (x_center, y_center, width, height).
    """
    orig_h, orig_w = img_np.shape[:2]
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    _, thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    _, thresh2 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    white_ratio1 = np.count_nonzero(thresh1) / (orig_w * orig_h)
    thresh = thresh1 if 0.05 <= white_ratio1 <= 0.85 else thresh2

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel, iterations=1)

    contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    min_area = (orig_w * orig_h) * 0.04

    valid_boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area >= min_area:
            x, y, w, h = cv2.boundingRect(cnt)
            # Filter scanner / frame margin noise
            is_strip = (y <= 4 and h < orig_h * 0.15) or (x <= 4 and w < orig_w * 0.10)
            if not is_strip and w >= orig_w * 0.15 and h >= orig_h * 0.10:
                valid_boxes.append((x, y, w, h, area))

    if not valid_boxes:
        pad_x, pad_y = int(orig_w * 0.06), int(orig_h * 0.10)
        x, y, w, h = pad_x, pad_y, orig_w - 2 * pad_x, orig_h - 2 * pad_y
    else:
        best = max(valid_boxes, key=lambda b: b[4])
        x, y, w, h = best[:4]

    xc = round((x + w / 2.0) / float(orig_w), 4)
    yc = round((y + h / 2.0) / float(orig_h), 4)
    nw = round(w / float(orig_w), 4)
    nh = round(h / float(orig_h), 4)
    return xc, yc, nw, nh

def prepare_yolo_dataset(max_samples_per_class: int = 50, output_dir: str = "dataset_yolo", force_rebuild: bool = False):
    yolo_dir = BASE_DIR / output_dir
    
    # If already prepared with same count, check if rebuild is needed
    if not force_rebuild and (yolo_dir / "data.yaml").exists():
        train_count = len(list((yolo_dir / "images" / "train").glob("*.jpg")))
        expected = int(max_samples_per_class * len(CLASSES) * 0.8)
        if train_count >= expected:
            print(f"[Dataset] Dataset YOLO siap di {yolo_dir} ({train_count} citra train).")
            return yolo_dir

    print(f"[Dataset] Menyiapkan & membersihkan {max_samples_per_class} citra per spesies di {yolo_dir}...")
    shutil.rmtree(yolo_dir, ignore_errors=True)
    for split in ["train", "val"]:
        (yolo_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (yolo_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

    dataset_root = BASE_DIR / "dataset" if (BASE_DIR / "dataset").exists() else BASE_DIR

    total_processed = 0
    corrupt_count = 0

    for class_id, class_name in enumerate(CLASSES):
        src_folder = dataset_root / class_name
        if not src_folder.exists():
            print(f"[Warning] Folder tidak ditemukan: {src_folder}")
            continue

        raw_files = [f for f in os.listdir(src_folder) if f.lower().endswith(('.tif', '.tiff', '.png', '.jpg', '.jpeg', '.webp'))]
        random.seed(42)
        random.shuffle(raw_files)

        # Validasi integritas file (Data Cleaning)
        verified_files = []
        for f in raw_files:
            fpath = src_folder / f
            try:
                with Image.open(fpath) as im:
                    im.verify()
                verified_files.append(f)
                if len(verified_files) >= max_samples_per_class:
                    break
            except Exception as e:
                corrupt_count += 1
                continue

        val_count = max(2, int(len(verified_files) * 0.20))
        train_files = verified_files[val_count:]
        val_files = verified_files[:val_count]

        for split, file_list in [("train", train_files), ("val", val_files)]:
            for f in file_list:
                src_path = src_folder / f
                base_name = f"{class_id}_{f.rsplit('.', 1)[0]}.jpg"
                dst_img = yolo_dir / "images" / split / base_name
                dst_lbl = yolo_dir / "labels" / split / f"{dst_img.stem}.txt"

                try:
                    with Image.open(src_path) as im:
                        im_rgb = im.convert("RGB")
                        im_rgb.save(dst_img, "JPEG", quality=95)
                        
                        # Ekstraksi Bounding Box Aktual (Adaptive Contour Segmentation)
                        arr = np.array(im_rgb)
                        xc, yc, nw, nh = extract_fish_bbox(arr)

                        # Simpan anotasi nyata YOLO
                        dst_lbl.write_text(f"{class_id} {xc:.4f} {yc:.4f} {nw:.4f} {nh:.4f}\n")
                        total_processed += 1
                except Exception as e:
                    print(f"Error {src_path}: {e}")

    # Buat data.yaml
    yaml_content = f"""path: {yolo_dir.as_posix()}
train: images/train
val: images/val

names:
"""
    for cid, cname in enumerate(CLASSES):
        yaml_content += f"  {cid}: '{cname}'\n"

    (yolo_dir / "data.yaml").write_text(yaml_content)
    print(f"[Dataset] Selesai! Total {total_processed} citra terverifikasi & dianotasi dinamis ({corrupt_count} file rusak diabaikan).")
    return yolo_dir

def train_yolo11x(
    samples_per_class: int = 50,
    epochs: int = 50,
    batch_size: int = 4,
    img_size: int = 512,
    model_name: str = "yolo11x.pt",
    force_rebuild: bool = False
):
    print("=" * 70)
    print("  PELATIHAN MODEL YOLOv11 EXTRA LARGE (YOLO11x) - BLUEECONOMY AI  ")
    print("=" * 70)

    # 1. Dataset Preparation dengan Anotasi Dinamis & Pembersihan
    yolo_dir = prepare_yolo_dataset(max_samples_per_class=samples_per_class, force_rebuild=force_rebuild)

    # 2. Device detection (NVIDIA RTX 4060 GPU vs CPU)
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram = round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)
        device = 0
        print(f"[Hardware] GPU Terdeteksi: {gpu_name} (VRAM: {vram} GB) -> Akselerasi CUDA Aktif!")
    else:
        device = "cpu"
        print("[Hardware] GPU tidak terdeteksi, menggunakan CPU.")

    print(f"[Model] Arsitektur: YOLOv11 Extra Large ({model_name})")
    print(f"[Konfigurasi] Epoch: {epochs} | Batch: {batch_size} | Resolusi: {img_size}px | Citra/Kelas: {samples_per_class}")

    from ultralytics import YOLO

    # Load YOLO11x base model
    weights_path = BASE_DIR / model_name if (BASE_DIR / model_name).exists() else model_name
    model = YOLO(str(weights_path))

    # Run training
    results = model.train(
        data=str(yolo_dir / "data.yaml"),
        epochs=epochs,
        batch=batch_size,
        imgsz=img_size,
        device=device,
        project=str(BASE_DIR / "runs"),
        name="fish_yolo11x",
        exist_ok=True,
        amp=True,  # Automatic Mixed Precision untuk hemat VRAM pada RTX 4060
        verbose=True
    )

    # Copy best weights to ai_service
    best_weights = BASE_DIR / "runs" / "fish_yolo11x" / "weights" / "best.pt"
    target_weights = BASE_DIR / "ai_service" / "fish_yolo.pt"

    if best_weights.exists():
        shutil.copy(best_weights, target_weights)
        print("\n" + "=" * 70)
        print(f"[Sukses] Bobot terbaik YOLOv11x berhasil disimpan ke:\n  -> {target_weights}")
        print("Model langsung aktif otomatis pada platform BlueEconomy AI!")
        print("=" * 70)
    else:
        print(f"[Selesai] Pelatihan berakhir. Periksa hasil di: {BASE_DIR / 'runs' / 'fish_yolo11x'}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples-per-class", type=int, default=50, help="Jumlah gambar per folder spesies")
    parser.add_argument("--epochs", type=int, default=50, help="Jumlah epoch pelatihan")
    parser.add_argument("--batch", type=int, default=4, help="Ukuran batch (default 4 untuk YOLO11x 8GB GPU)")
    parser.add_argument("--imgsz", type=int, default=512, help="Resolusi gambar pelatihan (default 512)")
    parser.add_argument("--model", type=str, default="yolo11x.pt", help="Arsitektur YOLO11 (yolo11x.pt)")
    parser.add_argument("--rebuild-dataset", action="store_true", help="Paksa pembuatan ulang dataset YOLO dengan anotasi baru")
    parser.add_argument("--prepare-only", action="store_true", help="Hanya siapkan dataset")
    args = parser.parse_args()

    if args.prepare_only:
        prepare_yolo_dataset(max_samples_per_class=args.samples_per_class, force_rebuild=args.rebuild_dataset)
    else:
        train_yolo11x(
            samples_per_class=args.samples_per_class,
            epochs=args.epochs,
            batch_size=args.batch,
            img_size=args.imgsz,
            model_name=args.model,
            force_rebuild=args.rebuild_dataset
        )
