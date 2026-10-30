from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.cohortes.models import Cohorte
from src.legajos.models import AuditoriaLegajo, Documento, Legajo
from src.legajos.schemas import (
    LegajoCreate,
    LegajoEstado,
    LegajoEstadoUpdate,
    LegajoUpdate,
)
from src.shared.auth.errors import AuthenticationError
from src.shared.models import User


def _not_found(message: str) -> AuthenticationError:
    return AuthenticationError(message, status_code=status.HTTP_404_NOT_FOUND)


def _conflict(message: str) -> AuthenticationError:
    return AuthenticationError(message, status_code=status.HTTP_409_CONFLICT)


async def _get_open_cohorte(db: AsyncSession, cohorte_id: UUID) -> Cohorte:
    cohorte = await db.get(Cohorte, cohorte_id)
    if cohorte is None:
        raise _not_found("No se encontró la cohorte")
    if not cohorte.abierta:
        raise AuthenticationError(
            "La inscripción a esta cohorte está cerrada",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    return cohorte


async def create_legajo(
    db: AsyncSession,
    payload: LegajoCreate,
    user: User,
) -> Legajo:
    user_id = user.id
    cohorte = await _get_open_cohorte(db, payload.cohorte_id)
    existing = await db.scalar(select(Legajo.id).where(Legajo.usuario_id == user_id))
    if existing is not None:
        raise _conflict("El usuario ya tiene un legajo")

    legajo = Legajo(
        id=uuid4(),
        usuario_id=user_id,
        cohorte_id=payload.cohorte_id,
        dni=payload.dni,
        apellido=user.apellido,
        nombre=user.nombre,
        email=user.email,
        estado=LegajoEstado.BORRADOR.value,
        solicita_beca=payload.solicita_beca,
        tipo_beca=payload.tipo_beca,
        cohorte=cohorte,
    )
    db.add(legajo)
    db.add(
        AuditoriaLegajo(
            id=uuid4(),
            legajo_id=legajo.id,
            estado_anterior=None,
            estado_nuevo=LegajoEstado.BORRADOR.value,
            comentario="Creación del legajo",
            usuario_id=user_id,
        )
    )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await db.scalar(select(Legajo.id).where(Legajo.usuario_id == user_id))
        if existing is not None:
            raise _conflict("El usuario ya tiene un legajo") from None
        existing = await db.scalar(
            select(Legajo.id).where(
                Legajo.cohorte_id == payload.cohorte_id,
                Legajo.dni == payload.dni,
            )
        )
        if existing is not None:
            raise _conflict("Ya existe un legajo con ese DNI en la cohorte") from None
        raise

    await db.refresh(legajo)
    await db.refresh(legajo, attribute_names=["cohorte"])
    return legajo


async def list_legajos(
    db: AsyncSession,
    *,
    page: int,
    page_size: int,
    cohorte_id: UUID | None,
    estado: LegajoEstado | None,
) -> tuple[list[Legajo], int]:
    filters = []
    if cohorte_id is not None:
        filters.append(Legajo.cohorte_id == cohorte_id)
    if estado is not None:
        filters.append(Legajo.estado == estado.value)

    total = await db.scalar(select(func.count(Legajo.id)).where(*filters))
    query = (
        select(Legajo)
        .options(selectinload(Legajo.cohorte))
        .where(*filters)
        .order_by(Legajo.created_at.desc(), Legajo.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list((await db.scalars(query)).all()), total or 0


async def get_legajo(db: AsyncSession, legajo_id: UUID) -> Legajo:
    legajo = await db.scalar(
        select(Legajo).options(selectinload(Legajo.cohorte)).where(Legajo.id == legajo_id)
    )
    if legajo is None:
        raise _not_found("No se encontró el legajo")
    return legajo


async def get_my_legajo(db: AsyncSession, user_id: UUID) -> Legajo:
    legajo = await db.scalar(
        select(Legajo).options(selectinload(Legajo.cohorte)).where(Legajo.usuario_id == user_id)
    )
    if legajo is None:
        raise _not_found("El usuario todavía no tiene un legajo")
    return legajo


def _assert_owner(legajo: Legajo, user: User) -> None:
    if legajo.usuario_id != user.id:
        raise AuthenticationError(
            "No tiene permisos para acceder a este legajo",
            status_code=status.HTTP_403_FORBIDDEN,
        )


async def update_legajo(
    db: AsyncSession,
    legajo_id: UUID,
    payload: LegajoUpdate,
    user: User,
) -> Legajo:
    legajo = await get_legajo(db, legajo_id)
    _assert_owner(legajo, user)
    if legajo.estado not in {LegajoEstado.BORRADOR.value, LegajoEstado.OBSERVADO.value}:
        raise AuthenticationError(
            "Solo se pueden editar legajos en estado BORRADOR u OBSERVADO",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    changes = payload.model_dump(exclude_unset=True)
    cohorte_id = changes.get("cohorte_id")
    if cohorte_id is not None:
        legajo.cohorte = await _get_open_cohorte(db, cohorte_id)
    updated_cohorte_id = cohorte_id or legajo.cohorte_id
    updated_dni = changes.get("dni", legajo.dni)
    for field, value in changes.items():
        setattr(legajo, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await db.scalar(
            select(Legajo.id).where(
                Legajo.cohorte_id == updated_cohorte_id,
                Legajo.dni == updated_dni,
                Legajo.id != legajo_id,
            )
        )
        if existing is not None:
            raise _conflict("Ya existe un legajo con ese DNI en la cohorte") from None
        raise

    await db.refresh(legajo)
    return legajo


async def send_legajo(db: AsyncSession, legajo: Legajo, user: User) -> Legajo:
    _assert_owner(legajo, user)
    if legajo.estado not in {LegajoEstado.BORRADOR.value, LegajoEstado.OBSERVADO.value}:
        raise AuthenticationError(
            "Solo se pueden enviar legajos en estado BORRADOR u OBSERVADO",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    uploaded_types = set(
        (
            await db.scalars(
                select(Documento.tipo).where(
                    Documento.legajo_id == legajo.id,
                    Documento.tipo.in_(("DNI", "TITULO_GRADO")),
                )
            )
        ).all()
    )
    missing_types = {"DNI", "TITULO_GRADO"} - uploaded_types
    if missing_types:
        missing = ", ".join(sorted(missing_types))
        raise AuthenticationError(
            f"Faltan documentos obligatorios para enviar el legajo: {missing}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    previous_state = legajo.estado
    legajo.estado = LegajoEstado.ENVIADO.value
    legajo.fecha_inscripcion = datetime.now(UTC)
    legajo.motivo_observacion = None
    db.add(
        AuditoriaLegajo(
            id=uuid4(),
            legajo_id=legajo.id,
            estado_anterior=previous_state,
            estado_nuevo=LegajoEstado.ENVIADO.value,
            comentario="Envío de la preinscripción",
            usuario_id=user.id,
        )
    )
    await db.commit()
    await db.refresh(legajo)
    return legajo


async def update_legajo_state(
    db: AsyncSession,
    legajo: Legajo,
    payload: LegajoEstadoUpdate,
    user: User,
) -> Legajo:
    locked_legajo = await db.scalar(
        select(Legajo)
        .where(Legajo.id == legajo.id)
        .options(selectinload(Legajo.cohorte))
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if locked_legajo is None:
        raise _not_found("No se encontró el legajo")
    legajo = locked_legajo

    target_state = payload.estado.value
    allowed_transitions = {
        LegajoEstado.ENVIADO.value: {LegajoEstado.EN_REVISION.value},
        LegajoEstado.EN_REVISION.value: {
            LegajoEstado.OBSERVADO.value,
            LegajoEstado.APROBADO.value,
            LegajoEstado.RECHAZADO.value,
        },
    }
    if target_state not in allowed_transitions.get(legajo.estado, set()):
        raise AuthenticationError(
            f"No se permite la transición de {legajo.estado} a {target_state}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if target_state == LegajoEstado.APROBADO.value:
        cohort = await db.scalar(
            select(Cohorte)
            .where(Cohorte.id == legajo.cohorte_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if cohort is None:
            raise _not_found("No se encontró la cohorte del legajo")
        if cohort.codigo_carrera is None or cohort.numero_cohorte is None:
            raise AuthenticationError(
                "La cohorte necesita código de carrera y número de cohorte "
                "antes de aprobar legajos",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if cohort.ultimo_numero_legajo >= 999:
            raise AuthenticationError(
                "La cohorte agotó los 999 números de legajo disponibles",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        next_number = cohort.ultimo_numero_legajo + 1
        legajo_number = (
            f"{cohort.anio % 100:02d}-{cohort.codigo_carrera}-"
            f"{cohort.numero_cohorte:02d}-{next_number:03d}"
        )
        duplicate_number = await db.scalar(
            select(Legajo.id).where(Legajo.numero_legajo == legajo_number)
        )
        if duplicate_number is not None:
            raise AuthenticationError(
                "El siguiente número de legajo ya existe; se requiere revisar "
                "el contador de la cohorte",
                status_code=status.HTTP_409_CONFLICT,
            )

        student = await db.scalar(
            select(User)
            .where(User.id == legajo.usuario_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if student is None:
            raise _not_found("No se encontró el usuario asociado al legajo")

        cohort.ultimo_numero_legajo = next_number
        legajo.numero_legajo = legajo_number
        legajo.fecha_aprobacion = datetime.now(UTC)
        student.rol = "ALUMNO"

    comment = payload.motivo_observacion
    if target_state in {LegajoEstado.OBSERVADO.value, LegajoEstado.RECHAZADO.value}:
        if not comment:
            raise AuthenticationError(
                "Debe indicar un motivo para observar o rechazar el legajo",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        legajo.motivo_observacion = comment

    previous_state = legajo.estado
    legajo.estado = target_state
    db.add(
        AuditoriaLegajo(
            id=uuid4(),
            legajo_id=legajo.id,
            estado_anterior=previous_state,
            estado_nuevo=target_state,
            comentario=comment,
            usuario_id=user.id,
        )
    )
    await db.commit()
    await db.refresh(legajo)
    return legajo
