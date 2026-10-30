from uuid import UUID, uuid4

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.cohortes.models import Cohorte
from src.cohortes.schemas import CohorteCreate, CohorteIdentificadorUpdate
from src.legajos.models import Legajo
from src.shared.auth.errors import AuthenticationError


async def _validate_career_code(
    db: AsyncSession,
    *,
    carrera: str,
    codigo_carrera: str,
) -> None:
    career_code = await db.scalar(
        select(Cohorte.codigo_carrera)
        .where(
            func.lower(Cohorte.carrera) == carrera.lower(),
            Cohorte.codigo_carrera.is_not(None),
        )
        .limit(1)
    )
    if career_code is not None and career_code != codigo_carrera:
        raise AuthenticationError(
            "La carrera ya tiene asignado otro código; conservá el mismo código entre cohortes",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    existing_career = await db.scalar(
        select(Cohorte.carrera).where(Cohorte.codigo_carrera == codigo_carrera).limit(1)
    )
    if existing_career is not None and existing_career.lower() != carrera.lower():
        raise AuthenticationError(
            "Ese código ya está asociado a otra carrera",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


async def list_cohortes(db: AsyncSession, *, only_open: bool) -> list[Cohorte]:
    query = select(Cohorte)
    if only_open:
        query = query.where(Cohorte.abierta.is_(True))
    query = query.order_by(Cohorte.anio.desc(), Cohorte.nombre)
    return list((await db.scalars(query)).all())


async def create_cohorte(db: AsyncSession, payload: CohorteCreate) -> Cohorte:
    await _validate_career_code(
        db,
        carrera=payload.carrera,
        codigo_carrera=payload.codigo_carrera,
    )
    existing = await db.scalar(select(Cohorte.id).where(Cohorte.nombre == payload.nombre))
    if existing is not None:
        raise AuthenticationError(
            "Ya existe una cohorte con ese nombre",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    existing_identifier = await db.scalar(
        select(Cohorte.id).where(
            Cohorte.anio == payload.anio,
            Cohorte.codigo_carrera == payload.codigo_carrera,
            Cohorte.numero_cohorte == payload.numero_cohorte,
        )
    )
    if existing_identifier is not None:
        raise AuthenticationError(
            "Ya existe una cohorte con ese código, número y año",
            status_code=status.HTTP_409_CONFLICT,
        )

    cohort = Cohorte(
        id=uuid4(),
        anio=payload.anio,
        nombre=payload.nombre,
        carrera=payload.carrera,
        codigo_carrera=payload.codigo_carrera,
        numero_cohorte=payload.numero_cohorte,
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
        existing_identifier = await db.scalar(
            select(Cohorte.id).where(
                Cohorte.anio == payload.anio,
                Cohorte.codigo_carrera == payload.codigo_carrera,
                Cohorte.numero_cohorte == payload.numero_cohorte,
            )
        )
        if existing_identifier is not None:
            raise AuthenticationError(
                "Ya existe una cohorte con ese código, número y año",
                status_code=status.HTTP_409_CONFLICT,
            ) from None
        raise

    await db.refresh(cohort)
    return cohort


async def update_cohorte_identificador(
    db: AsyncSession,
    cohort_id: UUID,
    payload: CohorteIdentificadorUpdate,
) -> Cohorte:
    cohort = await db.scalar(
        select(Cohorte)
        .where(Cohorte.id == cohort_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if cohort is None:
        raise AuthenticationError(
            "No se encontró la cohorte",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    await _validate_career_code(
        db,
        carrera=cohort.carrera,
        codigo_carrera=payload.codigo_carrera,
    )

    existing_number = await db.scalar(
        select(Legajo.id)
        .where(
            Legajo.cohorte_id == cohort_id,
            Legajo.numero_legajo.like(f"{cohort.anio % 100:02d}-____-__-___"),
        )
        .limit(1)
    )
    identifier_changed = (
        cohort.codigo_carrera != payload.codigo_carrera
        or cohort.numero_cohorte != payload.numero_cohorte
    )
    if existing_number is not None and identifier_changed:
        raise AuthenticationError(
            "No se puede cambiar el identificador después de emitir números descriptivos",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    collision = await db.scalar(
        select(Cohorte.id).where(
            Cohorte.id != cohort_id,
            Cohorte.anio == cohort.anio,
            Cohorte.codigo_carrera == payload.codigo_carrera,
            Cohorte.numero_cohorte == payload.numero_cohorte,
        )
    )
    if collision is not None:
        raise AuthenticationError(
            "Ya existe una cohorte con ese código, número y año",
            status_code=status.HTTP_409_CONFLICT,
        )

    cohort.codigo_carrera = payload.codigo_carrera
    cohort.numero_cohorte = payload.numero_cohorte
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise AuthenticationError(
            "Ya existe una cohorte con ese código, número y año",
            status_code=status.HTTP_409_CONFLICT,
        ) from None

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
