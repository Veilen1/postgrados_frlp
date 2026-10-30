from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TipoDocumento(StrEnum):
    DNI = "DNI"
    TITULO_GRADO = "TITULO_GRADO"
    PARTIDA = "PARTIDA"
    CUIT_CUIL = "CUIT_CUIL"
    FORM_INSCRIPCION = "FORM_INSCRIPCION"
    FORM_BECA = "FORM_BECA"
    TITULO_POSGRADO = "TITULO_POSGRADO"
    CV = "CV"


class DocumentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    legajo_id: UUID
    tipo: TipoDocumento
    nombre_original: str
    tamanio_bytes: int = Field(ge=0)
    fecha_subida: datetime | None
