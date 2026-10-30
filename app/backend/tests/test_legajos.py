from datetime import date
from typing import Any
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.auth.security import create_access_token, hash_password
from src.cohortes.models import Cohorte
from src.legajos.models import AuditoriaLegajo, Documento
from src.shared.models import User

PASSWORD = "Correct-Horse-Battery-42"


async def create_user(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    email: str,
    role: str = "ASPIRANTE",
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        nombre="Valentin",
        apellido="Garcia",
        rol=role,
    )
    async with session_factory() as session:
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return user


async def create_cohort(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    open_for_registration: bool = True,
) -> Cohorte:
    cohort = Cohorte(
        id=uuid4(),
        anio=2026,
        nombre=f"Cohorte {uuid4()}",
        carrera="Especialización en Sistemas",
        tipo_carrera="Especializacion",
        abierta=open_for_registration,
        fecha_inicio=date(2026, 3, 1),
    )
    async with session_factory() as session:
        session.add(cohort)
        await session.commit()
        await session.refresh(cohort)
    return cohort


def auth_header(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user)}"}


def valid_payload(cohort_id: UUID, **overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "cohorte_id": str(cohort_id),
        "dni": "30123456",
        "solicita_beca": False,
    }
    payload.update(overrides)
    return payload


async def post_legajo(
    client: AsyncClient,
    user: User,
    cohort: Cohorte,
    **overrides: Any,
) -> dict[str, Any]:
    response = await client.post(
        "/api/v1/legajos",
        json=valid_payload(cohort.id, **overrides),
        headers=auth_header(user),
    )
    assert response.status_code == 201
    return response.json()


async def upload_required_documents(
    session_factory: async_sessionmaker[AsyncSession],
    legajo_id: UUID,
    *types: str,
) -> None:
    async with session_factory() as session:
        session.add_all(
            [
                Documento(
                    id=uuid4(),
                    legajo_id=legajo_id,
                    tipo=document_type,
                    path_storage=f"legajos/{legajo_id}/{document_type.lower()}.pdf",
                    nombre_original=f"{document_type.lower()}.pdf",
                    checksum_sha256="a" * 64,
                    tamanio_bytes=128,
                )
                for document_type in types
            ]
        )
        await session.commit()


