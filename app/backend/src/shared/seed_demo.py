"""Precarga datos realistas de cohortes, aspirantes, legajos y PDFs para demostración."""

from __future__ import annotations

import asyncio
import hashlib
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.security import hash_password
from src.cohortes.models import Cohorte
from src.legajos.document_storage import build_storage_path
from src.legajos.models import AuditoriaLegajo, Documento, Legajo
from src.shared.config import get_storage_path
from src.shared.database import engine, session_factory
from src.shared.models import User


@dataclass(frozen=True)
class SeedCohorte:
    key: str
    anio: int
    nombre: str
    carrera: str
    codigo_carrera: str
    numero_cohorte: int
    tipo_carrera: str
    abierta: bool
    fecha_inicio: date


@dataclass(frozen=True)
class SeedEstudiante:
    cohorte_key: str
    nombre: str
    apellido: str
    email: str
    dni: str
    nacionalidad: str
    domicilio: str
    titulo: str
    universidad: str
    anio_egreso: int
    estado: str
    solicita_beca: bool
    tipo_beca: str | None
    motivo_observacion: str | None
    docs: tuple[str, ...]
    dias_atras: int


COHORTES_DEMO: tuple[SeedCohorte, ...] = (
    SeedCohorte(
        key="MSIS_2026",
        anio=2026,
        nombre="Cohorte 2026 - Maestría en Sistemas (MSIS)",
        carrera="Maestría en Ingeniería en Sistemas de Información",
        codigo_carrera="MSIS",
        numero_cohorte=1,
        tipo_carrera="Maestria",
        abierta=True,
        fecha_inicio=date(2026, 4, 15),
    ),
    SeedCohorte(
        key="EHYS_2026",
        anio=2026,
        nombre="Cohorte 2026 - Higiene y Seguridad (EHYS)",
        carrera="Especialización en Higiene y Seguridad en el Trabajo",
        codigo_carrera="EHYS",
        numero_cohorte=1,
        tipo_carrera="Especializacion",
        abierta=True,
        fecha_inicio=date(2026, 5, 4),
    ),
    SeedCohorte(
        key="EIAM_2026",
        anio=2026,
        nombre="Cohorte 2026 - Ingeniería Ambiental (EIAM)",
        carrera="Especialización en Ingeniería Ambiental",
        codigo_carrera="EIAM",
        numero_cohorte=1,
        tipo_carrera="Especializacion",
        abierta=True,
        fecha_inicio=date(2026, 5, 18),
    ),
    SeedCohorte(
        key="MRDT_2026",
        anio=2026,
        nombre="Cohorte 2026 - Maestría en Redes de Datos (MRDT)",
        carrera="Maestría en Redes de Datos",
        codigo_carrera="MRDT",
        numero_cohorte=1,
        tipo_carrera="Maestria",
        abierta=True,
        fecha_inicio=date(2026, 6, 1),
    ),
    SeedCohorte(
        key="DING_2025",
        anio=2025,
        nombre="Cohorte 2025 - Doctorado en Ingeniería (Cerrada)",
        carrera="Doctorado en Ingeniería",
        codigo_carrera="DING",
        numero_cohorte=2,
        tipo_carrera="Doctorado",
        abierta=False,
        fecha_inicio=date(2025, 3, 10),
    ),
)


