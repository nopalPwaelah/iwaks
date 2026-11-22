"""
BlueEconomy AI - Script Pelatihan Model YOLO untuk Deteksi Ikan
Mengonversi Fish_Dataset menjadi format YOLO (images & labels) dan melatih model YOLOv8.
"""

import os
import shutil
import random
from pathlib import Path
from PIL import Image

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
    if yolo_dir.exists():
        print(f"Dataset YOLO sudah ada di {yolo_dir}")
        return yolo_dir

    print(f"Menyiapkan dataset YOLO di {yolo_dir}...")
    for split in ["train", "val"]:
        (yolo_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (yolo_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

    for class_id, class_name in enumerate(CLASSES):
        src_folder = (BASE_DIR / "dataset" / class_name) if (BASE_DIR / "dataset" / class_name).exists() else (BASE_DIR / class_name)
        if not src_folder.exists():
            continue

        files = [f for f in os.listdir(src_folder) if f.lower().endswith(('.tif', '.tiff', '.png', '.jpg'))]
        random.seed(42)
        random.shuffle(files)
        files = files[:max_samples_per_class]

        val_count = max(1, int(len(files) * 0.2))
        train_files = files[val_count:]
        val_files = files[:val_count]

        for split, file_list in [("train", train_files), ("val", val_files)]:
            for f in file_list:
                src_path = src_folder / f
                base_name = f"{class_id}_{f.rsplit('.', 1)[0]}.jpg"
                dst_img = yolo_dir / "images" / split / base_name
                dst_lbl = yolo_dir / "labels" / split / f"{dst_img.stem}.txt"

                # Convert TIFF to JPEG
                try:
                    with Image.open(src_path) as im:
                        im.convert("RGB").save(dst_img, "JPEG")
                        # The dataset images are centered fish photos, so normalized box is centered:
                        # class_id, x_center, y_center, width, height
                        dst_lbl.write_text(f"{class_id} 0.50 0.50 0.75 0.55\n")
                except Exception as e:
                    print(f"Error processing {src_path}: {e}")

    # Create data.yaml
    yaml_content = f"""path: {yolo_dir.as_posix()}
train: images/train
val: images/val

names:
"""
    for cid, cname in enumerate(CLASSES):
        yaml_content += f"  {cid}: '{cname}'\n"

    (yolo_dir / "data.yaml").write_text(yaml_content)
    print("Dataset YOLO berhasil dibuat!")
    return yolo_dir

def train_yolo(epochs: int = 5, batch_size: int = 8):
    yolo_dir = prepare_yolo_dataset(max_samples_per_class=30)
    from ultralytics import YOLO

    print("Memulai pelatihan YOLOv8 nano...")
    model = YOLO("yolov8n.pt")
    results = model.train(
        data=str(yolo_dir / "data.yaml"),
        epochs=epochs,
        batch=batch_size,
        imgsz=384,
        project=str(BASE_DIR / "runs"),
        name="fish_detector",
        device="cpu"
    )

    best_weights = BASE_DIR / "runs" / "fish_detector" / "weights" / "best.pt"
    target_weights = BASE_DIR / "ai_service" / "fish_yolo.pt"
    if best_weights.exists():
        shutil.copy(best_weights, target_weights)
        print(f"Bobot terbaik berhasil disalin ke {target_weights}!")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--epochs", type=int, default=3)
    args = parser.parse_args()

    if args.prepare_only:
        prepare_yolo_dataset()
    else:
        train_yolo(epochs=args.epochs)
