from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.cohortes.schemas import (
    CohorteCreate,
    CohorteEstadoUpdate,
    CohorteIdentificadorUpdate,
    CohorteResponse,
)
from src.cohortes.service import (
    create_cohorte,
    list_cohortes,
    update_cohorte_identificador,
    update_cohorte_state,
)
from src.shared.auth.dependencies import get_optional_current_user, require_roles
from src.shared.database import get_db
from src.shared.models import User

router = APIRouter(prefix="/cohortes", tags=["Cohortes"])


@router.get("", response_model=list[CohorteResponse])
async def get_cohortes(
    user: Annotated[User | None, Depends(get_optional_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[CohorteResponse]:
    cohorts = await list_cohortes(db, only_open=user is None)
    return [CohorteResponse.model_validate(cohort) for cohort in cohorts]


@router.post(
    "",
    response_model=CohorteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_cohorte(
    payload: CohorteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN_POSGRADO", "SUPERADMIN"))],
) -> CohorteResponse:
    cohort = await create_cohorte(db, payload)
    return CohorteResponse.model_validate(cohort)


@router.patch("/{cohort_id}/estado", response_model=CohorteResponse)
async def patch_cohorte_state(
    cohort_id: UUID,
    payload: CohorteEstadoUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN_POSGRADO", "SUPERADMIN"))],
) -> CohorteResponse:
    cohort = await update_cohorte_state(db, cohort_id, abierta=payload.abierta)
    return CohorteResponse.model_validate(cohort)


@router.patch("/{cohort_id}/identificador", response_model=CohorteResponse)
async def patch_cohorte_identifier(
    cohort_id: UUID,
    payload: CohorteIdentificadorUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_roles("ADMIN_POSGRADO", "SUPERADMIN"))],
) -> CohorteResponse:
    cohort = await update_cohorte_identificador(db, cohort_id, payload)
    return CohorteResponse.model_validate(cohort)
