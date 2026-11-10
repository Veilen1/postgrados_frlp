from datetime import date
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.auth.security import create_access_token, hash_password
from src.cohortes.models import Cohorte
from src.legajos.document_storage import MAX_DOCUMENT_SIZE
from src.legajos.models import Legajo
from src.shared.api.middleware import MAX_DOCUMENT_REQUEST_SIZE
from src.shared.models import User

PASSWORD = "Correct-Horse-Battery-42"
PDF_CONTENT = b"%PDF-1.7\nsafe test document\n%%EOF"


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


async def create_legajo(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    owner: User,
    state: str = "BORRADOR",
) -> Legajo:
    cohort = Cohorte(
        id=uuid4(),
        anio=2026,
        nombre=f"Cohorte {uuid4()}",
        carrera="Especialización en Sistemas",
        tipo_carrera="Especializacion",
        abierta=True,
        fecha_inicio=date(2026, 3, 1),
    )
    legajo = Legajo(
        id=uuid4(),
        usuario_id=owner.id,
        cohorte_id=cohort.id,
        dni=f"{uuid4().int % 100000000:08d}",
        apellido=owner.apellido,
        nombre=owner.nombre,
        email=owner.email,
        estado=state,
    )
    async with session_factory() as session:
        session.add_all([cohort, legajo])
        await session.commit()
        await session.refresh(legajo)
    return legajo


def auth_header(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user)}"}


async def upload_document(
    client: AsyncClient,
    *,
    legajo_id: UUID,
    user: User,
    contents: bytes = PDF_CONTENT,
    tipo: str = "DNI",
    filename: str = "dni.pdf",
) -> dict:
    response = await client.post(
        f"/api/v1/legajos/{legajo_id}/documentos",
        data={"tipo": tipo},
        files={"archivo": (filename, contents, "application/pdf")},
        headers=auth_header(user),
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_upload_validates_pdf_and_returns_safe_metadata(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
    tmp_path: Path,
) -> None:
    owner = await create_user(test_session_factory, email="owner@example.com")
    legajo = await create_legajo(test_session_factory, owner=owner)
    metadata = await upload_document(
        client,
        legajo_id=legajo.id,
        user=owner,
        filename="../../private\\dni.pdf",
    )

    assert metadata["tipo"] == "DNI"
    assert metadata["nombre_original"] == "dni.pdf"
    assert metadata["tamanio_bytes"] == len(PDF_CONTENT)
    assert "path_storage" not in metadata
    assert "checksum_sha256" not in metadata
    stored_files = list((tmp_path / "private-storage").rglob("*.pdf"))
    assert len(stored_files) == 1
    assert stored_files[0].read_bytes() == PDF_CONTENT


@pytest.mark.asyncio
async def test_upload_rejects_non_pdf_and_oversized_content(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
    tmp_path: Path,
) -> None:
    owner = await create_user(test_session_factory, email="owner@example.com")
    legajo = await create_legajo(test_session_factory, owner=owner)

    not_pdf = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "DNI"},
        files={"archivo": ("fake.pdf", b"not a PDF", "application/pdf")},
        headers=auth_header(owner),
    )
    assert not_pdf.status_code == 415
    assert not_pdf.json()["error"] == "UNSUPPORTED_MEDIA_TYPE"

    exact_limit_content = b"%PDF" + b"x" * (MAX_DOCUMENT_SIZE - 4)
    exact_limit = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "DNI"},
        files={"archivo": ("exact-limit.pdf", exact_limit_content, "application/pdf")},
        headers=auth_header(owner),
    )
    assert exact_limit.status_code == 201
    assert exact_limit.json()["tamanio_bytes"] == MAX_DOCUMENT_SIZE

    oversized_content = b"%PDF" + b"x" * (MAX_DOCUMENT_SIZE - 3)
    oversized = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "DNI"},
        files={"archivo": ("large.pdf", oversized_content, "application/pdf")},
        headers=auth_header(owner),
    )
    assert oversized.status_code == 413
    assert oversized.json()["error"] == "PAYLOAD_TOO_LARGE"
    assert not list((tmp_path / "private-storage").rglob("*.upload"))

    over_request_limit = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "DNI"},
        files={
            "archivo": (
                "too-large.pdf",
                b"%PDF" + b"x" * (MAX_DOCUMENT_REQUEST_SIZE + 1),
                "application/pdf",
            )
        },
        headers=auth_header(owner),
    )
    assert over_request_limit.status_code == 413
    assert over_request_limit.json()["error"] == "PAYLOAD_TOO_LARGE"
    assert not list((tmp_path / "private-storage").rglob("*.upload"))


