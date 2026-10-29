# =============================================================================
# Dockerfile Multi-Stage Hardened — Backend FastAPI (Python 3.12)
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: Builder (Compilación de dependencias en virtualenv aislado)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS builder

# Variables para optimizar instalación de Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Instalar dependencias de compilación para paquetes nativos (C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear y activar Virtualenv
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: Base Runtime (Hardened minimal OS layer)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS runtime-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Instalar estrictamente las dependencias de ejecución dinámicas (sin compiladores)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar virtualenv precompilado
COPY --from=builder /opt/venv /opt/venv

# Creación de usuario sin privilegios (Principio de Menor Privilegio)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -M appuser

# Configuración de directorios de trabajo y almacenamiento seguro
WORKDIR /app
RUN mkdir -p /var/postgrado-storage/uploads && \
    chown -R appuser:appgroup /app /var/postgrado-storage

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 3: Development (Target para docker-compose con live-reload)
# ─────────────────────────────────────────────────────────────────────────────
FROM runtime-base AS development

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 4: Production (Contenedor inmutable y hardened)
# ─────────────────────────────────────────────────────────────────────────────
FROM runtime-base AS production

COPY --chown=appuser:appgroup ./src /app/src

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]

