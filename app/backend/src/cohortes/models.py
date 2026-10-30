from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Date, DateTime, Index, Integer, String, func, text
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
