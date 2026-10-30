from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from src.shared.database import Base


class Legajo(Base):
    __tablename__ = "legajos"
    __table_args__ = (
        CheckConstraint(
            "estado IN ('BORRADOR', 'PENDIENTE', 'ENVIADO', 'EN_REVISION', "
            "'OBSERVADO', 'APROBADO', 'COMPLETADO', 'ACTIVO', 'VENCIDO', "
            "'RECHAZADO', 'BAJA', 'GRADUADO')",
            name="estado_legajo_valido",
        ),
        CheckConstraint(
            "semaforo IN ('VERDE', 'AMARILLO', 'ROJO')",
            name="semaforo_valido",
        ),
        UniqueConstraint("usuario_id", name="uq_legajo_usuario"),
        UniqueConstraint("cohorte_id", "dni", name="uq_legajo_cohorte_dni"),
        Index("idx_legajos_dni", "dni"),
        Index("idx_legajos_email", "email"),
        Index("idx_legajos_cohorte_estado", "cohorte_id", "estado"),
        Index("idx_legajos_usuario", "usuario_id"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    numero_legajo: Mapped[str | None] = mapped_column(String(30), unique=True)
    usuario_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    cohorte_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("cohortes.id"),
        nullable=False,
    )
    dni: Mapped[str] = mapped_column(String(20), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="BORRADOR",
        server_default=text("'BORRADOR'"),
    )
    solicita_beca: Mapped[bool | None] = mapped_column(
        nullable=True,
        default=False,
        server_default=text("false"),
    )
    tipo_beca: Mapped[str | None] = mapped_column(String(20))
    fecha_inscripcion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fecha_aprobacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    motivo_observacion: Mapped[str | None] = mapped_column(Text)
    semaforo: Mapped[str | None] = mapped_column(
        String(10),
        default="VERDE",
        server_default=text("'VERDE'"),
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class Documento(Base):
    __tablename__ = "documentos"
    __table_args__ = (
        CheckConstraint(
            "tipo IN ('DNI', 'TITULO_GRADO', 'PARTIDA', 'CUIT_CUIL', "
            "'FORM_INSCRIPCION', 'FORM_BECA', 'TITULO_POSGRADO', 'CV')",
            name="tipo_doc_valido",
        ),
        Index("idx_documentos_legajo", "legajo_id"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    legajo_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("legajos.id", ondelete="CASCADE"),
        nullable=False,
    )
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    path_storage: Mapped[str] = mapped_column(String(500), nullable=False)
    nombre_original: Mapped[str] = mapped_column(String(255), nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    tamanio_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_subida: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class AuditoriaLegajo(Base):
    __tablename__ = "auditoria_legajos"
    __table_args__ = (Index("idx_auditoria_legajo", "legajo_id"),)

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    legajo_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("legajos.id", ondelete="CASCADE"),
        nullable=False,
    )
    estado_anterior: Mapped[str | None] = mapped_column(String(30))
    estado_nuevo: Mapped[str] = mapped_column(String(30), nullable=False)
    comentario: Mapped[str | None] = mapped_column(Text)
    usuario_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("usuarios.id"),
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
