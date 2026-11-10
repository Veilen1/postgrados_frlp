from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.legajos.document_schemas import DocumentoResponse, TipoDocumento
from src.legajos.document_service import (
    assert_document_owner,
    can_manage_documents,
    delete_document,
    document_download_path,
    get_document,
    get_document_legajo,
    list_documents,
    upload_document,
)
from src.legajos.service import get_legajo
from src.shared.auth.dependencies import require_roles
from src.shared.auth.errors import AuthenticationError
from src.shared.config import get_storage_path
from src.shared.database import get_db
from src.shared.models import User

router = APIRouter(tags=["Documentos"])


@router.post(
    "/legajos/{legajo_id}/documentos",
    response_model=DocumentoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_legajo_document(
    legajo_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("ASPIRANTE"))],
    storage_root: Annotated[Path, Depends(get_storage_path)],
    archivo: Annotated[UploadFile, File()],
    tipo: Annotated[TipoDocumento, Form()],
) -> DocumentoResponse:
    legajo = await get_legajo(db, legajo_id)
    assert_document_owner(legajo, user)
    if not can_manage_documents(legajo):
        raise AuthenticationError(
            "Solo se pueden modificar documentos en estado BORRADOR u OBSERVADO",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    document = await upload_document(
        db,
        legajo=legajo,
        tipo=tipo,
        filename=archivo.filename,
        upload=archivo,
        storage_root=storage_root,
    )
    return DocumentoResponse.model_validate(document)


@router.get(
    "/legajos/{legajo_id}/documentos",
    response_model=list[DocumentoResponse],
)
async def get_legajo_documents(
    legajo_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[
        User,
        Depends(require_roles("ASPIRANTE", "ALUMNO", "ADMIN_POSGRADO", "SUPERADMIN")),
    ],
) -> list[DocumentoResponse]:
    legajo = await get_legajo(db, legajo_id)
    if user.rol in {"ASPIRANTE", "ALUMNO"}:
        assert_document_owner(legajo, user)
    documents = await list_documents(db, legajo_id)
    return [DocumentoResponse.model_validate(document) for document in documents]


@router.get("/documentos/{document_id}/download")
async def get_document_download(
    document_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[
        User,
        Depends(require_roles("ASPIRANTE", "ALUMNO", "ADMIN_POSGRADO", "SUPERADMIN")),
    ],
    storage_root: Annotated[Path, Depends(get_storage_path)],
) -> FileResponse:
    document = await get_document(db, document_id)
    legajo = await get_document_legajo(db, document)
    if user.rol in {"ASPIRANTE", "ALUMNO"}:
        assert_document_owner(legajo, user)

    path = document_download_path(document, storage_root)
    return FileResponse(
        path=path,
        filename=document.nombre_original,
        media_type="application/pdf",
        content_disposition_type="attachment",
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.delete("/documentos/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document_by_id(
    document_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("ASPIRANTE"))],
    storage_root: Annotated[Path, Depends(get_storage_path)],
) -> Response:
    document = await get_document(db, document_id)
    legajo = await get_document_legajo(db, document)
    assert_document_owner(legajo, user)
    if not can_manage_documents(legajo):
        raise AuthenticationError(
            "Solo se pueden modificar documentos en estado BORRADOR u OBSERVADO",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    await delete_document(db, document, storage_root=storage_root)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
