"""
BlueEconomy AI - Startup Runner
Menjalankan Platform Terintegrasi (Backend REST API + AI Service + Frontend)
"""

import os
import sys
import subprocess
import uvicorn
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))
sys.path.insert(0, str(BASE_DIR / "ai_service"))

def check_database():
    db_file = BASE_DIR / "blueeconomy.db"
    if not db_file.exists():
        print("[BlueEconomy AI] Database belum ada. Melakukan seeding data awal...")
        from backend.seed import seed_database
        seed_database()
    else:
        print(f"[BlueEconomy AI] Database aktif: {db_file}")

if __name__ == "__main__":
    check_database()

    print("\n==================================================================")
    print("  BLUEECONOMY AI - COASTAL INTELLIGENCE PLATFORM (SRS & PDA v1.0)  ")
    print("==================================================================")
    print("  * Web Dashboard & UI    : http://127.0.0.1:8000")
    print("  * REST API Documentation: http://127.0.0.1:8000/docs")
    print("  * AI Service Endpoint   : http://127.0.0.1:8000/api/detections")
    print("==================================================================\n")

    from backend.main import app
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port, log_level="info")
