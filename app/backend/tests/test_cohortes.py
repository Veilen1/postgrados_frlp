from datetime import date
from typing import Any
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.auth.security import create_access_token, hash_password
from src.cohortes.models import Cohorte
from src.legajos.models import Legajo
from src.shared.models import User

ADMIN_EMAIL = "admin@example.com"
ASPIRANT_EMAIL = "aspirant@example.com"
PASSWORD = "Correct-Horse-Battery-42"


async def create_user(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    email: str,
    role: str,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        nombre="Test",
        apellido="User",
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
    name: str,
    is_open: bool,
) -> Cohorte:
    cohort = Cohorte(
        id=uuid4(),
        anio=2026,
        nombre=name,
        carrera="Maestría en Ingeniería en Sistemas de Información",
        tipo_carrera="Especializacion",
        abierta=is_open,
        fecha_inicio=date(2026, 3, 1),
    )
    async with session_factory() as session:
        session.add(cohort)
        await session.commit()
        await session.refresh(cohort)
    return cohort


def auth_header(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user)}"}


def valid_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "anio": 2026,
        "nombre": "Maestría en Ingeniería en Sistemas de Información 2026",
        "carrera": "Maestría en Ingeniería en Sistemas de Información",
        "codigo_carrera": "MISI",
        "numero_cohorte": 1,
        "tipo_carrera": "Maestria",
        "abierta": True,
        "fecha_inicio": "2026-08-01",
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_public_cohort_list_only_includes_open_cohorts(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await create_cohort(test_session_factory, name="Cohorte abierta", is_open=True)
    await create_cohort(test_session_factory, name="Cohorte cerrada", is_open=False)

    response = await client.get("/api/v1/cohortes")

    assert response.status_code == 200
    assert [cohort["nombre"] for cohort in response.json()] == ["Cohorte abierta"]


@pytest.mark.asyncio
async def test_authenticated_cohort_list_includes_open_and_closed(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    await create_cohort(test_session_factory, name="Cohorte abierta", is_open=True)
    await create_cohort(test_session_factory, name="Cohorte cerrada", is_open=False)
    user = await create_user(test_session_factory, email=ASPIRANT_EMAIL, role="ASPIRANTE")

    response = await client.get("/api/v1/cohortes", headers=auth_header(user))

    assert response.status_code == 200
    assert {cohort["nombre"] for cohort in response.json()} == {
        "Cohorte abierta",
        "Cohorte cerrada",
    }


@pytest.mark.asyncio
async def test_public_cohort_list_rejects_an_invalid_bearer_token(
    client: AsyncClient,
) -> None:
    response = await client.get(
        "/api/v1/cohortes",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
    assert response.json()["error"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_cohort_creation_requires_authentication(client: AsyncClient) -> None:
    response = await client.post("/api/v1/cohortes", json=valid_payload())

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_cohort_creation_rejects_aspirant_role(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = await create_user(test_session_factory, email=ASPIRANT_EMAIL, role="ASPIRANTE")

    response = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(),
        headers=auth_header(user),
    )

    assert response.status_code == 403
    assert response.json()["error"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_admin_can_create_cohort(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="ADMIN_POSGRADO")

    response = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(),
        headers=auth_header(admin),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["nombre"] == "Maestría en Ingeniería en Sistemas de Información 2026"
    assert body["codigo_carrera"] == "MISI"
    assert body["numero_cohorte"] == 1
    assert body["tipo_carrera"] == "Maestria"
    assert body["abierta"] is True
    assert body["fecha_inicio"] == "2026-08-01"

    async with test_session_factory() as session:
        created = await session.scalar(
            select(Cohorte).where(
                Cohorte.nombre == "Maestría en Ingeniería en Sistemas de Información 2026"
            )
        )
        assert created is not None
        assert created.id is not None


@pytest.mark.asyncio
async def test_superadmin_can_create_cohort(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="SUPERADMIN")

    response = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(),
        headers=auth_header(admin),
    )

    assert response.status_code == 201


@pytest.mark.asyncio
async def test_cohort_creation_rejects_duplicate_name(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="ADMIN_POSGRADO")
    await create_cohort(
        test_session_factory,
        name="Maestría en Ingeniería en Sistemas de Información 2026",
        is_open=False,
    )

    response = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(),
        headers=auth_header(admin),
    )

    assert response.status_code == 400
    assert response.json()["error"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_cohort_creation_validates_fields(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="ADMIN_POSGRADO")
    response = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(tipo_carrera="Curso", anio=0),
        headers=auth_header(admin),
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_cohort_creation_rejects_duplicate_identifier_and_invalid_code(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="ADMIN_POSGRADO")
    first = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(),
        headers=auth_header(admin),
    )
    duplicate_identifier = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(nombre="Otra maestría"),
        headers=auth_header(admin),
    )
    invalid_code = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(nombre="Código inválido", codigo_carrera="misi"),
        headers=auth_header(admin),
    )
    conflicting_career_code = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(
            nombre="Código alternativo",
            codigo_carrera="MSII",
            numero_cohorte=2,
        ),
        headers=auth_header(admin),
    )
    reused_code = await client.post(
        "/api/v1/cohortes",
        json=valid_payload(
            nombre="Otra carrera",
            carrera="Maestría en Ingeniería Industrial",
            numero_cohorte=2,
        ),
        headers=auth_header(admin),
    )

    assert first.status_code == 201
    assert duplicate_identifier.status_code == 409
    assert invalid_code.status_code == 422
    assert conflicting_career_code.status_code == 400
    assert reused_code.status_code == 400


