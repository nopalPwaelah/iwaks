import os
import shutil
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent

if os.environ.get("VERCEL"):
    db_file = Path("/tmp/blueeconomy.db")
    src_db = BASE_DIR / "blueeconomy.db"
    if not db_file.exists() and src_db.exists():
        try:
            shutil.copyfile(src_db, db_file)
        except Exception:
            pass
    DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{db_file}")
else:
    DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'blueeconomy.db'}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
