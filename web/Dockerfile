# ULTRATHINK Web Demo Server Dockerfile
# Simple Python HTTP server for demo/presentation

FROM python:3.10-slim

# Create non-root user
RUN useradd -m -u 1000 webserver && \
    mkdir -p /app && \
    chown -R webserver:webserver /app

# Set working directory
WORKDIR /app

# Copy web files
COPY --chown=webserver:webserver . .

# Switch to non-root user
USER webserver

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3000')" || exit 1

# Run the Python HTTP server
CMD ["python3", "-m", "http.server", "3000"]
