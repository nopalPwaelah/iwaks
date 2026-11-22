import sys
from pathlib import Path
from datetime import datetime, timedelta
import hashlib

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

try:
    from backend.database import engine, SessionLocal, Base
    from backend.models import (
        User, FishSpecies, Location, Market, FishPrice, UMKM, Product,
        Catch, CatchDetail, OperatingCost, Detection, DetectionItem
    )
except ImportError:
    from database import engine, SessionLocal, Base
    from models import (
        User, FishSpecies, Location, Market, FishPrice, UMKM, Product,
        Catch, CatchDetail, OperatingCost, Detection, DetectionItem
    )

def hash_pw(pw: str) -> str:
    # Deterministic SHA256 + salt for local ease and zero dependency risk
    return hashlib.sha256(f"blue_{pw}_salt".encode()).hexdigest()

def seed_database():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already has records, skipping seed.")
        db.close()
        return

    print("Seeding initial data...")

    # 1. Users
    users_data = [
        ("Pak Budi Santoso", "nelayan@blueeconomy.id", "Nelayan", "081234567890"),
        ("Ibu Siti Aminah", "umkm@blueeconomy.id", "UMKM", "081298765432"),
        ("Admin Kelautan", "admin@blueeconomy.id", "Admin", "081100112233"),
        ("Pengelola Pasar Muara Baru", "pasar@blueeconomy.id", "Pengelola Pasar", "081333444555"),
        ("Dinas Kelautan & Perikanan", "stakeholder@blueeconomy.id", "Stakeholder", "081999888777")
    ]
    user_objs = {}
    for name, email, role, phone in users_data:
        u = User(name=name, email=email, role=role, phone=phone, password_hash=hash_pw("password123"))
        db.add(u)
        user_objs[role] = u
    db.commit()

    # 2. Fish Species (The 8 dataset species)
    species_catalog = [
        ("Chanos Chanos", "Ikan Bandeng", "Milkfish", "Ikan Konsumsi Payau", 38000, 35.0),
        ("Eleutheronema Tetradactylum", "Ikan Kurau / Senangin", "Fourfinger Threadfin", "Ikan Laut Ekonomis Tinggi", 78000, 45.0),
        ("Johnius Trachycephalus", "Ikan Gulama", "Croaker", "Ikan Demersal Laut", 28000, 22.0),
        ("Nibea Albiflora", "Ikan Samge / Yellow Drum", "Yellow Drum", "Ikan Laut", 46000, 30.0),
        ("Oreochromis Mossambicus", "Ikan Mujair", "Mozambique Tilapia", "Ikan Air Tawar / Payau", 32000, 25.0),
        ("Oreochromis Niloticus", "Ikan Nila", "Nile Tilapia", "Ikan Air Tawar Populer", 35000, 28.0),
        ("Rastrelliger Faughni", "Ikan Kembung", "Island Mackerel", "Ikan Pelagis Kecil", 42000, 20.0),
        ("Upeneus Moluccensis", "Ikan Kuniran / Biji Nangka", "Goldband Goatfish", "Ikan Karang / Demersal", 26000, 18.0)
    ]
    sp_objs = []
    for sc, cm, en, cat, pr, ln in species_catalog:
        sp = FishSpecies(
            scientific_name=sc, common_name=cm, english_name=en,
            category=cat, avg_price_idr=pr, avg_length_cm=ln
        )
        db.add(sp)
        sp_objs.append(sp)
    db.commit()

    # 3. Locations (TPI, Pelabuhan, Sentra Pesisir)
    locations_data = [
        ("TPI Muara Angke", "TPI", "Jakarta Utara", -6.1118, 106.7725, "021-6691122"),
        ("TPI Kalibaru Cilincing", "TPI", "Jakarta Utara", -6.1042, 106.9234, "021-4402345"),
        ("Pelabuhan Perikanan Samudera Nizam Zachman", "Pelabuhan", "Jakarta Utara", -6.1055, 106.7994, "021-6629988"),
        ("TPI Brondong", "TPI", "Lamongan, Jawa Timur", -6.8774, 112.2818, "0322-661201"),
        ("TPI Karangsong", "TPI", "Indramayu, Jawa Barat", -6.3150, 108.3615, "0234-274112")
    ]
    loc_objs = []
    for name, ltype, reg, lat, lon, contact in locations_data:
        loc = Location(name=name, type=ltype, region=reg, latitude=lat, longitude=lon, contact_info=contact)
        db.add(loc)
        loc_objs.append(loc)
    db.commit()

    # 4. Markets (Pasar Ikan)
    markets_data = [
        ("Pasar Ikan Modern Muara Baru", "Jl. Muara Baru Raya, Penjaringan", "Jakarta Utara", -6.1062, 106.7985, 4.5),
        ("Pasar Ikan Glodok Petak Sembilan", "Jl. Kemenangan Raya, Glodok", "Jakarta Barat", -6.1458, 106.8123, 8.2),
        ("Pasar Induk Kramat Jati", "Jl. Raya Bogor KM 17", "Jakarta Timur", -6.2842, 106.8711, 24.0),
        ("Pasar Ikan Mayestik", "Jl. Tebah III, Kebayoran Baru", "Jakarta Selatan", -6.2415, 106.7924, 19.5),
        ("Pasar Pabean Cantian", "Jl. Songoyudan, Nyamplungan", "Surabaya", -7.2341, 112.7422, 780.0),
        ("Pasar Ikan Kedonganan", "Jl. Pantai Kedonganan, Jimbaran", "Bali", -8.7612, 115.1681, 1180.0)
    ]
    mkt_objs = []
    for name, addr, city, lat, lon, dist in markets_data:
        mkt = Market(market_name=name, address=addr, city=city, latitude=lat, longitude=lon, distance_km=dist)
        db.add(mkt)
        mkt_objs.append(mkt)
    db.commit()

    # 5. Fish Prices with provenance and timestamps
    now = datetime.utcnow()
    sources = ["Dinas Ketahanan Pangan & Kelautan", "Laporan Petugas Lelang TPI", "Survei Harian Pasar", "Asosiasi Pedagang Ikan"]
    
    for sp in sp_objs:
        for idx, mkt in enumerate(mkt_objs[:4]):
            # Variasi harga antar pasar
            price_delta = (idx * 2500) - 1500
            price = max(20000, sp.avg_price_idr + price_delta)
            src = sources[idx % len(sources)]
            obs_time = now - timedelta(hours=idx * 6)

            fp = FishPrice(
                species_id=sp.id,
                market_id=mkt.id,
                price_per_kg=price,
                currency="IDR",
                source_name=src,
                observed_at=obs_time,
                created_by="Pengelola Pasar"
            )
            db.add(fp)
    db.commit()

    # 6. UMKM Profiles
    umkm1 = UMKM(
        user_id=user_objs["UMKM"].id,
        business_name="Olahan Bandeng Juwana & Ikan Asap Bahari",
        owner_name="Ibu Siti Aminah",
        description="Spesialis olahan bandeng duri lunak, otak-otak ikan, dan pepes presto menggunakan pasokan ikan segar langsung dari nelayan Muara Angke.",
        category="Pengolahan Ikan Duri Lunak",
        city="Jakarta Utara",
        address="Kawasan Industri Pesisir Muara Angke No. 12",
        latitude=-6.1135,
        longitude=106.7742,
        contact_phone="081298765432",
        raw_material_needs="Mencari pasokan rutin Ikan Bandeng segar (ukuran 3-4 ekor/kg) dan Ikan Tenggiri/Kurau hingga 200 kg/minggu."
    )
    db.add(umkm1)

    umkm2 = UMKM(
        business_name="Sentra Kerupuk & Abon Ikan Pesisir Mandiri",
        owner_name="Pak Joko Susilo",
        description="Produksi kerupuk kemplang ikan kembung, abon ikan nila gurih, dan ikan asin higienis tanpa pengawet kimia.",
        category="Kerupuk & Abon Hasil Laut",
        city="Jakarta Utara",
        address="Jl. Dermaga Ujung Blok C No. 4, Kalibaru",
        latitude=-6.1082,
        longitude=106.9185,
        contact_phone="081388776655",
        raw_material_needs="Menerima Ikan Kembung, Ikan Gulama, dan Ikan Kuniran segar harian 100-300 kg."
    )
    db.add(umkm2)
    db.commit()

    # 7. UMKM Products
    products_data = [
        (umkm1.id, "Bandeng Presto Duri Lunak Vacuum", "Olahan Ikan", 48000, "1 Box (2 ekor/500g)", "Bandeng segar bumbu rempah tradisional dikemas vacuum tahan 1 bulan."),
        (umkm1.id, "Otak-Otak Ikan Kurau Bakar", "Olahan Ikan", 35000, "Isi 10 pcs + Bumbu Kacang", "Dibuat dari 100% daging ikan segar dengan aroma daun pisang bakar gurih."),
        (umkm1.id, "Pepes Ikan Nila Daun Kemangi", "Makanan Siap Saji", 28000, "1 Porsi (300g)", "Ikan nila pilihan dibumbui rica kemangi khas pesisir."),
        (umkm2.id, "Kerupuk Kemplang Ikan Kembung Gurih", "Camilan Laut", 25000, "Kemasan 250gr", "Kerupuk ikan renyah gurih tanpa pewarna & pengawet."),
        (umkm2.id, "Abon Ikan Nila Spesial Non-MSG", "Olahan Kering", 40000, "Toples 200gr", "Abon serat daging ikan nila kaya protein untuk lauk balita dan keluarga.")
    ]
    for uid, pname, pcat, pprice, punit, pdesc in products_data:
        p = Product(umkm_id=uid, product_name=pname, category=pcat, price=pprice, unit=punit, description=pdesc)
        db.add(p)
    db.commit()

    # 8. Sample Catch & Operating Costs for Nelayan
    nelayan_user = user_objs["Nelayan"]
    sample_catch = Catch(
        user_id=nelayan_user.id,
        location_id=loc_objs[0].id,
        location_name="TPI Muara Angke (Zona Penangkapan Teluk Jakarta)",
        catch_date=now - timedelta(days=1),
        notes="Melaut selama 12 jam, cuaca cerah, ombak tenang 0.5 meter. Hasil tangkapan didominasi Bandeng dan Kembung."
    )
    db.add(sample_catch)
    db.commit()

    cd1 = CatchDetail(catch_id=sample_catch.id, species_id=sp_objs[0].id, quantity=45, weight_kg=18.5) # Bandeng
    cd2 = CatchDetail(catch_id=sample_catch.id, species_id=sp_objs[6].id, quantity=60, weight_kg=15.0) # Kembung
    db.add_all([cd1, cd2])

    costs = [
        OperatingCost(catch_id=sample_catch.id, cost_type="BBM / Solar", amount=140000, notes="20 Liter Solar Subsidi"),
        OperatingCost(catch_id=sample_catch.id, cost_type="Balok Es Pendingin", amount=45000, notes="3 Balok Es Hancur"),
        OperatingCost(catch_id=sample_catch.id, cost_type="Upah ABK / Tenaga Kerja", amount=150000, notes="1 Orang ABK Pembantu"),
        OperatingCost(catch_id=sample_catch.id, cost_type="Logistik & Perbekalan", amount=35000, notes="Air minum dan ransum kapal")
    ]
    db.add_all(costs)
    db.commit()

    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
