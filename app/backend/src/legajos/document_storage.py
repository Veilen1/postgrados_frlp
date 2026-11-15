import hashlib
import os
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile, status

from src.shared.auth.errors import AuthenticationError

MAX_DOCUMENT_SIZE = 5 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 64 * 1024


def build_storage_path(
    storage_root: Path,
    legajo_id: UUID,
    document_id: UUID,
) -> tuple[Path, str]:
    root = storage_root.expanduser().resolve()
    relative_path = Path(str(legajo_id)) / f"{document_id}.pdf"
    destination = (root / relative_path).resolve()
    if not destination.is_relative_to(root):
        raise OSError("La ruta del documento queda fuera del almacenamiento permitido")
    return destination, relative_path.as_posix()


async def store_pdf(
    upload: UploadFile,
    *,
    storage_root: Path,
    legajo_id: UUID,
    document_id: UUID,
) -> tuple[str, int, str]:
    destination, relative_path = build_storage_path(storage_root, legajo_id, document_id)
    temporary_path = destination.with_name(f".{document_id}.upload")
    digest = hashlib.sha256()
    total_size = 0

    try:
        first_chunk = await upload.read(UPLOAD_CHUNK_SIZE)
        if not first_chunk.startswith(b"%PDF"):
            raise AuthenticationError(
                "El archivo proporcionado no posee una firma válida de documento PDF (%PDF)",
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )

        destination.parent.mkdir(parents=True, exist_ok=True)
        with temporary_path.open("xb") as stream:
            chunk = first_chunk
            while chunk:
                total_size += len(chunk)
                if total_size > MAX_DOCUMENT_SIZE:
                    raise AuthenticationError(
                        "El archivo supera el tamaño máximo de 5 MB",
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    )
                stream.write(chunk)
                digest.update(chunk)
                chunk = await upload.read(UPLOAD_CHUNK_SIZE)
            stream.flush()
            os.fsync(stream.fileno())

        os.replace(temporary_path, destination)
    finally:
        temporary_path.unlink(missing_ok=True)

    return relative_path, total_size, digest.hexdigest()


def resolve_stored_path(storage_root: Path, relative_path: str) -> Path:
    root = storage_root.expanduser().resolve()
    candidate = (root / relative_path).resolve()
    if not candidate.is_relative_to(root):
        raise OSError("La ruta del documento queda fuera del almacenamiento permitido")
    return candidate


def safe_original_filename(filename: str | None) -> str:
    name = (filename or "documento.pdf").replace("\\", "/").rsplit("/", 1)[-1]
    name = "".join(character for character in name if character.isprintable())
    return name[:255] or "documento.pdf"
