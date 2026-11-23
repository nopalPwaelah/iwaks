import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))
sys.path.insert(0, str(BASE_DIR / "ai_service"))

# Auto-seed database in serverless /tmp if needed
try:
    from backend.database import engine, Base
    from backend.seed import seed_database
    Base.metadata.create_all(bind=engine)
    seed_database()
except Exception as e:
    print(f"[Vercel Setup] DB init: {e}")

from backend.main import app
