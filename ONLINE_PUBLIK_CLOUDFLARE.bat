@echo off
title BlueEconomy AI - Online Cloudflare Tunnel
echo ====================================================================
echo    MEMBUKA AKSES PUBLIK ONLINE BLUEECONOMY AI (100%% GRATIS)
echo ====================================================================
echo.
cd /d "%~dp0"

echo [1/2] Memastikan Backend Server & AI Engine Berjalan...
netstat -ano | findstr :8000 >nul
if %errorlevel% neq 0 (
    echo Menjalankan local server di port 8000...
    start /b python run_platform.py >nul 2>&1
    timeout /t 3 /nobreak >nul
) else (
    echo Local server sudah aktif di port 8000.
)

echo [2/2] Menghubungkan ke Cloudflare Global Network...
echo.
echo ====================================================================
echo PERHATIKAN:
echo Salin link publik HTTPS yang berakhiran ".trycloudflare.com" di bawah!
echo Link tersebut bisa langsung Anda kirim ke juri lomba / teman.
echo ====================================================================
echo.

.\cloudflared.exe tunnel --url http://127.0.0.1:8000

pause
