from datetime import date, datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TipoCarrera(StrEnum):
    ESPECIALIZACION = "Especializacion"
    MAESTRIA = "Maestria"
    DOCTORADO = "Doctorado"


class CohorteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    anio: int = Field(ge=1)
    nombre: str = Field(min_length=1, max_length=100)
    carrera: str = Field(min_length=1, max_length=100)
    tipo_carrera: TipoCarrera
    abierta: bool = False
    fecha_inicio: date | None = None

    @model_validator(mode="after")
    def validate_name_and_carrera(self) -> "CohorteCreate":
        if not self.nombre or not self.carrera:
            raise ValueError("nombre y carrera no pueden quedar vacíos")
        return self


class CohorteEstadoUpdate(BaseModel):
    abierta: bool


class CohorteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    anio: int
    nombre: str
    carrera: str
    tipo_carrera: TipoCarrera
    abierta: bool
    fecha_inicio: date | None
    created_at: datetime | None
