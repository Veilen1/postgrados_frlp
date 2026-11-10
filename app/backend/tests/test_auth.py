from typing import Any
from uuid import UUID

import pytest
from httpx import AsyncClient
from pydantic import SecretStr, ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.auth.security import (
    decode_access_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from src.shared.auth.dependencies import require_roles
from src.shared.auth.errors import AuthenticationError
from src.shared.config import Settings
from src.shared.models import RefreshSession, User

PASSWORD = "Correct-Horse-Battery-42"


async def register_user(
    client: AsyncClient,
    email: str = "valentin@example.com",
) -> dict[str, Any]:
    response = await client.post(
        "/api/v1/auth/registro-aspirante",
        json={
            "email": email,
            "password": PASSWORD,
            "nombre": "Valentin",
            "apellido": "Garcia",
        },
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_register_creates_aspirant_without_exposing_password_hash(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    response = await client.post(
        "/api/v1/auth/registro-aspirante",
        json={
            "email": "VALENTIN@example.com",
            "password": PASSWORD,
            "nombre": "Valentin",
            "apellido": "Garcia",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == "valentin@example.com"
    assert response.json()["rol"] == "ASPIRANTE"
    assert "password_hash" not in response.json()

    async with test_session_factory() as session:
        user = await session.scalar(select(User).where(User.email == "valentin@example.com"))
        assert user is not None
        assert user.rol == "ASPIRANTE"
        assert user.password_hash != PASSWORD
        assert verify_password(PASSWORD, user.password_hash)


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email_case_insensitively(
    client: AsyncClient,
) -> None:
    await register_user(client)

    response = await client.post(
        "/api/v1/auth/registro-aspirante",
        json={
            "email": "VALENTIN@example.com",
            "password": PASSWORD,
            "nombre": "Valentin",
            "apellido": "Garcia",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "VALIDATION_ERROR"
    assert "password" not in response.text.lower()


@pytest.mark.asyncio
async def test_register_rejects_short_password(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/registro-aspirante",
        json={
            "email": "valentin@example.com",
            "password": "short",
            "nombre": "Valentin",
            "apellido": "Garcia",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_rejects_password_over_bcrypt_byte_limit(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/auth/registro-aspirante",
        json={
            "email": "valentin@example.com",
            "password": "contraseña-é" * 6,
            "nombre": "Valentin",
            "apellido": "Garcia",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_returns_jwt_and_refresh_token(client: AsyncClient) -> None:
    user = await register_user(client)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "VALENTIN@example.com", "password": PASSWORD},
    )

    assert response.status_code == 200
    body = response.json()
    claims = decode_access_token(body["access_token"])
    assert claims["sub"] == user["id"]
    assert claims["rol"] == "ASPIRANTE"
    assert claims["iss"] == "utn-frlp-posgrado-auth"
    assert body["refresh_token"]
    assert body["expires_in"] == 28800


@pytest.mark.asyncio
async def test_login_rejects_invalid_credentials_without_disclosing_account(
    client: AsyncClient,
) -> None:
    await register_user(client)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "valentin@example.com", "password": "Wrong-password-123"},
    )

    assert response.status_code == 401
    assert response.json()["error"] == "UNAUTHORIZED"
    assert response.json()["message"] == "Credenciales de autenticación no válidas"
    assert "valentin@example.com" not in response.text


@pytest.mark.asyncio
async def test_login_rejects_unknown_email(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@example.com", "password": PASSWORD},
    )

    assert response.status_code == 401
    assert response.json()["message"] == "Credenciales de autenticación no válidas"


@pytest.mark.asyncio
async def test_me_requires_bearer_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["error"] == "UNAUTHORIZED"
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.asyncio
async def test_me_returns_current_active_user(client: AsyncClient) -> None:
    user = await register_user(client)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "valentin@example.com", "password": PASSWORD},
    )

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_response.json()['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == user["id"]
    assert response.json()["rol"] == "ASPIRANTE"


@pytest.mark.asyncio
async def test_me_rejects_invalid_token(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not-a-valid-jwt"},
    )

    assert response.status_code == 401
    assert response.json()["error"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_refresh_rotates_and_persists_only_token_hashes(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await register_user(client)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "valentin@example.com", "password": PASSWORD},
    )
    old_token = login_response.json()["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_token},
    )

    assert response.status_code == 200
    new_token = response.json()["refresh_token"]
    assert new_token != old_token
    assert response.json()["user"]["rol"] == "ASPIRANTE"

    replay_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": old_token},
    )
    assert replay_response.status_code == 401

    async with test_session_factory() as session:
        sessions = list((await session.scalars(select(RefreshSession))).all())
        assert len(sessions) == 2
        stored_hashes = {session.token_hash for session in sessions}
        assert hash_refresh_token(old_token) in stored_hashes
        assert hash_refresh_token(new_token) in stored_hashes
        assert old_token not in stored_hashes
        old_session = next(
            session for session in sessions if session.token_hash == hash_refresh_token(old_token)
        )
        assert old_session.revoked_at is not None


@pytest.mark.asyncio
async def test_refresh_rejects_unknown_token(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "unknown-token"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_access_token_is_invalidated_when_user_is_deactivated(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user_data = await register_user(client)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "valentin@example.com", "password": PASSWORD},
    )

    async with test_session_factory() as session:
        user = await session.get(User, UUID(user_data["id"]))
        assert user is not None
        user.activo = False
        await session.commit()

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_response.json()['access_token']}"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_password_hashing_rejects_malformed_hash() -> None:
    assert not verify_password(PASSWORD, "not-a-bcrypt-hash")
    assert hash_password(PASSWORD) != PASSWORD


@pytest.mark.asyncio
async def test_role_dependency_forbids_disallowed_role() -> None:
    role_checker = require_roles("ADMIN_POSGRADO")
    user = User(
        email="valentin@example.com",
        password_hash="unused",
        nombre="Valentin",
        apellido="Garcia",
        rol="ASPIRANTE",
    )

    with pytest.raises(AuthenticationError) as error:
        await role_checker(user)

    assert error.value.status_code == 403


def test_settings_rejects_short_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, jwt_secret=SecretStr("short"))


def test_settings_rejects_development_secret_outside_development() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, environment="production")
