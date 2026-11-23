FROM python:3.10-slim

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up user for Hugging Face Spaces security standards
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    YOLO_CONFIG_DIR=/tmp/ultralytics

WORKDIR $HOME/app

# Install lightweight PyTorch CPU first (saves ~2.5GB container size)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install python packages
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and prebuilt frontend
COPY --chown=user:user . .

# Expose default port (Render will override via $PORT)
EXPOSE 8000

# Run platform startup runner (handles DB check, seeds, and binds to $PORT)
CMD ["python", "run_platform.py"]
