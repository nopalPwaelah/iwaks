import os
from pathlib import Path

# Ensure Ultralytics config is sandboxed
BASE_DIR = Path(__file__).resolve().parent
CONFIG_DIR = BASE_DIR / "yolo_config"
(CONFIG_DIR / "Ultralytics").mkdir(parents=True, exist_ok=True)
os.environ["YOLO_CONFIG_DIR"] = str(CONFIG_DIR)

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from detector import detector, SPECIES_MAP

app = FastAPI(
    title="BlueEconomy AI - YOLO Fish Detection Microservice",
    description="Layanan AI inferensi objek ikan, klasifikasi spesies, penghitungan objek, dan estimasi ukuran",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BlueEconomy AI Service",
        "model_version": detector.model_version,
        "device": detector.device,
        "classes_count": len(SPECIES_MAP)
    }

@app.get("/model/info")
def model_info():
    return {
        "model_name": "BlueEconomy YOLO Fish Detection & Counter",
        "version": detector.model_version,
        "device": detector.device,
        "input_formats": ["JPEG", "PNG", "TIFF", "WEBP"],
        "default_confidence_threshold": 0.40,
        "classes": [
            {"id": k, **v} for k, v in SPECIES_MAP.items()
        ]
    }

@app.post("/predict")
async def predict_fish(
    file: UploadFile = File(...),
    confidence_threshold: float = Query(0.40, ge=0.1, le=1.0)
):
    valid_exts = [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]
    filename = file.filename or "upload.jpg"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in valid_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Format file '{ext}' tidak didukung. Format yang diizinkan: {', '.join(valid_exts)}"
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="File kosong.")

        result = detector.detect(content, conf_thresh=confidence_threshold)
        return JSONResponse(status_code=200, content=result)
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "Gagal memproses inferensi AI pada gambar."
            }
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
