# =============================================================================
# Dockerfile Multi-Stage Hardened — Backend FastAPI (Python 3.12 + uv)
# Conforme a la especificación de Cátedra (Ticket T7)
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: Builder (python:3.12-slim + uv; resolución ultrarrápida sin gcc)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS builder

# Instalar uv binario oficial de Astral (Cátedra T7)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

WORKDIR /build

# Crear virtualenv con uv
RUN uv venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instalar dependencias precompiladas usando uv
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -r requirements.txt

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: Base Runtime (Hardened minimal layer)
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS runtime-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Copiar virtualenv preinstalado desde el builder
COPY --from=builder /opt/venv /opt/venv

# Creación de usuario sin privilegios (Principio de Menor Privilegio)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -M appuser

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
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 4: Production (Inmutable)
# ─────────────────────────────────────────────────────────────────────────────
FROM runtime-base AS production

COPY --chown=appuser:appgroup ./src /app/src

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]
