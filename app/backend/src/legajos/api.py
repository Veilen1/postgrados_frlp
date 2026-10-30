from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.legajos.schemas import (
    LegajoCreate,
    LegajoEstado,
    LegajoEstadoUpdate,
    LegajoPage,
    LegajoResponse,
    LegajoUpdate,
)
from src.legajos.service import (
    create_legajo,
    get_legajo,
    get_my_legajo,
    list_legajos,
    send_legajo,
    update_legajo,
    update_legajo_state,
)
from src.shared.auth.dependencies import require_roles
from src.shared.auth.errors import AuthenticationError
from src.shared.database import get_db
from src.shared.models import User

router = APIRouter(prefix="/legajos", tags=["Legajos"])


@router.post(
    "",
    response_model=LegajoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_legajo(
    payload: LegajoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("ASPIRANTE"))],
) -> LegajoResponse:
    legajo = await create_legajo(db, payload, user)
    return LegajoResponse.model_validate(legajo)


@router.get("", response_model=LegajoPage)
async def get_legajos(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN_POSGRADO", "SUPERADMIN"))],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    cohorte_id: UUID | None = None,
    estado: LegajoEstado | None = None,
) -> LegajoPage:
    items, total = await list_legajos(
        db,
        page=page,
        page_size=page_size,
        cohorte_id=cohorte_id,
        estado=estado,
    )
    return LegajoPage(
        items=[LegajoResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/mi-legajo", response_model=LegajoResponse)
async def get_own_legajo(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("ASPIRANTE", "ALUMNO"))],
) -> LegajoResponse:
    legajo = await get_my_legajo(db, user.id)
    return LegajoResponse.model_validate(legajo)


@router.get("/{legajo_id}", response_model=LegajoResponse)
async def get_legajo_by_id(
    legajo_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[
        User,
        Depends(require_roles("ASPIRANTE", "ALUMNO", "ADMIN_POSGRADO", "SUPERADMIN")),
    ],
) -> LegajoResponse:
    legajo = await get_legajo(db, legajo_id)
    if user.rol in {"ASPIRANTE", "ALUMNO"} and legajo.usuario_id != user.id:
        raise AuthenticationError(
            "No tiene permisos para acceder a este legajo",
            status_code=status.HTTP_403_FORBIDDEN,
        )
    return LegajoResponse.model_validate(legajo)


@router.put("/{legajo_id}", response_model=LegajoResponse)
async def put_legajo(
    legajo_id: UUID,
    payload: LegajoUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("ASPIRANTE"))],
) -> LegajoResponse:
    legajo = await update_legajo(db, legajo_id, payload, user)
    return LegajoResponse.model_validate(legajo)


@router.post("/{legajo_id}/enviar", response_model=LegajoResponse)
async def post_send_legajo(
    legajo_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("ASPIRANTE"))],
) -> LegajoResponse:
    legajo = await get_legajo(db, legajo_id)
    legajo = await send_legajo(db, legajo, user)
    return LegajoResponse.model_validate(legajo)


@router.patch("/{legajo_id}/estado", response_model=LegajoResponse)
async def patch_legajo_state(
    legajo_id: UUID,
    payload: LegajoEstadoUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("ADMIN_POSGRADO", "SUPERADMIN"))],
) -> LegajoResponse:
    legajo = await get_legajo(db, legajo_id)
    legajo = await update_legajo_state(db, legajo, payload, user)
    return LegajoResponse.model_validate(legajo)
