@echo off
title BlueEconomy AI Platform
echo ==================================================================
echo   MENJALANKAN BLUEECONOMY AI PLATFORM (SRS & PDA v1.0)
echo ==================================================================
echo.
cd /d "%~dp0"

echo Membuka browser ke http://127.0.0.1:8000 ...
start http://127.0.0.1:8000

echo Menjalankan backend server & AI engine...
python run_platform.py

pause
