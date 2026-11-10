from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class LegajoEstado(StrEnum):
    BORRADOR = "BORRADOR"
    PENDIENTE = "PENDIENTE"
    ENVIADO = "ENVIADO"
    EN_REVISION = "EN_REVISION"
    OBSERVADO = "OBSERVADO"
    APROBADO = "APROBADO"
    COMPLETADO = "COMPLETADO"
    ACTIVO = "ACTIVO"
    VENCIDO = "VENCIDO"
    RECHAZADO = "RECHAZADO"
    BAJA = "BAJA"
    GRADUADO = "GRADUADO"


class LegajoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    cohorte_id: UUID
    dni: str = Field(min_length=1, max_length=20)
    solicita_beca: bool = False
    tipo_beca: str | None = Field(default=None, max_length=20)


class LegajoUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    cohorte_id: UUID | None = None
    dni: str | None = Field(default=None, min_length=1, max_length=20)
    apellido: str | None = Field(default=None, min_length=1, max_length=100)
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = Field(default=None, max_length=255)
    solicita_beca: bool | None = None
    tipo_beca: str | None = Field(default=None, max_length=20)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        return str(value).lower() if value is not None else None

    @field_validator("cohorte_id", "dni", "apellido", "nombre", "email")
    @classmethod
    def reject_null_required_fields(cls, value: object) -> object:
        if value is None:
            raise ValueError("Este campo no puede ser null")
        return value

    @model_validator(mode="after")
    def require_changes(self) -> "LegajoUpdate":
        if not self.model_fields_set:
            raise ValueError("Debe enviar al menos un campo para actualizar")
        return self


class LegajoEstadoUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    estado: LegajoEstado
    motivo_observacion: str | None = Field(default=None, max_length=2000)


class CohorteLegajoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    anio: int
    nombre: str
    carrera: str
    codigo_carrera: str | None
    numero_cohorte: int | None


class LegajoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    numero_legajo: str | None
    usuario_id: UUID
    cohorte_id: UUID
    cohorte: CohorteLegajoResponse
    dni: str
    apellido: str
    nombre: str
    email: EmailStr
    estado: LegajoEstado
    solicita_beca: bool | None
    tipo_beca: str | None
    fecha_inscripcion: datetime | None
    fecha_aprobacion: datetime | None
    motivo_observacion: str | None
    semaforo: str | None
    created_at: datetime | None
    updated_at: datetime | None


class LegajoPage(BaseModel):
    items: list[LegajoResponse]
    total: int
    page: int
    page_size: int
