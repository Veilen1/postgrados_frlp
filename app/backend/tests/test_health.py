"""
Pruebas del Endpoint de Monitoreo y Salud del Backend
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """
    Verifica que el endpoint /api/v1/health:
    1. Retorne código HTTP 200 OK.
    2. Valide el estado 'healthy' del servicio.
    3. Confirme conectividad activa con PostgreSQL ('database': 'connected').
    """
    response = await client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "postgrado-backend"
    assert data["version"] == "1.0.0"
    assert data["database"] == "connected"

