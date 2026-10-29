"""
Punto de Entrada — API FastAPI Sistema de Posgrado UTN FRLP
"""
import os
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgrado_user:postgrado_dev_password@db:5432/postgrado_dev"
)
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:3000")

# Asegurar protocolo asyncpg en URL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verificación de conexión
    yield
    # Shutdown: cerrar pool
    await engine.dispose()

app = FastAPI(
    title="Sistema de Posgrado UTN FRLP — API Core",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS Middleware para integración con frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health", status_code=status.HTTP_200_OK, tags=["Sistema"])
async def health_check() -> Dict[str, Any]:
    """
    Endpoint de monitoreo y healthcheck de contenedor.
    Verifica conectividad activa con PostgreSQL.
    """
    db_status = "disconnected"
    try:
        async with async_session_factory() as session:
            result = await session.execute(text("SELECT 1"))
            if result.scalar() == 1:
                db_status = "connected"
    except Exception as exc:
        db_status = f"error: {str(exc)}"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "degraded", "database": db_status}
        )

    return {
        "status": "healthy",
        "service": "postgrado-backend",
        "version": "1.0.0",
        "database": db_status
    }

