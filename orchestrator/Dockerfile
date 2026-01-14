# ULTRATHINK Backend Orchestrator Dockerfile
# Multi-stage build for optimized image size

FROM python:3.10-slim as builder

# Install system dependencies required for chemistry libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.10-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 ultrathink && \
    mkdir -p /app && \
    chown -R ultrathink:ultrathink /app

# Set working directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/ultrathink/.local

# Make sure scripts in .local are usable
ENV PATH=/home/ultrathink/.local/bin:$PATH

# Copy application code
COPY --chown=ultrathink:ultrathink . .

# Switch to non-root user
USER ultrathink

# Expose port
EXPOSE 7001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7001/health')" || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7001"]
