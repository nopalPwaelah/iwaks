@echo off
title Pelatihan Model YOLOv11 - BlueEconomy AI
echo ==================================================================
echo   PELATIHAN MODEL YOLOv11 (YOLO11) PADA DATASET IKAN (8 SPESIES)
echo ==================================================================
echo.
cd /d "%~dp0"

echo Menyiapkan dataset dan memulai training YOLOv11 (5 Epochs)...
python scripts/train_fish_yolo.py --epochs 5

echo.
echo ==================================================================
echo Pelatihan selesai! File bobot model tersimpan di:
echo ai_service/fish_yolo.pt
echo ==================================================================
pause
