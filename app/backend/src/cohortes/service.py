from uuid import UUID, uuid4

from fastapi import status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.cohortes.models import Cohorte
from src.cohortes.schemas import CohorteCreate
from src.shared.auth.errors import AuthenticationError


async def list_cohortes(db: AsyncSession, *, only_open: bool) -> list[Cohorte]:
    query = select(Cohorte)
    if only_open:
        query = query.where(Cohorte.abierta.is_(True))
    query = query.order_by(Cohorte.anio.desc(), Cohorte.nombre)
    return list((await db.scalars(query)).all())


async def create_cohorte(db: AsyncSession, payload: CohorteCreate) -> Cohorte:
    existing = await db.scalar(select(Cohorte.id).where(Cohorte.nombre == payload.nombre))
    if existing is not None:
        raise AuthenticationError(
            "Ya existe una cohorte con ese nombre",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    cohort = Cohorte(
        id=uuid4(),
        anio=payload.anio,
        nombre=payload.nombre,
        carrera=payload.carrera,
        tipo_carrera=payload.tipo_carrera.value,
        abierta=payload.abierta,
        fecha_inicio=payload.fecha_inicio,
    )
    db.add(cohort)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await db.scalar(select(Cohorte.id).where(Cohorte.nombre == payload.nombre))
        if existing is not None:
            raise AuthenticationError(
                "Ya existe una cohorte con ese nombre",
                status_code=status.HTTP_400_BAD_REQUEST,
            ) from None
        raise

    await db.refresh(cohort)
    return cohort


async def update_cohorte_state(
    db: AsyncSession,
    cohort_id: UUID,
    *,
    abierta: bool,
) -> Cohorte:
    cohort = await db.get(Cohorte, cohort_id)
    if cohort is None:
        raise AuthenticationError(
            "No se encontró la cohorte",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    cohort.abierta = abierta
    await db.commit()
    await db.refresh(cohort)
    return cohort
