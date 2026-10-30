from collections.abc import Awaitable, Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.security import decode_access_token, parse_token_subject
from src.shared.auth.errors import AuthenticationError
from src.shared.database import get_db
from src.shared.models import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if credentials is None:
        raise AuthenticationError()

    try:
        claims = decode_access_token(credentials.credentials)
        user_id: UUID = parse_token_subject(claims)
    except (JWTError, ValueError):
        raise AuthenticationError() from None

    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.activo:
        raise AuthenticationError()
    return user


def require_roles(*allowed_roles: str) -> Callable[..., Awaitable[User]]:
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.rol not in allowed_roles:
            raise AuthenticationError(
                "Permisos insuficientes",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        return current_user

    return role_checker