ESTUDIANTES_DEMO: tuple[SeedEstudiante, ...] = (
    SeedEstudiante(
        cohorte_key="MSIS_2026",
        nombre="Martín",
        apellido="Ferreyra",
        email="martin.ferreyra@demo.frlp.utn.edu.ar",
        dni="36412890",
        nacionalidad="Argentina",
        domicilio="Calle 12 N° 845, La Plata, Buenos Aires",
        titulo="Ingeniero en Sistemas de Información",
        universidad="UTN FRLP",
        anio_egreso=2021,
        estado="APROBADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO", "CV"),
        dias_atras=22,
    ),
    SeedEstudiante(
        cohorte_key="MSIS_2026",
        nombre="Sofía",
        apellido="Benítez",
        email="sofia.benitez@demo.frlp.utn.edu.ar",
        dni="38940112",
        nacionalidad="Argentina",
        domicilio="Av. Montevideo 1420, Berisso, Buenos Aires",
        titulo="Licenciada en Sistemas",
        universidad="UNLP - Facultad de Informática",
        anio_egreso=2023,
        estado="APROBADO",
        solicita_beca=True,
        tipo_beca="30%",
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO", "CV"),
        dias_atras=20,
    ),
    SeedEstudiante(
        cohorte_key="MSIS_2026",
        nombre="Nicolás",
        apellido="Ibarra",
        email="nicolas.ibarra@demo.frlp.utn.edu.ar",
        dni="37105432",
        nacionalidad="Argentina",
        domicilio="Diag. 74 N° 1630, La Plata, Buenos Aires",
        titulo="Ingeniero en Computación",
        universidad="UNLP - Facultad de Ingeniería",
        anio_egreso=2022,
        estado="EN_REVISION",
        solicita_beca=True,
        tipo_beca="100%",
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO"),
        dias_atras=6,
    ),
    SeedEstudiante(
        cohorte_key="MSIS_2026",
        nombre="Camila",
        apellido="Peralta",
        email="camila.peralta@demo.frlp.utn.edu.ar",
        dni="40229871",
        nacionalidad="Argentina",
        domicilio="Calle Bossinga 390, Ensenada, Buenos Aires",
        titulo="Ingeniera en Sistemas de Información",
        universidad="UTN FRBA",
        anio_egreso=2024,
        estado="ENVIADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "CV"),
        dias_atras=2,
    ),
    SeedEstudiante(
        cohorte_key="MSIS_2026",
        nombre="Mateo",
        apellido="Quiroga",
        email="mateo.quiroga@demo.frlp.utn.edu.ar",
        dni="39551204",
        nacionalidad="Uruguay",
        domicilio="Av. Rivadavia 4210, CABA",
        titulo="Licenciado en Ciencias de la Computación",
        universidad="UBA - FCEN",
        anio_egreso=2023,
        estado="OBSERVADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=(
            "La copia del título de grado no incluye el dorso con las legalizaciones ministeriales."
        ),
        docs=("DNI", "TITULO_GRADO"),
        dias_atras=9,
    ),
    SeedEstudiante(
        cohorte_key="MSIS_2026",
        nombre="Valentina",
        apellido="Molina",
        email="valentina.molina@demo.frlp.utn.edu.ar",
        dni="41008345",
        nacionalidad="Argentina",
        domicilio="Calle 47 N° 612, La Plata, Buenos Aires",
        titulo="Ingeniera en Informática",
        universidad="UNMdP",
        anio_egreso=2024,
        estado="ENVIADO",
        solicita_beca=True,
        tipo_beca="50%",
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO"),
        dias_atras=1,
    ),
    SeedEstudiante(
        cohorte_key="EHYS_2026",
        nombre="Federico",
        apellido="Castellanos",
        email="federico.castellanos@demo.frlp.utn.edu.ar",
        dni="33890125",
        nacionalidad="Argentina",
        domicilio="Av. Mitre 2150, Avellaneda, Buenos Aires",
        titulo="Ingeniero Industrial",
        universidad="UTN FRA",
        anio_egreso=2018,
        estado="APROBADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO", "CV"),
        dias_atras=19,
    ),
    SeedEstudiante(
        cohorte_key="EHYS_2026",
        nombre="Luciana",
        apellido="Sosa",
        email="luciana.sosa@demo.frlp.utn.edu.ar",
        dni="35674321",
        nacionalidad="Argentina",
        domicilio="Calle Garibaldi 520, Quilmes, Buenos Aires",
        titulo="Ingeniera Química",
        universidad="UTN FRLP",
        anio_egreso=2019,
        estado="APROBADO",
        solicita_beca=True,
        tipo_beca="30%",
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "CV"),
        dias_atras=17,
    ),
    SeedEstudiante(
        cohorte_key="EHYS_2026",
        nombre="Ezequiel",
        apellido="Ríos",
        email="ezequiel.rios@demo.frlp.utn.edu.ar",
        dni="37891234",
        nacionalidad="Argentina",
        domicilio="Camino Centenario Km 11, City Bell, Buenos Aires",
        titulo="Ingeniero Mecánico",
        universidad="UTN FRLP",
        anio_egreso=2021,
        estado="EN_REVISION",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO"),
        dias_atras=5,
    ),
    SeedEstudiante(
        cohorte_key="EHYS_2026",
        nombre="Paula",
        apellido="Gutiérrez",
        email="paula.gutierrez@demo.frlp.utn.edu.ar",
        dni="39210456",
        nacionalidad="Colombia",
        domicilio="Av. 7 N° 1180, La Plata, Buenos Aires",
        titulo="Ingeniera Civil",
        universidad="Universidad Nacional de Colombia",
        anio_egreso=2020,
        estado="OBSERVADO",
        solicita_beca=True,
        tipo_beca="100%",
        motivo_observacion=("Falta adjuntar certificado analítico apostillado para convalidación."),
        docs=("DNI", "TITULO_GRADO"),
        dias_atras=11,
    ),
    SeedEstudiante(
        cohorte_key="EHYS_2026",
        nombre="Tomás",
        apellido="Aguirre",
        email="tomas.aguirre@demo.frlp.utn.edu.ar",
        dni="41789210",
        nacionalidad="Argentina",
        domicilio="Calle 14 N° 420, Berazategui, Buenos Aires",
        titulo="Técnico Universitario en Seguridad e Higiene",
        universidad="UTN FRLP",
        anio_egreso=2024,
        estado="RECHAZADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=(
            "La especialización requiere título de grado universitario (mínimo 4 años)."
        ),
        docs=("DNI", "TITULO_GRADO"),
        dias_atras=14,
    ),
    SeedEstudiante(
        cohorte_key="EIAM_2026",
        nombre="Agustina",
        apellido="Vega",
        email="agustina.vega@demo.frlp.utn.edu.ar",
        dni="36987654",
        nacionalidad="Argentina",
        domicilio="Calle 54 N° 910, La Plata, Buenos Aires",
        titulo="Licenciada en Química y Tecnología Ambiental",
        universidad="UNLP - Facultad de Ciencias Exactas",
        anio_egreso=2020,
        estado="APROBADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO", "CV"),
        dias_atras=16,
    ),
    SeedEstudiante(
        cohorte_key="EIAM_2026",
        nombre="Bruno",
        apellido="Paz",
        email="bruno.paz@demo.frlp.utn.edu.ar",
        dni="38123987",
        nacionalidad="Argentina",
        domicilio="Bv. Oroño 1840, Rosario, Santa Fe",
        titulo="Ingeniero Ambiental",
        universidad="UNL",
        anio_egreso=2022,
        estado="ENVIADO",
        solicita_beca=True,
        tipo_beca="50%",
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO"),
        dias_atras=3,
    ),
    SeedEstudiante(
        cohorte_key="EIAM_2026",
        nombre="Florencia",
        apellido="Ledesma",
        email="florencia.ledesma@demo.frlp.utn.edu.ar",
        dni="40567123",
        nacionalidad="Argentina",
        domicilio="Av. Hipólito Yrigoyen 8920, Lomas de Zamora, Buenos Aires",
        titulo="Bióloga",
        universidad="UBA - FCEN",
        anio_egreso=2023,
        estado="EN_REVISION",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "CV"),
        dias_atras=4,
    ),
    SeedEstudiante(
        cohorte_key="EIAM_2026",
        nombre="Diego",
        apellido="Suárez",
        email="diego.suarez@demo.frlp.utn.edu.ar",
        dni="34901234",
        nacionalidad="Chile",
        domicilio="Calle 8 N° 1340, La Plata, Buenos Aires",
        titulo="Ingeniero Químico",
        universidad="UTN FRC",
        anio_egreso=2017,
        estado="BORRADOR",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI",),
        dias_atras=1,
    ),
    SeedEstudiante(
        cohorte_key="MRDT_2026",
        nombre="Julián",
        apellido="Navarro",
        email="julian.navarro@demo.frlp.utn.edu.ar",
        dni="35120498",
        nacionalidad="Argentina",
        domicilio="Roque Sáenz Peña 450, Bernal, Buenos Aires",
        titulo="Ingeniero en Telecomunicaciones",
        universidad="UNLP - Facultad de Ingeniería",
        anio_egreso=2019,
        estado="APROBADO",
        solicita_beca=True,
        tipo_beca="30%",
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO", "CV"),
        dias_atras=15,
    ),
    SeedEstudiante(
        cohorte_key="MRDT_2026",
        nombre="Rocío",
        apellido="Cáceres",
        email="rocio.caceres@demo.frlp.utn.edu.ar",
        dni="39876543",
        nacionalidad="Argentina",
        domicilio="Calle 60 N° 730, La Plata, Buenos Aires",
        titulo="Ingeniera Electrónica",
        universidad="UTN FRLP",
        anio_egreso=2023,
        estado="EN_REVISION",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO"),
        dias_atras=4,
    ),
    SeedEstudiante(
        cohorte_key="MRDT_2026",
        nombre="Gonzalo",
        apellido="Medina",
        email="gonzalo.medina@demo.frlp.utn.edu.ar",
        dni="37456123",
        nacionalidad="Argentina",
        domicilio="Av. Colón 2310, Córdoba, Córdoba",
        titulo="Ingeniero en Sistemas de Información",
        universidad="UTN FRC",
        anio_egreso=2021,
        estado="ENVIADO",
        solicita_beca=True,
        tipo_beca="100%",
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "CV"),
        dias_atras=2,
    ),
    SeedEstudiante(
        cohorte_key="MRDT_2026",
        nombre="Melisa",
        apellido="Domínguez",
        email="melisa.dominguez@demo.frlp.utn.edu.ar",
        dni="41234987",
        nacionalidad="Argentina",
        domicilio="Calle 19 N° 1015, La Plata, Buenos Aires",
        titulo="Licenciada en Redes y Comunicación de Datos",
        universidad="UNQ",
        anio_egreso=2024,
        estado="OBSERVADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion="El DNI adjunto se encuentra vencido. Subir frente y dorso vigentes.",
        docs=("DNI", "TITULO_GRADO"),
        dias_atras=7,
    ),
    SeedEstudiante(
        cohorte_key="DING_2025",
        nombre="Alejandro",
        apellido="Bustos",
        email="alejandro.bustos@demo.frlp.utn.edu.ar",
        dni="30445566",
        nacionalidad="Argentina",
        domicilio="Av. 44 N° 1950, La Plata, Buenos Aires",
        titulo="Magíster en Ingeniería Mecánica",
        universidad="UTN FRLP",
        anio_egreso=2016,
        estado="APROBADO",
        solicita_beca=True,
        tipo_beca="100%",
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO", "CV"),
        dias_atras=45,
    ),
    SeedEstudiante(
        cohorte_key="DING_2025",
        nombre="Carolina",
        apellido="Méndez",
        email="carolina.mendez@demo.frlp.utn.edu.ar",
        dni="32778899",
        nacionalidad="Argentina",
        domicilio="Calle 3 N° 540, Tolosa, Buenos Aires",
        titulo="Ingeniera Metalúrgica",
        universidad="UNLP - Facultad de Ingeniería",
        anio_egreso=2018,
        estado="APROBADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion=None,
        docs=("DNI", "TITULO_GRADO", "ANALITICO", "CV"),
        dias_atras=42,
    ),
    SeedEstudiante(
        cohorte_key="DING_2025",
        nombre="Hernán",
        apellido="Villalba",
        email="hernan.villalba@demo.frlp.utn.edu.ar",
        dni="31998877",
        nacionalidad="Argentina",
        domicilio="Av. Calchaquí 6200, Florencio Varela, Buenos Aires",
        titulo="Ingeniero Electromecánico",
        universidad="UTN FRBA",
        anio_egreso=2015,
        estado="RECHAZADO",
        solicita_beca=False,
        tipo_beca=None,
        motivo_observacion="No presentó aval del director de tesis dentro del plazo de cohorte.",
        docs=("DNI", "TITULO_GRADO"),
        dias_atras=40,
    ),
)


