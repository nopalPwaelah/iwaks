import pandas as pd
from pathlib import Path

csv_path = Path("runs/fish_yolo11x/results.csv")
if not csv_path.exists():
    print("results.csv not found")
    exit()

df = pd.read_csv(csv_path)
df.columns = [c.strip() for c in df.columns]

last = df.iloc[-1]
best_idx = df['metrics/mAP50(B)'].idxmax()
best = df.iloc[best_idx]

print("=" * 65)
print("   HASIL EVALUASI TRAINING 50 EPOCH (YOLOv11 Extra Large)")
print("=" * 65)
print(f"Total Epoch Selesai     : {len(df)} dari 50 Epochs")
print(f"mAP@50 (Akurasi BBox)   : {best['metrics/mAP50(B)'] * 100:.2f}% (Tercapai di Epoch {int(best['epoch'])})")
print(f"mAP@50-95 (Strict IoU)  : {last['metrics/mAP50-95(B)'] * 100:.2f}%")
print(f"Precision (Ketepatan)   : {last['metrics/precision(B)'] * 100:.2f}%")
print(f"Recall (Sensitivitas)   : {last['metrics/recall(B)'] * 100:.2f}%")
print("-" * 65)
print(f"Train Box Loss (Awal -> Akhir)   : {df['train/box_loss'].iloc[0]:.4f} -> {last['train/box_loss']:.4f}")
print(f"Train Class Loss (Awal -> Akhir) : {df['train/cls_loss'].iloc[0]:.4f} -> {last['train/cls_loss']:.4f}")
print(f"Val Box Loss (Awal -> Akhir)     : {df['val/box_loss'].iloc[0]:.4f} -> {last['val/box_loss']:.4f}")
print(f"Val Class Loss (Awal -> Akhir)   : {df['val/cls_loss'].iloc[0]:.4f} -> {last['val/cls_loss']:.4f}")
print("=" * 65)

# Progression check
print("\nPerkembangan Akurasi per 10 Epoch:")
for ep in [5, 10, 20, 30, 40, 50]:
    row = df[df['epoch'] == ep]
    if not row.empty:
        r = row.iloc[0]
        print(f"  Epoch {ep:>2}: mAP50 = {r['metrics/mAP50(B)']*100:>6.2f}% | Box Loss = {r['train/box_loss']:.4f} | Cls Loss = {r['train/cls_loss']:.4f}")
