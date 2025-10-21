# Backend Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (including OpenCV requirements)
RUN apt-get update && apt-get install -y \
    gcc \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsndfile1 \
    ffmpeg \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy project files first (for better caching)
COPY pyproject.toml ./
COPY requirements.txt* ./

# Install Python dependencies (try requirements.txt first, fallback to pyproject.toml)
RUN if [ -f requirements.txt ]; then \
      pip install --no-cache-dir -r requirements.txt; \
    else \
      pip install --no-cache-dir -e .; \
    fi

# Copy application code
COPY app ./app

# Create non-root user
RUN useradd -m -u 1000 braincell && chown -R braincell:braincell /app
USER braincell

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run application (Railway injects $PORT env var)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