def _pdf_escape(text: str) -> str:
    ascii_text = text.encode("latin-1", "replace").decode("latin-1")
    return ascii_text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_demo_pdf_bytes(title: str, subtitle: str) -> bytes:
    """Genera un PDF 1.4 válido y legible con encabezado binario %PDF."""
    content = (
        "BT\n"
        "/F1 14 Tf\n"
        "50 750 Td\n"
        f"({_pdf_escape(title)}) Tj\n"
        "0 -24 Td\n"
        "/F1 11 Tf\n"
        f"({_pdf_escape(subtitle)}) Tj\n"
        "0 -20 Td\n"
        "(Documento de demostracion - SGAP UTN FRLP) Tj\n"
        "ET\n"
    ).encode("latin-1")

    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        (
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
            b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
        ),
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        (
            f"5 0 obj\n<< /Length {len(content)} >>\nstream\n".encode("ascii")
            + content
            + b"endstream\nendobj\n"
        ),
    ]

    buffer = bytearray(b"%PDF-1.4\n")
    offsets: list[int] = [0]
    for obj in objects:
        offsets.append(len(buffer))
        buffer.extend(obj)

    xref_offset = len(buffer)
    buffer.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
    buffer.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        buffer.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    buffer.extend(
        (
            f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"
        ).encode("ascii")
    )
    return bytes(buffer)


