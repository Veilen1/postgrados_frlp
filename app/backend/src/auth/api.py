from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterAspirantRequest,
    TokenResponse,
    UserResponse,
)
from src.auth.security import create_access_token
from src.auth.service import (
    authenticate_user,
    create_refresh_session,
    register_aspirant,
    rotate_refresh_session,
)
from src.shared.auth.dependencies import get_current_user
from src.shared.config import get_settings
from src.shared.database import get_db
from src.shared.models import User

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def _token_response(user: User, refresh_token: str) -> TokenResponse:
    settings = get_settings()
    return TokenResponse(
        access_token=create_access_token(user, settings),
        refresh_token=refresh_token,
        expires_in=settings.jwt_expiration,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/registro-aspirante",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_aspirant_endpoint(
    payload: RegisterAspirantRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    user = await register_aspirant(
        db,
        email=str(payload.email),
        password=payload.password.get_secret_value(),
        nombre=payload.nombre,
        apellido=payload.apellido,
    )
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    user = await authenticate_user(
        db,
        email=str(payload.email),
        password=payload.password.get_secret_value(),
    )
    refresh_token = await create_refresh_session(db, user)
    return _token_response(user, refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    user, refresh_token = await rotate_refresh_session(
        db,
        payload.refresh_token.get_secret_value(),
    )
    return _token_response(user, refresh_token)


@router.get("/me", response_model=UserResponse)
async def current_profile(
    user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    return UserResponse.model_validate(user)