@pytest.mark.asyncio
async def test_create_legajo_uses_authenticated_profile_and_open_cohort(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = await create_user(test_session_factory, email="valentin@example.com")
    cohort = await create_cohort(test_session_factory)

    response = await client.post(
        "/api/v1/legajos",
        json=valid_payload(cohort.id, solicita_beca=True, tipo_beca="50%"),
        headers=auth_header(user),
    )

    assert response.status_code == 201
    assert response.json()["usuario_id"] == str(user.id)
    assert response.json()["nombre"] == user.nombre
    assert response.json()["apellido"] == user.apellido
    assert response.json()["email"] == user.email
    assert response.json()["estado"] == "BORRADOR"
    assert response.json()["tipo_beca"] == "50%"

    async with test_session_factory() as session:
        history = list(
            (
                await session.scalars(
                    select(AuditoriaLegajo).where(
                        AuditoriaLegajo.legajo_id == UUID(response.json()["id"])
                    )
                )
            ).all()
        )
    assert len(history) == 1
    assert history[0].estado_anterior is None
    assert history[0].estado_nuevo == "BORRADOR"


@pytest.mark.asyncio
async def test_create_legajo_requires_aspirant_and_rejects_untrusted_fields(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = await create_user(
        test_session_factory,
        email="admin@example.com",
        role="ADMIN_POSGRADO",
    )
    cohort = await create_cohort(test_session_factory)

    forbidden_role = await client.post(
        "/api/v1/legajos",
        json=valid_payload(cohort.id),
        headers=auth_header(user),
    )
    assert forbidden_role.status_code == 403

    aspirant = await create_user(test_session_factory, email="aspirant@example.com")
    forged_owner = await client.post(
        "/api/v1/legajos",
        json=valid_payload(cohort.id, usuario_id=str(user.id)),
        headers=auth_header(aspirant),
    )
    assert forged_owner.status_code == 422


@pytest.mark.asyncio
async def test_create_legajo_requires_open_cohort_and_prevents_duplicates(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = await create_user(test_session_factory, email="valentin@example.com")
    closed_cohort = await create_cohort(
        test_session_factory,
        open_for_registration=False,
    )
    closed_response = await client.post(
        "/api/v1/legajos",
        json=valid_payload(closed_cohort.id),
        headers=auth_header(user),
    )
    assert closed_response.status_code == 400

    open_cohort = await create_cohort(test_session_factory)
    await post_legajo(client, user, open_cohort)
    duplicate = await client.post(
        "/api/v1/legajos",
        json=valid_payload(open_cohort.id, dni="30123457"),
        headers=auth_header(user),
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["error"] == "CONFLICT"


@pytest.mark.asyncio
async def test_create_legajo_rejects_duplicate_dni_in_cohort(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    cohort = await create_cohort(test_session_factory)
    first_user = await create_user(test_session_factory, email="first@example.com")
    second_user = await create_user(test_session_factory, email="second@example.com")

    await post_legajo(client, first_user, cohort)
    response = await client.post(
        "/api/v1/legajos",
        json=valid_payload(cohort.id),
        headers=auth_header(second_user),
    )

    assert response.status_code == 409
    assert "DNI" in response.json()["message"]


@pytest.mark.asyncio
async def test_own_legajo_and_admin_list_are_scoped_and_paginated(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    cohort = await create_cohort(test_session_factory)
    first_user = await create_user(test_session_factory, email="first@example.com")
    second_user = await create_user(test_session_factory, email="second@example.com")
    admin = await create_user(
        test_session_factory,
        email="admin@example.com",
        role="ADMIN_POSGRADO",
    )
    first = await post_legajo(client, first_user, cohort, dni="30123456")
    await post_legajo(client, second_user, cohort, dni="30123457")

    own = await client.get(
        "/api/v1/legajos/mi-legajo",
        headers=auth_header(first_user),
    )
    assert own.status_code == 200
    assert own.json()["id"] == first["id"]

    list_response = await client.get(
        "/api/v1/legajos",
        params={"cohorte_id": str(cohort.id), "estado": "BORRADOR", "page_size": 1},
        headers=auth_header(admin),
    )
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 2
    assert len(list_response.json()["items"]) == 1
    assert list_response.json()["page"] == 1


@pytest.mark.asyncio
async def test_legajo_detail_and_update_enforce_ownership_and_state(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    cohort = await create_cohort(test_session_factory)
    owner = await create_user(test_session_factory, email="owner@example.com")
    other = await create_user(test_session_factory, email="other@example.com")
    legajo = await post_legajo(client, owner, cohort)

    forbidden_detail = await client.get(
        f"/api/v1/legajos/{legajo['id']}",
        headers=auth_header(other),
    )
    assert forbidden_detail.status_code == 403

    forbidden_update = await client.put(
        f"/api/v1/legajos/{legajo['id']}",
        json={"dni": "30123458"},
        headers=auth_header(other),
    )
    assert forbidden_update.status_code == 403

    updated = await client.put(
        f"/api/v1/legajos/{legajo['id']}",
        json={"dni": "30123459", "email": "UPDATED@example.com"},
        headers=auth_header(owner),
    )
    assert updated.status_code == 200
    assert updated.json()["dni"] == "30123459"
    assert updated.json()["email"] == "updated@example.com"

    await upload_required_documents(
        test_session_factory,
        UUID(legajo["id"]),
        "DNI",
        "TITULO_GRADO",
    )
    sent = await client.post(
        f"/api/v1/legajos/{legajo['id']}/enviar",
        headers=auth_header(owner),
    )
    assert sent.status_code == 200

    locked_update = await client.put(
        f"/api/v1/legajos/{legajo['id']}",
        json={"dni": "30123460"},
        headers=auth_header(owner),
    )
    assert locked_update.status_code == 400


@pytest.mark.asyncio
async def test_sending_requires_both_documents_and_records_transition(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = await create_user(test_session_factory, email="valentin@example.com")
    cohort = await create_cohort(test_session_factory)
    legajo = await post_legajo(client, user, cohort)
    legajo_id = UUID(legajo["id"])

    await upload_required_documents(test_session_factory, legajo_id, "DNI")
    incomplete = await client.post(
        f"/api/v1/legajos/{legajo_id}/enviar",
        headers=auth_header(user),
    )
    assert incomplete.status_code == 400
    assert "TITULO_GRADO" in incomplete.json()["message"]

    await upload_required_documents(test_session_factory, legajo_id, "TITULO_GRADO")
    sent = await client.post(
        f"/api/v1/legajos/{legajo_id}/enviar",
        headers=auth_header(user),
    )
    assert sent.status_code == 200
    assert sent.json()["estado"] == "ENVIADO"
    assert sent.json()["fecha_inscripcion"] is not None

    async with test_session_factory() as session:
        transitions = list(
            (
                await session.scalars(
                    select(AuditoriaLegajo)
                    .where(AuditoriaLegajo.legajo_id == legajo_id)
                    .order_by(AuditoriaLegajo.created_at, AuditoriaLegajo.id)
                )
            ).all()
        )
    assert {transition.estado_nuevo for transition in transitions} == {"BORRADOR", "ENVIADO"}


@pytest.mark.asyncio
async def test_admin_transitions_require_valid_state_and_reason(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = await create_user(test_session_factory, email="valentin@example.com")
    admin = await create_user(
        test_session_factory,
        email="admin@example.com",
        role="ADMIN_POSGRADO",
    )
    cohort = await create_cohort(test_session_factory)
    legajo = await post_legajo(client, user, cohort)
    legajo_id = UUID(legajo["id"])
    await upload_required_documents(
        test_session_factory,
        legajo_id,
        "DNI",
        "TITULO_GRADO",
    )
    await client.post(
        f"/api/v1/legajos/{legajo_id}/enviar",
        headers=auth_header(user),
    )

    reviewed = await client.patch(
        f"/api/v1/legajos/{legajo_id}/estado",
        json={"estado": "EN_REVISION"},
        headers=auth_header(admin),
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["estado"] == "EN_REVISION"

    missing_reason = await client.patch(
        f"/api/v1/legajos/{legajo_id}/estado",
        json={"estado": "OBSERVADO"},
        headers=auth_header(admin),
    )
    assert missing_reason.status_code == 400

    observed = await client.patch(
        f"/api/v1/legajos/{legajo_id}/estado",
        json={"estado": "OBSERVADO", "motivo_observacion": "Falta corregir el DNI"},
        headers=auth_header(admin),
    )
    assert observed.status_code == 200
    assert observed.json()["estado"] == "OBSERVADO"
    assert observed.json()["motivo_observacion"] == "Falta corregir el DNI"


@pytest.mark.asyncio
async def test_approval_is_rejected_until_numbering_policy_is_defined(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = await create_user(test_session_factory, email="valentin@example.com")
    admin = await create_user(
        test_session_factory,
        email="admin@example.com",
        role="ADMIN_POSGRADO",
    )
    cohort = await create_cohort(test_session_factory)
    legajo = await post_legajo(client, user, cohort)

    response = await client.patch(
        f"/api/v1/legajos/{legajo['id']}/estado",
        json={"estado": "APROBADO"},
        headers=auth_header(admin),
    )

    assert response.status_code == 400
    assert "número de legajo" in response.json()["message"]