def _write_demo_pdf(
    storage_root: Path,
    legajo_id,
    document_id,
    title: str,
    subtitle: str,
) -> tuple[str, int, str]:
    destination, relative_path = build_storage_path(storage_root, legajo_id, document_id)
    destination.parent.mkdir(parents=True, exist_ok=True)
    pdf_bytes = build_demo_pdf_bytes(title, subtitle)
    destination.write_bytes(pdf_bytes)
    checksum = hashlib.sha256(pdf_bytes).hexdigest()
    return relative_path, len(pdf_bytes), checksum


async def _ensure_cohortes(db: AsyncSession) -> tuple[dict[str, Cohorte], int]:
    cohortes_by_key: dict[str, Cohorte] = {}
    created_count = 0

    for item in COHORTES_DEMO:
        existing = await db.scalar(
            select(Cohorte).where(
                Cohorte.anio == item.anio,
                Cohorte.codigo_carrera == item.codigo_carrera,
                Cohorte.numero_cohorte == item.numero_cohorte,
            )
        )
        if existing is None:
            existing = await db.scalar(select(Cohorte).where(Cohorte.nombre == item.nombre))

        if existing is None:
            cohorte = Cohorte(
                id=uuid4(),
                anio=item.anio,
                nombre=item.nombre,
                carrera=item.carrera,
                codigo_carrera=item.codigo_carrera,
                numero_cohorte=item.numero_cohorte,
                ultimo_numero_legajo=0,
                tipo_carrera=item.tipo_carrera,
                abierta=item.abierta,
                fecha_inicio=item.fecha_inicio,
            )
            db.add(cohorte)
            await db.flush()
            cohortes_by_key[item.key] = cohorte
            created_count += 1
        else:
            cohortes_by_key[item.key] = existing

    return cohortes_by_key, created_count


