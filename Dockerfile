FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Install frontend dependencies first to leverage layer caching.
COPY frontend/package.json ./
RUN npm install

# Build frontend for production.
COPY frontend/ ./
RUN npm run build


FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Python env optimizations
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TESSERACT_CMD=/usr/bin/tesseract

# Install backend dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY . .

# Copy built frontend assets into the location served by FastAPI.
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Run app (Render/Railway compatible)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]