@pytest.mark.asyncio
async def test_admin_cannot_change_identifier_after_issuing_descriptive_numbers(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="SUPERADMIN")
    owner = await create_user(test_session_factory, email=ASPIRANT_EMAIL, role="ASPIRANTE")
    cohort = await create_cohort(test_session_factory, name="Cohorte heredada", is_open=False)

    assigned = await client.patch(
        f"/api/v1/cohortes/{cohort.id}/identificador",
        json={"codigo_carrera": "MISI", "numero_cohorte": 1},
        headers=auth_header(admin),
    )
    assert assigned.status_code == 200
    assert assigned.json()["codigo_carrera"] == "MISI"
    assert assigned.json()["numero_cohorte"] == 1

    async with test_session_factory() as session:
        saved = await session.get(Cohorte, cohort.id)
        assert saved is not None
        session.add(
            Legajo(
                id=uuid4(),
                numero_legajo="26-MISI-01-001",
                usuario_id=owner.id,
                cohorte_id=cohort.id,
                dni="30123456",
                apellido=owner.apellido,
                nombre=owner.nombre,
                email=owner.email,
                estado="APROBADO",
            )
        )
        saved.ultimo_numero_legajo = 1
        await session.commit()

    locked = await client.patch(
        f"/api/v1/cohortes/{cohort.id}/identificador",
        json={"codigo_carrera": "MISI", "numero_cohorte": 2},
        headers=auth_header(admin),
    )
    assert locked.status_code == 400


@pytest.mark.asyncio
async def test_admin_can_assign_identifier_to_legacy_cohort_with_historical_numbers(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="SUPERADMIN")
    owner = await create_user(test_session_factory, email=ASPIRANT_EMAIL, role="ASPIRANTE")
    cohort = await create_cohort(
        test_session_factory,
        name="Cohorte histórica",
        is_open=False,
    )
    async with test_session_factory() as session:
        saved = await session.get(Cohorte, cohort.id)
        assert saved is not None
        saved.ultimo_numero_legajo = 45
        session.add(
            Legajo(
                id=uuid4(),
                numero_legajo="26-001-045",
                usuario_id=owner.id,
                cohorte_id=cohort.id,
                dni="30123456",
                apellido=owner.apellido,
                nombre=owner.nombre,
                email=owner.email,
                estado="APROBADO",
            )
        )
        await session.commit()

    assigned = await client.patch(
        f"/api/v1/cohortes/{cohort.id}/identificador",
        json={"codigo_carrera": "MISI", "numero_cohorte": 1},
        headers=auth_header(admin),
    )

    assert assigned.status_code == 200
    assert assigned.json()["codigo_carrera"] == "MISI"
    assert assigned.json()["numero_cohorte"] == 1
    async with test_session_factory() as session:
        updated = await session.get(Cohorte, cohort.id)
        assert updated is not None
        assert updated.ultimo_numero_legajo == 45


@pytest.mark.asyncio
async def test_admin_can_open_and_close_a_cohort(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="ADMIN_POSGRADO")
    cohort = await create_cohort(test_session_factory, name="Cohorte 2026", is_open=False)

    open_response = await client.patch(
        f"/api/v1/cohortes/{cohort.id}/estado",
        json={"abierta": True},
        headers=auth_header(admin),
    )
    close_response = await client.patch(
        f"/api/v1/cohortes/{cohort.id}/estado",
        json={"abierta": False},
        headers=auth_header(admin),
    )

    assert open_response.status_code == 200
    assert open_response.json()["abierta"] is True
    assert close_response.status_code == 200
    assert close_response.json()["abierta"] is False


@pytest.mark.asyncio
async def test_cohort_state_update_returns_not_found_for_unknown_id(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin = await create_user(test_session_factory, email=ADMIN_EMAIL, role="ADMIN_POSGRADO")

    response = await client.patch(
        f"/api/v1/cohortes/{uuid4()}/estado",
        json={"abierta": True},
        headers=auth_header(admin),
    )

    assert response.status_code == 404
    assert response.json()["error"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_aspirant_cannot_update_cohort_state(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    user = await create_user(test_session_factory, email=ASPIRANT_EMAIL, role="ASPIRANTE")
    cohort = await create_cohort(test_session_factory, name="Cohorte 2026", is_open=False)

    response = await client.patch(
        f"/api/v1/cohortes/{cohort.id}/estado",
        json={"abierta": True},
        headers=auth_header(user),
    )

    assert response.status_code == 403
    assert response.json()["error"] == "FORBIDDEN"