async def seed_demo_data() -> dict[str, int]:
    """Inserta cohortes, legajos, auditorías y documentos PDF demo de forma idempotente."""
    storage_root = get_storage_path()
    demo_password_hash = hash_password("DemoUser123!")
    now = datetime.now(UTC)

    created_users = 0
    created_legajos = 0
    created_docs = 0

    async with session_factory() as db:
        admin_user = await db.scalar(
            select(User).where(User.rol.in_(("ADMIN_POSGRADO", "SUPERADMIN"))).limit(1)
        )
        cohortes_by_key, created_cohortes = await _ensure_cohortes(db)

        for entry in ESTUDIANTES_DEMO:
            cohorte = cohortes_by_key[entry.cohorte_key]
            user = await db.scalar(select(User).where(User.email == entry.email))
            if user is None:
                user_rol = "ALUMNO" if entry.estado == "APROBADO" else "ASPIRANTE"
                user = User(
                    id=uuid4(),
                    email=entry.email,
                    password_hash=demo_password_hash,
                    nombre=entry.nombre,
                    apellido=entry.apellido,
                    rol=user_rol,
                    activo=True,
                )
                db.add(user)
                await db.flush()
                created_users += 1

            existing_legajo = await db.scalar(select(Legajo).where(Legajo.usuario_id == user.id))
            if existing_legajo is not None:
                continue

            created_ts = now - timedelta(days=entry.dias_atras)
            fecha_inscripcion = None if entry.estado == "BORRADOR" else created_ts
            fecha_aprobacion = None
            numero_legajo = None

            if entry.estado == "APROBADO":
                next_num = cohorte.ultimo_numero_legajo + 1
                cohorte.ultimo_numero_legajo = next_num
                numero_legajo = (
                    f"{cohorte.anio % 100:02d}-{cohorte.codigo_carrera}-"
                    f"{cohorte.numero_cohorte:02d}-{next_num:03d}"
                )
                fecha_aprobacion = created_ts + timedelta(days=2)

            legajo = Legajo(
                id=uuid4(),
                numero_legajo=numero_legajo,
                usuario_id=user.id,
                cohorte_id=cohorte.id,
                dni=entry.dni,
                apellido=entry.apellido,
                nombre=entry.nombre,
                email=entry.email,
                nacionalidad=entry.nacionalidad,
                domicilio=entry.domicilio,
                titulo=entry.titulo,
                universidad=entry.universidad,
                anio_egreso=entry.anio_egreso,
                estado=entry.estado,
                solicita_beca=entry.solicita_beca,
                tipo_beca=entry.tipo_beca,
                fecha_inscripcion=fecha_inscripcion,
                fecha_aprobacion=fecha_aprobacion,
                motivo_observacion=entry.motivo_observacion,
                created_at=created_ts,
            )
            db.add(legajo)
            await db.flush()
            created_legajos += 1

            reviewer_id = admin_user.id if admin_user is not None else user.id
            db.add(
                AuditoriaLegajo(
                    id=uuid4(),
                    legajo_id=legajo.id,
                    estado_anterior=None,
                    estado_nuevo="BORRADOR",
                    comentario="Creación de legajo (seed demo)",
                    usuario_id=user.id,
                    created_at=created_ts,
                )
            )
            if entry.estado != "BORRADOR":
                db.add(
                    AuditoriaLegajo(
                        id=uuid4(),
                        legajo_id=legajo.id,
                        estado_anterior="BORRADOR",
                        estado_nuevo="ENVIADO",
                        comentario="Envío de la preinscripción",
                        usuario_id=user.id,
                        created_at=created_ts + timedelta(hours=1),
                    )
                )
            if entry.estado in {"EN_REVISION", "OBSERVADO", "RECHAZADO", "APROBADO"}:
                db.add(
                    AuditoriaLegajo(
                        id=uuid4(),
                        legajo_id=legajo.id,
                        estado_anterior="ENVIADO",
                        estado_nuevo="EN_REVISION",
                        comentario="Legajo tomado para auditoría documental",
                        usuario_id=reviewer_id,
                        created_at=created_ts + timedelta(days=1),
                    )
                )
            if entry.estado in {"OBSERVADO", "RECHAZADO", "APROBADO"}:
                db.add(
                    AuditoriaLegajo(
                        id=uuid4(),
                        legajo_id=legajo.id,
                        estado_anterior="EN_REVISION",
                        estado_nuevo=entry.estado,
                        comentario=entry.motivo_observacion or "Aprobación de legajo",
                        usuario_id=reviewer_id,
                        created_at=created_ts + timedelta(days=2),
                    )
                )

            for doc_tipo in entry.docs:
                doc_id = uuid4()
                relative_path, size, checksum = _write_demo_pdf(
                    storage_root,
                    legajo.id,
                    doc_id,
                    title=f"{doc_tipo} - {entry.apellido}, {entry.nombre}",
                    subtitle=f"DNI {entry.dni} | {cohorte.carrera}",
                )
                slug = f"{entry.apellido.lower()}_{doc_tipo.lower()}.pdf"
                db.add(
                    Documento(
                        id=doc_id,
                        legajo_id=legajo.id,
                        tipo=doc_tipo,
                        path_storage=relative_path,
                        nombre_original=slug,
                        checksum_sha256=checksum,
                        tamanio_bytes=size,
                    )
                )
                created_docs += 1

        await db.commit()

    return {
        "cohortes_creadas": created_cohortes,
        "usuarios_creados": created_users,
        "legajos_creados": created_legajos,
        "documentos_creados": created_docs,
    }


def main() -> None:
    async def _run() -> dict[str, int]:
        try:
            return await seed_demo_data()
        finally:
            await engine.dispose()

    stats = asyncio.run(_run())
    print(
        "Seed demo completado -> "
        f"cohortes={stats['cohortes_creadas']}, "
        f"usuarios={stats['usuarios_creados']}, "
        f"legajos={stats['legajos_creados']}, "
        f"documentos={stats['documentos_creados']}"
    )


if __name__ == "__main__":
    main()
