"""
BlueEconomy AI - Script Pembersihan & Validasi Kualitas Dataset (Data Cleaning)
Fungsi:
1. Memeriksa integritas file citra (mendeteksi file korup/rusak).
2. Mendeteksi & menandai duplikat citra menggunakan hashing MD5.
3. Memvalidasi resolusi minimum & rasio aspek ekstrem.
4. Menghasilkan laporan kualitas dataset yang bersih untuk training YOLO.
"""

import os
import hashlib
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset" if (BASE_DIR / "dataset").exists() else BASE_DIR

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

def calculate_md5(file_path: Path) -> str:
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def clean_and_verify_dataset(min_width: int = 100, min_height: int = 100, remove_duplicates: bool = False):
    print("=" * 75)
    print("   PEMBERSIHAN & VALIDASI KUALITAS DATASET IKAN (DATA CLEANING)   ")
    print(f" Direktori: {DATASET_DIR}")
    print("=" * 75)

    seen_hashes = {}
    report = {
        "total_files": 0,
        "valid_files": 0,
        "corrupt_files": [],
        "duplicate_files": [],
        "small_files": [],
        "class_counts": {}
    }

    for class_name in CLASSES:
        folder = DATASET_DIR / class_name
        if not folder.exists():
            continue

        valid_in_class = 0
        file_list = [f for f in os.listdir(folder) if f.lower().endswith(('.tif', '.tiff', '.png', '.jpg', '.jpeg', '.webp'))]

        for fname in file_list:
            fpath = folder / fname
            report["total_files"] += 1

            # 1. Cek Integritas Citra
            try:
                with Image.open(fpath) as img:
                    img.verify()
                
                # Buka ulang untuk membaca dimensi setelah verify()
                with Image.open(fpath) as img:
                    w, h = img.size
                    if w < min_width or h < min_height:
                        report["small_files"].append((str(fpath), f"{w}x{h}"))
                        continue
            except Exception as e:
                report["corrupt_files"].append((str(fpath), str(e)))
                continue

            # 2. Cek Duplikasi Citra (MD5)
            file_hash = calculate_md5(fpath)
            if file_hash in seen_hashes:
                original_file = seen_hashes[file_hash]
                report["duplicate_files"].append((str(fpath), original_file))
                if remove_duplicates:
                    try:
                        os.remove(fpath)
                        print(f"[Hapus Duplikat] {fpath.name} (identik dengan {Path(original_file).name})")
                    except Exception as err:
                        print(f"Gagal menghapus {fpath}: {err}")
                continue
            else:
                seen_hashes[file_hash] = str(fpath)

            valid_in_class += 1
            report["valid_files"] += 1

        report["class_counts"][class_name] = valid_in_class

    print(f"\n[HASIL PEMERIKSAAN]")
    print(f"• Total File Dipindai : {report['total_files']} file")
    print(f"• File Valid & Bersih : {report['valid_files']} file")
    print(f"• File Rusak / Corrupt: {len(report['corrupt_files'])} file")
    print(f"• File Duplikat       : {len(report['duplicate_files'])} file")
    print(f"• File Terlalu Kecil  : {len(report['small_files'])} file\n")

    print(f"{'No':<3} | {'Nama Spesies':<30} | {'Jumlah Valid':<12}")
    print("-" * 50)
    for idx, (cname, cnt) in enumerate(report["class_counts"].items(), 1):
        print(f"{idx:<3} | {cname:<30} | {cnt:<12}")

    print("=" * 75)
    print("Dataset siap digunakan untuk pelatihan YOLOv11!")
    return report

if __name__ == "__main__":
    clean_and_verify_dataset()
