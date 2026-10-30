from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from typing import Any
from uuid import UUID

import bcrypt
from jose import jwt

from src.shared.config import Settings, get_settings
from src.shared.models import User

JWT_ALGORITHM = "HS256"
BCRYPT_ROUNDS = 12


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(rounds=BCRYPT_ROUNDS),
    )
    return hashed.decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except (UnicodeEncodeError, ValueError):
        return False


def create_access_token(user: User, settings: Settings | None = None) -> str:
    active_settings = settings or get_settings()
    issued_at = datetime.now(UTC)
    claims: dict[str, Any] = {
        "sub": str(user.id),
        "email": user.email,
        "rol": user.rol,
        "nombre": user.nombre,
        "iss": active_settings.jwt_issuer,
        "iat": issued_at,
        "exp": issued_at + timedelta(seconds=active_settings.jwt_expiration),
    }
    return jwt.encode(
        claims,
        active_settings.jwt_secret.get_secret_value(),
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str, settings: Settings | None = None) -> dict[str, Any]:
    active_settings = settings or get_settings()
    return jwt.decode(
        token,
        active_settings.jwt_secret.get_secret_value(),
        algorithms=[JWT_ALGORITHM],
        issuer=active_settings.jwt_issuer,
    )


def parse_token_subject(claims: dict[str, Any]) -> UUID:
    subject = claims.get("sub")
    if not isinstance(subject, str):
        raise ValueError("El claim sub debe ser un UUID")
    return UUID(subject)


def create_refresh_token() -> str:
    return token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()
