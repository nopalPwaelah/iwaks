@echo off
title Pelatihan Model YOLO - BlueEconomy AI
echo ==================================================================
echo   PELATIHAN MODEL YOLO PADA DATASET IKAN LOKAL (8 SPESIES)
echo ==================================================================
echo.
cd /d "%~dp0"

echo Menyiapkan dataset dan memulai training YOLO (5 Epochs)...
python scripts/train_fish_yolo.py --epochs 5

echo.
echo ==================================================================
echo Pelatihan selesai! File bobot model tersimpan di:
echo ai_service/fish_yolo.pt
echo ==================================================================
pause
