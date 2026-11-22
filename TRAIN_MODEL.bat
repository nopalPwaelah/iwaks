@echo off
title Pelatihan Model YOLOv11 Extra Large (YOLO11x)
echo ==================================================================
echo   PELATIHAN MODEL YOLOv11 EXTRA LARGE (YOLO11x) - BLUEECONOMY AI
echo   - Arsitektur : YOLOv11 Extra Large (yolo11x.pt)
echo   - Dataset    : 50 citra per folder spesies (8 kelas = 400 gambar)
echo   - Epoch      : 50 Epochs
echo   - Akselerasi : NVIDIA GeForce RTX 4060 Laptop GPU (CUDA)
echo ==================================================================
echo.
cd /d "%~dp0"

echo Memulai persiapan 50 data per folder dan training YOLOv11 Extra Large...
python scripts/train_fish_yolo.py --samples-per-class 50 --epochs 50 --batch 4 --model yolo11x.pt

echo.
echo ==================================================================
echo Pelatihan selesai! Bobot terbaik tersimpan di:
echo ai_service/fish_yolo.pt (langsung aktif di platform web)
echo ==================================================================
pause
