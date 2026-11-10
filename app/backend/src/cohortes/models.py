from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from src.shared.database import Base


class Cohorte(Base):
    __tablename__ = "cohortes"
    __table_args__ = (
        CheckConstraint(
            "tipo_carrera IN ('Especializacion', 'Maestria', 'Doctorado')",
            name="tipo_carrera_cohorte",
        ),
        CheckConstraint(
            "codigo_carrera IS NULL OR "
            "(length(codigo_carrera) = 4 AND codigo_carrera = upper(codigo_carrera))",
            name="codigo_carrera_formato",
        ),
        CheckConstraint(
            "(codigo_carrera IS NULL AND numero_cohorte IS NULL) OR "
            "(codigo_carrera IS NOT NULL AND numero_cohorte IS NOT NULL)",
            name="identificador_cohorte_completo",
        ),
        CheckConstraint(
            "numero_cohorte IS NULL OR numero_cohorte BETWEEN 1 AND 99",
            name="numero_cohorte_rango",
        ),
        CheckConstraint(
            "ultimo_numero_legajo >= 0",
            name="ultimo_numero_legajo_no_negativo",
        ),
        UniqueConstraint(
            "anio",
            "codigo_carrera",
            "numero_cohorte",
            name="uq_cohortes_identificador_anual",
        ),
        Index("idx_cohortes_abierta", "abierta"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    anio: Mapped[int] = mapped_column(Integer, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    carrera: Mapped[str] = mapped_column(String(100), nullable=False)
    codigo_carrera: Mapped[str | None] = mapped_column(String(4))
    numero_cohorte: Mapped[int | None] = mapped_column(Integer)
    ultimo_numero_legajo: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    tipo_carrera: Mapped[str] = mapped_column(String(30), nullable=False)
    abierta: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default=text("false"),
    )
    fecha_inicio: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
