import os
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.legajos.document_schemas import TipoDocumento
from src.legajos.document_storage import (
    resolve_stored_path,
    safe_original_filename,
    store_pdf,
)
from src.legajos.models import Documento, Legajo
from src.shared.auth.errors import AuthenticationError
from src.shared.models import User


def _not_found(message: str) -> AuthenticationError:
    return AuthenticationError(message, status_code=status.HTTP_404_NOT_FOUND)


async def list_documents(
    db: AsyncSession,
    legajo_id: UUID,
) -> list[Documento]:
    query = (
        select(Documento)
        .where(Documento.legajo_id == legajo_id)
        .order_by(Documento.fecha_subida.desc(), Documento.id)
    )
    return list((await db.scalars(query)).all())


async def get_document(db: AsyncSession, document_id: UUID) -> Documento:
    document = await db.get(Documento, document_id)
    if document is None:
        raise _not_found("No se encontró el documento")
    return document


async def get_document_legajo(db: AsyncSession, document: Documento) -> Legajo:
    legajo = await db.get(Legajo, document.legajo_id)
    if legajo is None:
        raise _not_found("No se encontró el legajo del documento")
    return legajo


async def upload_document(
    db: AsyncSession,
    *,
    legajo: Legajo,
    tipo: TipoDocumento,
    filename: str | None,
    upload: UploadFile,
    storage_root: Path,
) -> Documento:
    document_id = uuid4()
    relative_path = ""
    try:
        relative_path, size, checksum = await store_pdf(
            upload,
            storage_root=storage_root,
            legajo_id=legajo.id,
            document_id=document_id,
        )
    finally:
        await upload.close()

    document = Documento(
        id=document_id,
        legajo_id=legajo.id,
        tipo=tipo.value,
        path_storage=relative_path,
        nombre_original=safe_original_filename(filename),
        checksum_sha256=checksum,
        tamanio_bytes=size,
    )
    db.add(document)

    try:
        await db.commit()
    except SQLAlchemyError:
        await db.rollback()
        stored_path = resolve_stored_path(storage_root, relative_path)
        stored_path.unlink(missing_ok=True)
        raise

    await db.refresh(document)
    return document


async def delete_document(
    db: AsyncSession,
    document: Documento,
    *,
    storage_root: Path,
) -> None:
    stored_path = resolve_stored_path(storage_root, document.path_storage)
    if not stored_path.is_file():
        raise _not_found("El archivo asociado al documento no está disponible")

    tombstone_path = stored_path.with_name(f".{document.id}.deleting")
    os.replace(stored_path, tombstone_path)
    try:
        await db.delete(document)
        await db.commit()
    except SQLAlchemyError:
        await db.rollback()
        os.replace(tombstone_path, stored_path)
        raise

    tombstone_path.unlink()


def document_download_path(document: Documento, storage_root: Path) -> Path:
    stored_path = resolve_stored_path(storage_root, document.path_storage)
    if not stored_path.is_file():
        raise _not_found("El archivo asociado al documento no está disponible")
    return stored_path


def can_manage_documents(legajo: Legajo) -> bool:
    return legajo.estado in {"BORRADOR", "OBSERVADO"}


def assert_document_owner(legajo: Legajo, user: User) -> None:
    if legajo.usuario_id != user.id:
        raise AuthenticationError(
            "No tiene permisos para acceder a los documentos de este legajo",
            status_code=status.HTTP_403_FORBIDDEN,
        )
