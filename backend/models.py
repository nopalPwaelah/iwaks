from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Nelayan", nullable=False)  # Nelayan, UMKM, Admin, Pengelola Pasar, Stakeholder
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    catches = relationship("Catch", back_populates="user", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="user", cascade="all, delete-orphan")
    umkm = relationship("UMKM", back_populates="user", uselist=False)

class FishSpecies(Base):
    __tablename__ = "fish_species"

    id = Column(Integer, primary_key=True, index=True)
    scientific_name = Column(String(150), unique=True, nullable=False)
    common_name = Column(String(150), nullable=False)
    english_name = Column(String(150), nullable=True)
    category = Column(String(100), nullable=False)
    avg_price_idr = Column(Float, default=30000.0)
    avg_length_cm = Column(Float, default=25.0)
    is_active = Column(Boolean, default=True)

    prices = relationship("FishPrice", back_populates="species")
    detection_items = relationship("DetectionItem", back_populates="species")
    catch_details = relationship("CatchDetail", back_populates="species")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)  # TPI, Pelabuhan, Pasar, UMKM
    region = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_info = Column(String(150), nullable=True)

class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    market_name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    distance_km = Column(Float, default=15.0)
    is_active = Column(Boolean, default=True)

    prices = relationship("FishPrice", back_populates="market")

class FishPrice(Base):
    __tablename__ = "fish_prices"

    id = Column(Integer, primary_key=True, index=True)
    species_id = Column(Integer, ForeignKey("fish_species.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    price_per_kg = Column(Float, nullable=False)
    currency = Column(String(10), default="IDR")
    source_name = Column(String(120), nullable=False)
    observed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String(100), default="Sistem")

    species = relationship("FishSpecies", back_populates="prices")
    market = relationship("Market", back_populates="prices")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    image_path = Column(String(255), nullable=False)
    model_version = Column(String(50), default="fish-yolo-v1")
    image_width = Column(Integer, nullable=False)
    image_height = Column(Integer, nullable=False)
    confidence_threshold = Column(Float, default=0.40)
    total_count = Column(Integer, default=0)
    inference_ms = Column(Integer, default=0)
    status = Column(String(50), default="pending_review")  # pending_review, confirmed, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="detections")
    items = relationship("DetectionItem", back_populates="detection", cascade="all, delete-orphan")

class DetectionItem(Base):
    __tablename__ = "detection_items"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("fish_species.id"), nullable=True)
    class_label = Column(String(120), nullable=False)
    confidence = Column(Float, nullable=False)
    x1 = Column(Integer, nullable=False)
    y1 = Column(Integer, nullable=False)
    x2 = Column(Integer, nullable=False)
    y2 = Column(Integer, nullable=False)
    estimated_length_cm = Column(Float, nullable=True)
    is_confirmed = Column(Boolean, default=True)

    detection = relationship("Detection", back_populates="items")
    species = relationship("FishSpecies", back_populates="detection_items")

class Catch(Base):
    __tablename__ = "catches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    location_name = Column(String(150), default="TPI Muara Angke")
    target_market_id = Column(Integer, ForeignKey("markets.id"), nullable=True)
    trade_status = Column(String(50), default="none")  # none, submitted, partially_accepted, accepted, rejected
    fisherman_name = Column(String(120), nullable=True)
    market_notes = Column(Text, nullable=True)
    catch_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    detection_id = Column(Integer, ForeignKey("detections.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="catches")
    target_market = relationship("Market")
    details = relationship("CatchDetail", back_populates="catch", cascade="all, delete-orphan")
    operating_costs = relationship("OperatingCost", back_populates="catch", cascade="all, delete-orphan")

class CatchDetail(Base):
    __tablename__ = "catch_details"

    id = Column(Integer, primary_key=True, index=True)
    catch_id = Column(Integer, ForeignKey("catches.id"), nullable=False)
    species_id = Column(Integer, ForeignKey("fish_species.id"), nullable=False)
    quantity = Column(Integer, default=1)
    weight_kg = Column(Float, nullable=False)
    status = Column(String(50), default="pending")  # pending, accepted, rejected
    offered_price_per_kg = Column(Float, nullable=True)
    market_response_note = Column(String(255), nullable=True)

    catch = relationship("Catch", back_populates="details")
    species = relationship("FishSpecies", back_populates="catch_details")

class OperatingCost(Base):
    __tablename__ = "operating_costs"

    id = Column(Integer, primary_key=True, index=True)
    catch_id = Column(Integer, ForeignKey("catches.id"), nullable=False)
    cost_type = Column(String(100), nullable=False)  # BBM, Es, Tenaga Kerja, Logistik, Lain-lain
    amount = Column(Float, nullable=False)
    notes = Column(String(255), nullable=True)

    catch = relationship("Catch", back_populates="operating_costs")

class UMKM(Base):
    __tablename__ = "umkm"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    business_name = Column(String(150), nullable=False)
    owner_name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Pengolahan Hasil Laut")
    city = Column(String(100), default="Jakarta Utara")
    address = Column(String(255), nullable=False)
    latitude = Column(Float, default=-6.115)
    longitude = Column(Float, default=106.772)
    contact_phone = Column(String(50), nullable=True)
    raw_material_needs = Column(Text, nullable=True)  # Kebutuhan bahan baku pasokan ikan dari nelayan

    user = relationship("User", back_populates="umkm")
    products = relationship("Product", back_populates="umkm", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    umkm_id = Column(Integer, ForeignKey("umkm.id"), nullable=False)
    product_name = Column(String(150), nullable=False)
    category = Column(String(100), default="Olahan Ikan")
    price = Column(Float, nullable=False)
    unit = Column(String(50), default="Kemasan 250gr")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    umkm = relationship("UMKM", back_populates="products")