@pytest.mark.asyncio
async def test_document_upload_enforces_roles_ownership_and_editable_state(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    owner = await create_user(test_session_factory, email="owner@example.com")
    other = await create_user(test_session_factory, email="other@example.com")
    admin = await create_user(
        test_session_factory,
        email="admin@example.com",
        role="ADMIN_POSGRADO",
    )
    legajo = await create_legajo(test_session_factory, owner=owner)

    forbidden_owner = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "DNI"},
        files={"archivo": ("dni.pdf", PDF_CONTENT, "application/pdf")},
        headers=auth_header(other),
    )
    assert forbidden_owner.status_code == 403

    forbidden_role = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "DNI"},
        files={"archivo": ("dni.pdf", PDF_CONTENT, "application/pdf")},
        headers=auth_header(admin),
    )
    assert forbidden_role.status_code == 403

    document = await upload_document(client, legajo_id=legajo.id, user=owner)
    async with test_session_factory() as session:
        saved_legajo = await session.get(Legajo, legajo.id)
        assert saved_legajo is not None
        saved_legajo.estado = "ENVIADO"
        await session.commit()

    locked = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "CV"},
        files={"archivo": ("cv.pdf", PDF_CONTENT, "application/pdf")},
        headers=auth_header(owner),
    )
    assert locked.status_code == 400

    delete_locked = await client.delete(
        f"/api/v1/documentos/{document['id']}",
        headers=auth_header(owner),
    )
    assert delete_locked.status_code == 400


@pytest.mark.asyncio
async def test_document_list_download_and_delete_are_authorized(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
    tmp_path: Path,
) -> None:
    owner = await create_user(test_session_factory, email="owner@example.com")
    other = await create_user(test_session_factory, email="other@example.com")
    admin = await create_user(
        test_session_factory,
        email="admin@example.com",
        role="ADMIN_POSGRADO",
    )
    legajo = await create_legajo(test_session_factory, owner=owner)
    document = await upload_document(
        client,
        legajo_id=legajo.id,
        user=owner,
        tipo="TITULO_GRADO",
    )

    owner_list = await client.get(
        f"/api/v1/legajos/{legajo.id}/documentos",
        headers=auth_header(owner),
    )
    assert owner_list.status_code == 200
    assert [item["id"] for item in owner_list.json()] == [document["id"]]

    forbidden_list = await client.get(
        f"/api/v1/legajos/{legajo.id}/documentos",
        headers=auth_header(other),
    )
    assert forbidden_list.status_code == 403

    forbidden_download = await client.get(
        f"/api/v1/documentos/{document['id']}/download",
        headers=auth_header(other),
    )
    assert forbidden_download.status_code == 403

    admin_download = await client.get(
        f"/api/v1/documentos/{document['id']}/download",
        headers=auth_header(admin),
    )
    assert admin_download.status_code == 200
    assert admin_download.content == PDF_CONTENT
    assert admin_download.headers["content-type"] == "application/pdf"
    assert admin_download.headers["cache-control"] == "private, no-store"
    assert "attachment" in admin_download.headers["content-disposition"]
    assert admin_download.headers["x-content-type-options"] == "nosniff"

    stored_file = next((tmp_path / "private-storage").rglob("*.pdf"))
    deleted = await client.delete(
        f"/api/v1/documentos/{document['id']}",
        headers=auth_header(owner),
    )
    assert deleted.status_code == 204
    assert not stored_file.exists()

    missing = await client.get(
        f"/api/v1/documentos/{document['id']}/download",
        headers=auth_header(admin),
    )
    assert missing.status_code == 404


@pytest.mark.asyncio
async def test_document_upload_requires_authentication_and_valid_type(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    owner = await create_user(test_session_factory, email="owner@example.com")
    legajo = await create_legajo(test_session_factory, owner=owner)

    unauthenticated = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "DNI"},
        files={"archivo": ("dni.pdf", PDF_CONTENT, "application/pdf")},
    )
    assert unauthenticated.status_code == 401

    invalid_type = await client.post(
        f"/api/v1/legajos/{legajo.id}/documentos",
        data={"tipo": "OTHER"},
        files={"archivo": ("other.pdf", PDF_CONTENT, "application/pdf")},
        headers=auth_header(owner),
    )
    assert invalid_type.status_code == 422


@pytest.mark.asyncio
async def test_admin_can_list_document_metadata_but_metadata_does_not_expose_storage(
    client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    owner = await create_user(test_session_factory, email="owner@example.com")
    admin = await create_user(
        test_session_factory,
        email="admin@example.com",
        role="SUPERADMIN",
    )
    legajo = await create_legajo(test_session_factory, owner=owner)
    document = await upload_document(client, legajo_id=legajo.id, user=owner)

    response = await client.get(
        f"/api/v1/legajos/{legajo.id}/documentos",
        headers=auth_header(admin),
    )

    assert response.status_code == 200
    assert response.json()[0]["id"] == document["id"]
    assert "path_storage" not in response.json()[0]
    assert "checksum_sha256" not in response.json()[0]
