from datetime import UTC, datetime, timedelta

from fastapi import status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.security import (
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from src.shared.auth.errors import AuthenticationError
from src.shared.config import get_settings
from src.shared.models import RefreshSession, User


async def register_aspirant(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    nombre: str,
    apellido: str,
) -> User:
    existing_user = await db.scalar(select(User.id).where(User.email == email))
    if existing_user is not None:
        raise AuthenticationError(
            "Ya existe una cuenta con ese email",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    user = User(
        email=email,
        password_hash=hash_password(password),
        nombre=nombre,
        apellido=apellido,
        rol="ASPIRANTE",
    )
    db.add(user)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing_user = await db.scalar(select(User.id).where(User.email == email))
        if existing_user is not None:
            raise AuthenticationError(
                "Ya existe una cuenta con ese email",
                status_code=status.HTTP_400_BAD_REQUEST,
            ) from None
        raise

    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession,
    *,
    email: str,
    password: str,
) -> User:
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(password, user.password_hash) or not user.activo:
        raise AuthenticationError()
    return user


async def create_refresh_session(db: AsyncSession, user: User) -> str:
    settings = get_settings()
    refresh_token = create_refresh_token()
    session = RefreshSession(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(UTC) + timedelta(seconds=settings.jwt_refresh_expiration),
    )
    db.add(session)
    await db.commit()
    return refresh_token


async def rotate_refresh_session(db: AsyncSession, token: str) -> tuple[User, str]:
    token_hash = hash_refresh_token(token)
    session = await db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == token_hash).with_for_update()
    )
    now = datetime.now(UTC)
    if session is None or session.revoked_at is not None:
        raise AuthenticationError()

    expiration = session.expires_at
    if expiration.tzinfo is None:
        expiration = expiration.replace(tzinfo=UTC)
    if expiration <= now:
        raise AuthenticationError()

    user = await db.scalar(select(User).where(User.id == session.user_id))
    if user is None or not user.activo:
        session.revoked_at = now
        await db.commit()
        raise AuthenticationError()

    session.revoked_at = now
    next_token = create_refresh_token()
    settings = get_settings()
    db.add(
        RefreshSession(
            user_id=user.id,
            token_hash=hash_refresh_token(next_token),
            expires_at=now + timedelta(seconds=settings.jwt_refresh_expiration),
        )
    )
    await db.commit()
    return user, next_token
