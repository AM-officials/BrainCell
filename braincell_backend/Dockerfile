# Production Dockerfile for Railway
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV, audio processing, and ML
# Note: Debian Trixie (Python 3.12) uses 'libgl1' not 'libgl1-mesa-glx'
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libsndfile1 \
    ffmpeg \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY requirements.txt ./

# Upgrade pip and install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Create non-root user for security
RUN useradd -m -u 1000 braincell && \
    chown -R braincell:braincell /app

# Switch to non-root user
USER braincell

# Expose port (Railway will inject $PORT)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/health').read()" || exit 1

# Start command (Railway injects $PORT environment variable)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
