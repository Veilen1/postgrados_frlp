"""
Configuración y fixtures compartidas para pruebas con Pytest
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from src.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def client():
    """Cliente HTTP asíncrono configurado para probar la API sin levantar servidor externo."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
