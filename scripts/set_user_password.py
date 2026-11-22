"""
BlueEconomy AI - Script Pengaturan / Reset Kata Sandi Pengguna
Penggunaan:
    python scripts/set_user_password.py <email> <password_baru>
Contoh:
    python scripts/set_user_password.py admin@blueeconomy.id admin123
"""

import sys
import hashlib
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "blueeconomy.db"

def hash_pw(pw: str) -> str:
    return hashlib.sha256(f"blue_{pw}_salt".encode()).hexdigest()

def update_password(email: str, new_password: str):
    if not DB_PATH.exists():
        print(f"Database tidak ditemukan di {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, email, role FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user:
        print(f"[Gagal] Pengguna dengan email '{email}' tidak ditemukan di database.")
        conn.close()
        return

    pw_hash = hash_pw(new_password)
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (pw_hash, email))
    conn.commit()
    conn.close()

    print("=" * 60)
    print(" [Sukses] Kata Sandi Berhasil Diperbarui!")
    print(f" • Nama Pengguna : {user[1]}")
    print(f" • Email         : {user[2]}")
    print(f" • Peran (Role)  : {user[3]}")
    print(f" • Password Baru : {new_password}")
    print("=" * 60)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Penggunaan: python scripts/set_user_password.py <email> <password_baru>")
        print("Contoh    : python scripts/set_user_password.py admin@blueeconomy.id admin123")
    else:
        update_password(sys.argv[1], sys.argv[2])
