import os
import sys
import uuid
import io
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))
sys.path.insert(0, str(BASE_DIR / "ai_service"))

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query, Form, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from PIL import Image

try:
    from backend.database import engine, get_db, Base
    from backend.models import (
        User, FishSpecies, Location, Market, FishPrice, UMKM, Product,
        Catch, CatchDetail, OperatingCost, Detection, DetectionItem
    )
    from backend.seed import hash_pw
    from ai_service.detector import detector, SPECIES_MAP
except ImportError:
    from database import engine, get_db, Base
    from models import (
        User, FishSpecies, Location, Market, FishPrice, UMKM, Product,
        Catch, CatchDetail, OperatingCost, Detection, DetectionItem
    )
    from seed import hash_pw
    from detector import detector, SPECIES_MAP

# Setup directories
if os.environ.get("VERCEL"):
    UPLOADS_DIR = Path("/tmp/uploads")
else:
    UPLOADS_DIR = BASE_DIR / "uploads"

try:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

app = FastAPI(
    title="BlueEconomy AI - Coastal Economic Intelligence Platform API",
    description="Backend REST API untuk sistem deteksi ikan YOLO, catatan tangkapan, intelijen harga, analisis keuntungan, GIS pesisir, dan UMKM",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static folder
try:
    app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
except Exception:
    pass

@app.on_event("startup")
def init_db_on_startup():
    try:
        from backend.models import Base
        Base.metadata.create_all(bind=engine)
        from backend.seed import seed_database
        seed_database()
    except Exception as e:
        print(f"[Startup] DB init error: {e}")

# Mount built frontend dist if available
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    def serve_frontend_root():
        return FileResponse(FRONTEND_DIST / "index.html")

# Simple token storage for mock/stateless auth
# (Token: user_id)
ACTIVE_TOKENS = {}

# ----------------- Auth Helpers -----------------
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization:
        # Default to demo nelayan user if no auth header passed
        user = db.query(User).filter(User.email == "nelayan@blueeconomy.id").first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Header Authorization diperlukan.")
    
    token = authorization.replace("Bearer ", "").strip()
    user_id = ACTIVE_TOKENS.get(token)
    if not user_id:
        # Check if token is user_id directly for easy testing
        if token.isdigit():
            user = db.query(User).filter(User.id == int(token)).first()
            if user:
                return user
        user = db.query(User).filter(User.email == "nelayan@blueeconomy.id").first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Sesi login tidak valid atau telah berakhir.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan.")
    return user

# ----------------- Schemas -----------------
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Nelayan"
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class DetectionItemConfirm(BaseModel):
    id: Optional[int] = None
    species_id: int
    class_label: str
    confidence: float
    x1: int
    y1: int
    x2: int
    y2: int
    estimated_length_cm: Optional[float] = None
    is_confirmed: bool = True

class ConfirmDetectionRequest(BaseModel):
    items: List[DetectionItemConfirm]
    save_as_catch: bool = False
    weight_kg: Optional[float] = None
    location_id: Optional[int] = None
    target_market_id: Optional[int] = None
    trade_status: Optional[str] = "none"
    fisherman_name: Optional[str] = "Nelayan Tangguh"
    notes: Optional[str] = None

class CatchDetailInput(BaseModel):
    species_id: int
    quantity: int
    weight_kg: float
    offered_price_per_kg: Optional[float] = None

class CostInput(BaseModel):
    cost_type: str
    amount: float
    notes: Optional[str] = None

class CreateCatchRequest(BaseModel):
    location_id: Optional[int] = None
    location_name: Optional[str] = "TPI Muara Angke"
    target_market_id: Optional[int] = None
    trade_status: Optional[str] = "none"  # none, submitted, partially_accepted, accepted, rejected
    fisherman_name: Optional[str] = "Nelayan Tangguh"
    catch_date: Optional[str] = None
    notes: Optional[str] = None
    detection_id: Optional[int] = None
    details: List[CatchDetailInput]
    costs: List[CostInput] = []

class ReviewTradeItem(BaseModel):
    detail_id: int
    status: str  # accepted | rejected
    response_note: Optional[str] = None

class ReviewTradeRequest(BaseModel):
    market_notes: Optional[str] = None
    items: List[ReviewTradeItem]

class CreatePriceRequest(BaseModel):
    species_id: int
    market_id: int
    price_per_kg: float
    source_name: str
    currency: str = "IDR"

class CreateProductRequest(BaseModel):
    umkm_id: int
    product_name: str
    category: str
    price: float
    unit: str
    description: Optional[str] = None

# ==================== 1. AUTHENTICATION (FR-01, FR-02, FR-03) ====================

@app.post("/api/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Keamanan: Peran Administrator & DKP tidak diizinkan melalui registrasi publik
    if req.role in ["Admin", "Stakeholder", "Admin & Stakeholder (DKP)"]:
        raise HTTPException(
            status_code=403,
            detail="Pendaftaran akun Administrator/DKP tidak diizinkan melalui form publik."
        )

    allowed_roles = ["Nelayan", "UMKM", "Pengelola Pasar"]
    assigned_role = req.role if req.role in allowed_roles else "Nelayan"

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar.")
    
    user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_pw(req.password),
        role=assigned_role,
        phone=req.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Inisialisasi otomatis profil UMKM jika mendaftar sebagai UMKM
    if req.role == "UMKM":
        existing_umkm = db.query(UMKM).filter(UMKM.user_id == user.id).first()
        if not existing_umkm:
            new_umkm = UMKM(
                user_id=user.id,
                business_name=f"UMKM Olahan {req.name}",
                owner_name=req.name,
                category="Olahan Hasil Laut Pesisir",
                city="Jakarta Utara",
                address="Sentra Perikanan Muara Angke",
                contact_phone=req.phone or "081234567890",
                raw_material_needs="Ikan Bandeng, Ikan Kembung, Ikan Nila"
            )
            db.add(new_umkm)
            db.commit()

    token = f"tok_{uuid.uuid4().hex[:16]}"
    ACTIVE_TOKENS[token] = user.id

    return {
        "success": True,
        "message": "Registrasi berhasil.",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.post("/api/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    pw_hash = hash_pw(req.password)
    user = db.query(User).filter(User.email == req.email, User.password_hash == pw_hash).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email atau kata sandi tidak cocok.")
    
    token = f"tok_{uuid.uuid4().hex[:16]}"
    ACTIVE_TOKENS[token] = user.id

    return {
        "success": True,
        "message": "Login berhasil.",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.post("/api/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        ACTIVE_TOKENS.pop(token, None)
    return {"success": True, "message": "Berhasil logout."}

@app.get("/api/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone
    }

# ==================== 2. DASHBOARD (FR-04) ====================

@app.get("/api/dashboard")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_catches_count = db.query(Catch).count()
    user_catches = db.query(Catch).filter(Catch.user_id == user.id).all()
    user_catches_count = len(user_catches)

    # Compute total catch weight and estimated revenue
    total_weight_kg = 0.0
    total_revenue_idr = 0.0
    for c in user_catches:
        for d in c.details:
            total_weight_kg += d.weight_kg
            price = d.species.avg_price_idr if d.species else 30000
            total_revenue_idr += (d.weight_kg * price)

    recent_catches = db.query(Catch).order_by(Catch.created_at.desc()).limit(5).all()
    recent_detections = db.query(Detection).order_by(Detection.created_at.desc()).limit(5).all()
    species_count = db.query(FishSpecies).filter(FishSpecies.is_active == True).count()
    umkm_count = db.query(UMKM).count()
    markets_count = db.query(Market).count()

    # Price alerts (top active prices)
    top_prices = db.query(FishPrice).order_by(FishPrice.observed_at.desc()).limit(6).all()

    return {
        "role": user.role,
        "user_name": user.name,
        "metrics": {
            "user_catches_count": user_catches_count,
            "total_catches_all": total_catches_count,
            "total_weight_kg": round(total_weight_kg, 1),
            "estimated_revenue_idr": total_revenue_idr,
            "active_species_count": species_count,
            "markets_count": markets_count,
            "umkm_count": umkm_count
        },
        "recent_catches": [
            {
                "id": c.id,
                "location": c.location_name,
                "date": c.catch_date.strftime("%Y-%m-%d %H:%M") if c.catch_date else (c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M")),
                "total_weight_kg": sum(d.weight_kg for d in c.details),
                "species_list": [d.species.common_name for d in c.details if d.species]
            } for c in recent_catches
        ],
        "recent_detections": [
            {
                "id": d.id,
                "created_at": d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
                "total_count": d.total_count,
                "status": d.status,
                "image_url": f"/uploads/{os.path.basename(d.image_path)}" if d.image_path else ""
            } for d in recent_detections
        ],
        "market_price_feed": [
            {
                "species": p.species.common_name if p.species else "Ikan",
                "scientific": p.species.scientific_name if p.species else "-",
                "market": p.market.market_name if p.market else "Pasar Pesisir",
                "price": p.price_per_kg,
                "observed_at": p.observed_at.strftime("%d %b %Y %H:%M") if p.observed_at else datetime.utcnow().strftime("%d %b %Y %H:%M")
            } for p in top_prices
        ]
    }

# ==================== 3. AI FISH DETECTION & COUNTING (FR-05, FR-06, FR-07, FR-08, FR-09) ====================

@app.post("/api/detections")
async def create_detection(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.40),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid_exts = [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]
    filename = file.filename or "upload.jpg"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Format file '{ext}' tidak diizinkan. Gunakan JPG, PNG, TIFF, atau WEBP.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File kosong.")

    # Save original and convert to web-compatible JPEG
    unique_id = uuid.uuid4().hex[:12]
    saved_filename = f"detect_{unique_id}.jpg"
    save_path = UPLOADS_DIR / saved_filename

    try:
        pil_img = Image.open(io.BytesIO(content))
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
        pil_img.save(save_path, "JPEG", quality=90)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca gambar: {str(e)}")

    # Run AI inference
    result = detector.detect(content, conf_thresh=confidence_threshold)

    # Save Detection Session to Database
    detection = Detection(
        user_id=user.id,
        image_path=str(save_path),
        model_version=result.get("model_version", "fish-yolo-v1"),
        image_width=result["image"]["width"],
        image_height=result["image"]["height"],
        confidence_threshold=confidence_threshold,
        total_count=result["total_count"],
        inference_ms=result["inference_ms"],
        status="pending_review"
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)

    # Map detected classes to DB species
    db_species_list = db.query(FishSpecies).all()
    species_by_scientific = {s.scientific_name.lower(): s for s in db_species_list}

    detection_items_out = []
    for d in result["detections"]:
        matched_sp = species_by_scientific.get(d.get("scientific_name", "").lower())
        sp_id = matched_sp.id if matched_sp else None

        item = DetectionItem(
            detection_id=detection.id,
            species_id=sp_id,
            class_label=d["class_name"],
            confidence=d["confidence"],
            x1=d["bbox_xyxy"][0],
            y1=d["bbox_xyxy"][1],
            x2=d["bbox_xyxy"][2],
            y2=d["bbox_xyxy"][3],
            estimated_length_cm=d.get("estimated_length_cm"),
            is_confirmed=True
        )
        db.add(item)
        db.commit()
        db.refresh(item)

        detection_items_out.append({
            "id": item.id,
            "species_id": sp_id,
            "class_label": item.class_label,
            "scientific_name": d.get("scientific_name"),
            "common_name": d.get("common_name"),
            "category": d.get("category"),
            "confidence": item.confidence,
            "bbox_xyxy": [item.x1, item.y1, item.x2, item.y2],
            "estimated_length_cm": item.estimated_length_cm
        })

    return {
        "success": True,
        "detection_id": detection.id,
        "model_version": detection.model_version,
        "image_url": f"/uploads/{saved_filename}",
        "image": {
            "width": detection.image_width,
            "height": detection.image_height
        },
        "total_count": detection.total_count,
        "inference_ms": detection.inference_ms,
        "status": detection.status,
        "detections": detection_items_out,
        "items": detection_items_out,
        "disclaimer": result.get("disclaimer")
    }

@app.get("/api/detections/{id}")
def get_detection_detail(id: int, db: Session = Depends(get_db)):
    det = db.query(Detection).filter(Detection.id == id).first()
    if not det:
        raise HTTPException(status_code=404, detail="Sesi deteksi tidak ditemukan.")
    
    filename = os.path.basename(det.image_path)
    return {
        "id": det.id,
        "image_url": f"/uploads/{filename}",
        "model_version": det.model_version,
        "image_width": det.image_width,
        "image_height": det.image_height,
        "total_count": det.total_count,
        "status": det.status,
        "created_at": det.created_at.strftime("%Y-%m-%d %H:%M") if det.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "items": [
            {
                "id": i.id,
                "species_id": i.species_id,
                "class_label": i.class_label,
                "confidence": i.confidence,
                "bbox_xyxy": [i.x1, i.y1, i.x2, i.y2],
                "estimated_length_cm": i.estimated_length_cm,
                "is_confirmed": i.is_confirmed
            } for i in det.items
        ]
    }

@app.post("/api/detections/{id}/confirm")
def confirm_detection(
    id: int,
    req: ConfirmDetectionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Human-in-the-Loop review and correction of detection items (FR-08)."""
    det = db.query(Detection).filter(Detection.id == id).first()
    if not det:
        raise HTTPException(status_code=404, detail="Sesi deteksi tidak ditemukan.")

    # Remove existing items and replace with user-confirmed items
    db.query(DetectionItem).filter(DetectionItem.detection_id == id).delete()
    
    for item in req.items:
        new_item = DetectionItem(
            detection_id=det.id,
            species_id=item.species_id,
            class_label=item.class_label,
            confidence=item.confidence,
            x1=item.x1,
            y1=item.y1,
            x2=item.x2,
            y2=item.y2,
            estimated_length_cm=item.estimated_length_cm,
            is_confirmed=item.is_confirmed
        )
        db.add(new_item)

    det.status = "confirmed"
    det.total_count = len(req.items)
    db.commit()

    created_catch_id = None
    if req.save_as_catch:
        catch = Catch(
            user_id=user.id,
            location_id=req.location_id,
            location_name="TPI Muara Angke",
            target_market_id=req.target_market_id,
            trade_status=req.trade_status or "none",
            fisherman_name=req.fisherman_name or user.name,
            catch_date=datetime.utcnow(),
            notes=req.notes or f"Hasil tangkapan dari deteksi AI #{det.id}",
            detection_id=det.id
        )
        db.add(catch)
        db.commit()
        db.refresh(catch)
        created_catch_id = catch.id

        # Group items by species
        species_counts = {}
        for it in req.items:
            sid = it.species_id or 1
            species_counts[sid] = species_counts.get(sid, 0) + 1

        total_weight = req.weight_kg or (len(req.items) * 0.4)
        weight_per_fish = total_weight / max(1, len(req.items))

        for sid, count in species_counts.items():
            sp_obj = db.query(FishSpecies).filter(FishSpecies.id == sid).first()
            cd = CatchDetail(
                catch_id=catch.id,
                species_id=sid,
                quantity=count,
                weight_kg=round(count * weight_per_fish, 2),
                status="pending" if req.trade_status == "submitted" else "accepted",
                offered_price_per_kg=sp_obj.avg_price_idr if sp_obj else 30000.0
            )
            db.add(cd)
        db.commit()

    return {
        "success": True,
        "message": "Hasil deteksi berhasil dikonfirmasi pengguna.",
        "detection_id": det.id,
        "status": det.status,
        "confirmed_count": det.total_count,
        "created_catch_id": created_catch_id
    }

# ==================== 4. FISH SPECIES CATALOG (FR-19) ====================

@app.get("/api/fish-species")
def get_fish_species(db: Session = Depends(get_db)):
    species = db.query(FishSpecies).filter(FishSpecies.is_active == True).all()
    return [
        {
            "id": s.id,
            "scientific_name": s.scientific_name,
            "common_name": s.common_name,
            "english_name": s.english_name,
            "category": s.category,
            "avg_price_idr": s.avg_price_idr,
            "avg_length_cm": s.avg_length_cm
        } for s in species
    ]

# ==================== 5. CATCH MANAGEMENT (FR-10) ====================

@app.get("/api/catches")
def get_catches(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Catch)
    if user.role == "Nelayan":
        query = query.filter(Catch.user_id == user.id)
    
    catches = query.order_by(Catch.catch_date.desc()).all()
    out = []
    for c in catches:
        total_w = sum(d.weight_kg for d in c.details)
        total_rev = sum(d.weight_kg * (d.species.avg_price_idr if d.species else 30000) for d in c.details)
        total_cost = sum(co.amount for co in c.operating_costs)
        
        out.append({
            "id": c.id,
            "user_id": c.user_id,
            "user_name": c.fisherman_name or (c.user.name if c.user else "Anonim"),
            "location_name": c.location_name,
            "target_market_id": c.target_market_id,
            "target_market_name": c.target_market.market_name if c.target_market else None,
            "trade_status": c.trade_status or "none",
            "market_notes": c.market_notes,
            "catch_date": c.catch_date.strftime("%Y-%m-%d %H:%M") if c.catch_date else (c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M")),
            "notes": c.notes,
            "total_weight_kg": round(total_w, 2),
            "estimated_revenue": total_rev,
            "total_costs": total_cost,
            "estimated_profit": total_rev - total_cost,
            "details": [
                {
                    "id": d.id,
                    "species_id": d.species_id,
                    "species_name": d.species.common_name if d.species else "Unknown",
                    "quantity": d.quantity,
                    "weight_kg": d.weight_kg,
                    "status": d.status or "pending",
                    "offered_price_per_kg": d.offered_price_per_kg or (d.species.avg_price_idr if d.species else 30000),
                    "market_response_note": d.market_response_note
                } for d in c.details
            ],
            "operating_costs": [
                {
                    "cost_type": co.cost_type,
                    "amount": co.amount,
                    "notes": co.notes
                } for co in c.operating_costs
            ]
        })
    return out

@app.post("/api/catches")
def create_catch(req: CreateCatchRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c_date = datetime.utcnow()
    if req.catch_date:
        try:
            c_date = datetime.fromisoformat(req.catch_date.replace("Z", ""))
        except:
            pass

    catch = Catch(
        user_id=user.id,
        location_id=req.location_id,
        location_name=req.location_name or "TPI Muara Angke",
        target_market_id=req.target_market_id,
        trade_status=req.trade_status or "none",
        fisherman_name=req.fisherman_name or user.name,
        catch_date=c_date,
        notes=req.notes,
        detection_id=req.detection_id
    )
    db.add(catch)
    db.commit()
    db.refresh(catch)

    for d in req.details:
        sp_obj = db.query(FishSpecies).filter(FishSpecies.id == d.species_id).first()
        cd = CatchDetail(
            catch_id=catch.id,
            species_id=d.species_id,
            quantity=d.quantity,
            weight_kg=d.weight_kg,
            status="pending" if req.trade_status == "submitted" else "accepted",
            offered_price_per_kg=d.offered_price_per_kg or (sp_obj.avg_price_idr if sp_obj else 30000.0)
        )
        db.add(cd)

    for cost in req.costs:
        oc = OperatingCost(
            catch_id=catch.id,
            cost_type=cost.cost_type,
            amount=cost.amount,
            notes=cost.notes
        )
        db.add(oc)

    db.commit()
    return {"success": True, "message": "Catatan tangkapan berhasil disimpan.", "catch_id": catch.id}

# ==================== 5. TRADE OFFERS & MARKET APPROVAL ====================

@app.get("/api/trade-offers")
def get_trade_offers(market_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Mengambil pengajuan penawaran ikan nelayan ke pasar."""
    query = db.query(Catch).filter(Catch.trade_status != "none")
    if market_id:
        query = query.filter(Catch.target_market_id == market_id)
    
    catches = query.order_by(Catch.created_at.desc()).all()
    results = []
    for c in catches:
        total_w = sum(d.weight_kg for d in c.details)
        total_val = sum(d.weight_kg * (d.offered_price_per_kg or 30000) for d in c.details)
        results.append({
            "catch_id": c.id,
            "fisherman_name": c.fisherman_name or (c.user.name if c.user else "Nelayan"),
            "target_market_id": c.target_market_id,
            "target_market_name": c.target_market.market_name if c.target_market else "Pasar Bebas",
            "trade_status": c.trade_status,
            "market_notes": c.market_notes,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else (c.catch_date.strftime("%Y-%m-%d %H:%M") if c.catch_date else datetime.utcnow().strftime("%Y-%m-%d %H:%M")),
            "total_weight_kg": round(total_w, 2),
            "estimated_value": round(total_val, 2),
            "items": [
                {
                    "detail_id": d.id,
                    "species_id": d.species_id,
                    "species_name": d.species.common_name if d.species else "Unknown",
                    "quantity": d.quantity,
                    "weight_kg": d.weight_kg,
                    "price_per_kg": d.offered_price_per_kg or 30000,
                    "status": d.status,  # pending | accepted | rejected
                    "response_note": d.market_response_note
                } for d in c.details
            ]
        })
    return results

@app.post("/api/trade-offers/{catch_id}/review")
def review_trade_offer(
    catch_id: int,
    req: ReviewTradeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pengelola Pasar melakukan Accept / Decline komoditas tangkapan nelayan."""
    catch = db.query(Catch).filter(Catch.id == catch_id).first()
    if not catch:
        raise HTTPException(status_code=404, detail="Pengajuan penawaran tidak ditemukan.")

    for it in req.items:
        detail = db.query(CatchDetail).filter(CatchDetail.id == it.detail_id, CatchDetail.catch_id == catch_id).first()
        if detail:
            detail.status = it.status
            if it.response_note:
                detail.market_response_note = it.response_note

    catch.market_notes = req.market_notes

    # Recalculate overall status
    all_details = db.query(CatchDetail).filter(CatchDetail.catch_id == catch_id).all()
    statuses = [d.status for d in all_details]
    
    if all(s == "accepted" for s in statuses):
        catch.trade_status = "accepted"
    elif all(s == "rejected" for s in statuses):
        catch.trade_status = "rejected"
    else:
        catch.trade_status = "partially_accepted"

    db.commit()
    return {
        "success": True,
        "message": f"Pengajuan berhasil diproses: Status {catch.trade_status}",
        "trade_status": catch.trade_status
    }

# ==================== 6. PRICE INTELLIGENCE (FR-11, FR-14) ====================

@app.get("/api/markets")
def get_markets(db: Session = Depends(get_db)):
    """Daftar pasar ikan acuan untuk pengajuan dan pemantauan harga."""
    mkts = db.query(Market).filter(Market.is_active == True).all()
    return [
        {
            "id": m.id,
            "market_name": m.market_name,
            "address": m.address,
            "city": m.city,
            "distance_km": m.distance_km
        }
        for m in mkts
    ]

@app.get("/api/prices")
def get_prices(
    species_id: Optional[int] = None,
    market_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FishPrice)
    if species_id:
        query = query.filter(FishPrice.species_id == species_id)
    if market_id:
        query = query.filter(FishPrice.market_id == market_id)

    prices = query.order_by(FishPrice.observed_at.desc()).all()
    now = datetime.utcnow()

    return [
        {
            "id": p.id,
            "species_id": p.species_id,
            "species_common": p.species.common_name,
            "species_scientific": p.species.scientific_name,
            "market_id": p.market_id,
            "market_name": p.market.market_name,
            "market_city": p.market.city,
            "price_per_kg": p.price_per_kg,
            "currency": p.currency,
            "source_name": p.source_name,
            "observed_at": p.observed_at.strftime("%Y-%m-%d %H:%M") if p.observed_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            "is_fresh": (now - p.observed_at).days < 3 if p.observed_at else True,
            "age_days": (now - p.observed_at).days if p.observed_at else 0
        } for p in prices
    ]

@app.post("/api/prices")
def create_price(req: CreatePriceRequest, db: Session = Depends(get_db)):
    fp = FishPrice(
        species_id=req.species_id,
        market_id=req.market_id,
        price_per_kg=req.price_per_kg,
        currency=req.currency,
        source_name=req.source_name,
        observed_at=datetime.utcnow(),
        created_by="Petugas Pasar"
    )
    db.add(fp)
    db.commit()
    return {"success": True, "message": "Harga komoditas berhasil ditambahkan."}

# ==================== 7. PROFIT & ECONOMIC ANALYSIS (FR-12, FR-13) ====================

@app.get("/api/profit-analysis")
def get_profit_analysis(
    catch_id: Optional[int] = None,
    weight_kg: Optional[float] = 20.0,
    species_id: Optional[int] = 1,
    fuel_cost: Optional[float] = 100000.0,
    ice_cost: Optional[float] = 30000.0,
    labor_cost: Optional[float] = 100000.0,
    other_cost: Optional[float] = 20000.0,
    db: Session = Depends(get_db)
):
    """Calculates Revenue = Weight * Price, Net Profit = Revenue - Total Costs."""
    if catch_id:
        c = db.query(Catch).filter(Catch.id == catch_id).first()
        if c:
            calc_details = []
            gross_revenue = 0.0
            total_weight = 0.0

            for cd in c.details:
                sp = cd.species
                price = sp.avg_price_idr if sp else 30000
                rev = cd.weight_kg * price
                gross_revenue += rev
                total_weight += cd.weight_kg
                calc_details.append({
                    "species": sp.common_name if sp else "Ikan",
                    "weight_kg": cd.weight_kg,
                    "price_per_kg": price,
                    "revenue": rev
                })

            total_costs = sum(co.amount for co in c.operating_costs)
            cost_items = [{"cost_type": co.cost_type, "amount": co.amount, "notes": co.notes} for co in c.operating_costs]
            net_profit = gross_revenue - total_costs
            margin = (net_profit / gross_revenue * 100) if gross_revenue > 0 else 0

            return {
                "catch_id": c.id,
                "location": c.location_name,
                "total_weight_kg": round(total_weight, 2),
                "gross_revenue": gross_revenue,
                "total_operating_costs": total_costs,
                "net_profit": net_profit,
                "profit_margin_percent": round(margin, 1),
                "details": calc_details,
                "cost_breakdown": cost_items
            }

    # Custom simulation parameters
    sp = db.query(FishSpecies).filter(FishSpecies.id == species_id).first()
    price_per_kg = sp.avg_price_idr if sp else 35000.0
    gross_revenue = (weight_kg or 0.0) * price_per_kg
    total_costs = (fuel_cost or 0) + (ice_cost or 0) + (labor_cost or 0) + (other_cost or 0)
    net_profit = gross_revenue - total_costs
    margin = (net_profit / gross_revenue * 100) if gross_revenue > 0 else 0

    return {
        "species_id": species_id,
        "species_name": sp.common_name if sp else "Ikan Bandeng",
        "weight_kg": weight_kg,
        "price_per_kg": price_per_kg,
        "gross_revenue": gross_revenue,
        "total_operating_costs": total_costs,
        "net_profit": net_profit,
        "profit_margin_percent": round(margin, 1),
        "cost_breakdown": [
            {"cost_type": "BBM / Solar", "amount": fuel_cost},
            {"cost_type": "Balok Es", "amount": ice_cost},
            {"cost_type": "Tenaga Kerja / ABK", "amount": labor_cost},
            {"cost_type": "Biaya Lain-lain", "amount": other_cost}
        ]
    }

# ==================== 8. MARKET RECOMMENDATION ENGINE (FR-15) ====================

@app.get("/api/market-recommendations")
def get_market_recommendations(
    species_id: int = 1,
    weight_kg: float = 50.0,
    transport_rate_per_km: float = 5000.0,  # Biaya angkut per km
    db: Session = Depends(get_db)
):
    """
    Rumus PDA Section 4.3:
    Nilai Bersih = (berat × harga pasar) − biaya distribusi (jarak × tarif/km) − biaya tambahan pasar.
    """
    markets = db.query(Market).filter(Market.is_active == True).all()
    recommendations = []

    now = datetime.utcnow()

    for m in markets:
        # Get latest price for this species at this market
        latest_price = db.query(FishPrice).filter(
            FishPrice.species_id == species_id,
            FishPrice.market_id == m.id
        ).order_by(FishPrice.observed_at.desc()).first()

        if latest_price:
            price_per_kg = latest_price.price_per_kg
            source = latest_price.source_name
            age_days = (now - latest_price.observed_at).days
            is_stale = age_days > 7
        else:
            # Fallback to species base price
            sp = db.query(FishSpecies).filter(FishSpecies.id == species_id).first()
            price_per_kg = sp.avg_price_idr if sp else 32000.0
            source = "Estimasi Harga Standar"
            is_stale = True
            age_days = 10

        dist_km = m.distance_km
        gross_rev = weight_kg * price_per_kg
        dist_cost = dist_km * transport_rate_per_km
        market_fee = 10000.0  # Retribusi lelang/lapak pasar
        net_value = gross_rev - dist_cost - market_fee

        recommendations.append({
            "market_id": m.id,
            "market_name": m.market_name,
            "address": m.address,
            "city": m.city,
            "distance_km": dist_km,
            "price_per_kg": price_per_kg,
            "gross_revenue": gross_rev,
            "distribution_cost": dist_cost,
            "market_fee": market_fee,
            "estimated_net_value": net_value,
            "source": source,
            "is_stale": is_stale,
            "age_days": age_days,
            "latitude": m.latitude,
            "longitude": m.longitude
        })

    # Sort descending by estimated net value
    recommendations.sort(key=lambda x: x["estimated_net_value"], reverse=True)

    # Assign ranks and badges
    for rank, rec in enumerate(recommendations, 1):
        rec["rank"] = rank
        rec["badge"] = "Rekomendasi Terbaik" if rank == 1 else ("Alternatif Populer" if rank == 2 else "Pilihan Pasar")

    return {
        "species_id": species_id,
        "weight_kg": weight_kg,
        "transport_rate_per_km": transport_rate_per_km,
        "recommendations": recommendations,
        "disclaimer": "Rekomendasi pasar memperhitungkan biaya distribusi dan harga tercatat. Selalu konfirmasi kesegaran data sebelum mengangkut hasil tangkapan."
    }

# ==================== 9. COASTAL GIS (FR-16) ====================

@app.get("/api/gis/locations")
def get_gis_locations(db: Session = Depends(get_db)):
    locs = db.query(Location).all()
    mkts = db.query(Market).all()
    umkms = db.query(UMKM).all()

    points = []
    # TPI and Ports
    for l in locs:
        points.append({
            "id": f"loc_{l.id}",
            "type": l.type,  # TPI, Pelabuhan
            "name": l.name,
            "region": l.region,
            "latitude": l.latitude,
            "longitude": l.longitude,
            "contact": l.contact_info,
            "color": "#0284c7" if l.type == "TPI" else "#0f766e"
        })

    # Markets
    for m in mkts:
        points.append({
            "id": f"mkt_{m.id}",
            "type": "Pasar Ikan",
            "name": m.market_name,
            "region": m.city,
            "address": m.address,
            "distance_km": m.distance_km,
            "latitude": m.latitude,
            "longitude": m.longitude,
            "color": "#e11d48"
        })

    # UMKM
    for u in umkms:
        points.append({
            "id": f"umkm_{u.id}",
            "type": "UMKM Pesisir",
            "name": u.business_name,
            "owner": u.owner_name,
            "region": u.city,
            "address": u.address,
            "needs": u.raw_material_needs,
            "latitude": u.latitude,
            "longitude": u.longitude,
            "color": "#16a34a"
        })

    return points

# ==================== 10. UMKM MANAGEMENT (FR-17) ====================

@app.get("/api/umkm")
def get_umkm_list(db: Session = Depends(get_db)):
    umkms = db.query(UMKM).all()
    out = []
    for u in umkms:
        out.append({
            "id": u.id,
            "user_id": u.user_id,
            "business_name": u.business_name,
            "owner_name": u.owner_name,
            "description": u.description,
            "category": u.category,
            "city": u.city,
            "address": u.address,
            "contact_phone": u.contact_phone,
            "raw_material_needs": u.raw_material_needs,
            "products": [
                {
                    "id": p.id,
                    "product_name": p.product_name,
                    "category": p.category,
                    "price": p.price,
                    "unit": p.unit,
                    "description": p.description
                } for p in u.products if p.is_active
            ]
        })
    return out

@app.post("/api/umkm/products")
def create_product(req: CreateProductRequest, db: Session = Depends(get_db)):
    p = Product(
        umkm_id=req.umkm_id,
        product_name=req.product_name,
        category=req.category,
        price=req.price,
        unit=req.unit,
        description=req.description
    )
    db.add(p)
    db.commit()
    return {"success": True, "message": "Produk UMKM berhasil ditambahkan."}

@app.delete("/api/umkm/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan.")
    p.is_active = False
    db.commit()
    return {"success": True, "message": "Produk berhasil dihapus."}


# ==================== 11. SAMPLE DATASET IMAGES (1-CLICK TEST) ====================

@app.get("/api/sample-images")
def get_sample_images():
    """Provides sample images from the local Fish_Dataset folders for 1-click test in the UI."""
    classes = [
        "Chanos Chanos",
        "Eleutheronema Tetradactylum",
        "Johnius Trachycephalus",
        "Nibea Albiflora",
        "Oreochromis Mossambicus",
        "Oreochromis Niloticus",
        "Rastrelliger Faughni",
        "Upeneus Moluccensis"
    ]
    samples = []
    for c in classes:
        c_dir = (BASE_DIR / "dataset" / c) if (BASE_DIR / "dataset" / c).exists() else (BASE_DIR / c)
        if c_dir.exists():
            files = [f for f in os.listdir(c_dir) if f.lower().endswith(('.tif', '.tiff', '.png', '.jpg'))]
            if files:
                samples.append({
                    "species": c,
                    "filename": files[0],
                    "sample_url": f"/api/dataset-sample-file/{c}/{files[0]}"
                })
    return samples

@app.get("/api/dataset-sample-file/{species}/{filename}")
def stream_sample_image(species: str, filename: str):
    file_path = (BASE_DIR / "dataset" / species / filename) if (BASE_DIR / "dataset" / species / filename).exists() else (BASE_DIR / species / filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    
    # If TIFF, convert on-the-fly to JPEG stream for web browser display
    if filename.lower().endswith(('.tif', '.tiff')):
        with Image.open(file_path) as im:
            buf = io.BytesIO()
            im.convert("RGB").save(buf, "JPEG")
            buf.seek(0)
            from fastapi.responses import Response
            return Response(content=buf.getvalue(), media_type="image/jpeg")

    return FileResponse(file_path)

if FRONTEND_DIST.exists():
    @app.get("/{full_path:path}")
    def serve_frontend_catchall(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
