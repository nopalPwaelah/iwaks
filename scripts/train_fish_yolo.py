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

def prepare_yolo_dataset(max_samples_per_class: int = 50, output_dir: str = "dataset_yolo"):
    yolo_dir = BASE_DIR / output_dir
    
    # If already prepared with same count, reuse or clean
    if (yolo_dir / "data.yaml").exists():
        train_count = len(list((yolo_dir / "images" / "train").glob("*.jpg")))
        expected = int(max_samples_per_class * len(CLASSES) * 0.8)
        if train_count >= expected:
            print(f"[Dataset] Dataset YOLO siap di {yolo_dir} ({train_count} citra train).")
            return yolo_dir
        else:
            print(f"[Dataset] Memperbarui dataset dengan {max_samples_per_class} citra per folder...")
            shutil.rmtree(yolo_dir, ignore_errors=True)

    print(f"[Dataset] Menyiapkan {max_samples_per_class} citra per spesies di {yolo_dir}...")
    for split in ["train", "val"]:
        (yolo_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (yolo_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

    dataset_root = BASE_DIR / "dataset" if (BASE_DIR / "dataset").exists() else BASE_DIR

    total_processed = 0
    for class_id, class_name in enumerate(CLASSES):
        src_folder = dataset_root / class_name
        if not src_folder.exists():
            print(f"[Warning] Folder tidak ditemukan: {src_folder}")
            continue

        files = [f for f in os.listdir(src_folder) if f.lower().endswith(('.tif', '.tiff', '.png', '.jpg'))]
        random.seed(42)
        random.shuffle(files)
        files = files[:max_samples_per_class]

        val_count = max(2, int(len(files) * 0.20))
        train_files = files[val_count:]
        val_files = files[:val_count]

        for split, file_list in [("train", train_files), ("val", val_files)]:
            for f in file_list:
                src_path = src_folder / f
                base_name = f"{class_id}_{f.rsplit('.', 1)[0]}.jpg"
                dst_img = yolo_dir / "images" / split / base_name
                dst_lbl = yolo_dir / "labels" / split / f"{dst_img.stem}.txt"

                try:
                    with Image.open(src_path) as im:
                        im.convert("RGB").save(dst_img, "JPEG", quality=95)
                        # Format label YOLO: class_id x_center y_center width height (normalized)
                        dst_lbl.write_text(f"{class_id} 0.50 0.50 0.72 0.55\n")
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
    print(f"[Dataset] Selesai! Total {total_processed} citra siap dilatih ({len(CLASSES)} kelas x {max_samples_per_class}).")
    return yolo_dir

def train_yolo11x(
    samples_per_class: int = 50,
    epochs: int = 50,
    batch_size: int = 4,
    model_name: str = "yolo11x.pt"
):
    print("=" * 70)
    print("  PELATIHAN MODEL YOLOv11 EXTRA LARGE (YOLO11x) - BLUEECONOMY AI  ")
    print("=" * 70)

    # 1. Dataset Preparation
    yolo_dir = prepare_yolo_dataset(max_samples_per_class=samples_per_class)

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
    print(f"[Konfigurasi] Epoch: {epochs} | Batch: {batch_size} | Citra/Kelas: {samples_per_class}")

    from ultralytics import YOLO

    # Load YOLO11x base model
    weights_path = BASE_DIR / model_name if (BASE_DIR / model_name).exists() else model_name
    model = YOLO(str(weights_path))

    # Run training
    results = model.train(
        data=str(yolo_dir / "data.yaml"),
        epochs=epochs,
        batch=batch_size,
        imgsz=384,
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
    parser.add_argument("--model", type=str, default="yolo11x.pt", help="Arsitektur YOLO11 (yolo11x.pt)")
    parser.add_argument("--prepare-only", action="store_true", help="Hanya siapkan dataset")
    args = parser.parse_args()

    if args.prepare_only:
        prepare_yolo_dataset(max_samples_per_class=args.samples_per_class)
    else:
        train_yolo11x(
            samples_per_class=args.samples_per_class,
            epochs=args.epochs,
            batch_size=args.batch,
            model_name=args.model
        )
