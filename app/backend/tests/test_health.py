from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import SQLAlchemyError

from src.main import app
from src.shared.database import get_db


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "postgrado-backend",
        "version": "1.0.0",
        "database": "connected",
    }


@pytest.mark.asyncio
async def test_readiness_checks_database(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json()["database"] == "connected"


@pytest.mark.asyncio
async def test_database_failure_does_not_expose_internal_error() -> None:
    class FailedSession:
        async def execute(self, _query: object) -> None:
            raise SQLAlchemyError("database connection details")

    async def override_get_db() -> AsyncIterator[FailedSession]:
        yield FailedSession()

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as test_client:
            response = await test_client.get("/api/v1/health")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json()["detail"] == {
        "status": "degraded",
        "database": "disconnected",
    }
    assert "database connection details" not in response.text


@pytest.mark.asyncio
async def test_liveness_is_available_without_database(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_openapi_uses_documented_api_path(client: AsyncClient) -> None:
    response = await client.get("/api/openapi.json")

    assert response.status_code == 200
    assert "/api/v1/health" in response.json()["paths"]
    assert "/api/v1/health/ready" in response.json()["paths"]
    assert "/api/v1/health/live" in response.json()["paths"]
    assert "/api/v1/auth/registro-aspirante" in response.json()["paths"]
    assert "/api/v1/auth/login" in response.json()["paths"]
    assert "/api/v1/auth/refresh" in response.json()["paths"]
    assert "/api/v1/auth/me" in response.json()["paths"]
