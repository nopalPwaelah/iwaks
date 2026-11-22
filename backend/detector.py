"""
BlueEconomy AI - Backend Detector Re-Export Module
Memastikan ketersediaan modul deteksi seragam di backend dan ai_service.
"""

from ai_service.detector import (
    FishDetector,
    SPECIES_MAP,
    detector
)

__all__ = ["FishDetector", "SPECIES_MAP", "detector"]

