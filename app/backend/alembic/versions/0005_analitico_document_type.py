"""Allow analytic certificates as legajo documents.

Revision ID: 0005_analitico_document_type
Revises: 0004_legajo_applicant_profile
Create Date: 2026-11-17
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0005_analitico_document_type"
down_revision: str | None = "0004_legajo_applicant_profile"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_DOCUMENT_TYPES = (
    "tipo IN ('DNI', 'TITULO_GRADO', 'ANALITICO', 'PARTIDA', 'CUIT_CUIL', "
    "'FORM_INSCRIPCION', 'FORM_BECA', 'TITULO_POSGRADO', 'CV')"
)
_PREVIOUS_DOCUMENT_TYPES = (
    "tipo IN ('DNI', 'TITULO_GRADO', 'PARTIDA', 'CUIT_CUIL', "
    "'FORM_INSCRIPCION', 'FORM_BECA', 'TITULO_POSGRADO', 'CV')"
)


def upgrade() -> None:
    op.drop_constraint("tipo_doc_valido", "documentos", type_="check")
    op.create_check_constraint("tipo_doc_valido", "documentos", _DOCUMENT_TYPES)


def downgrade() -> None:
    op.drop_constraint("tipo_doc_valido", "documentos", type_="check")
    op.create_check_constraint(
        "tipo_doc_valido",
        "documentos",
        _PREVIOUS_DOCUMENT_TYPES,
    )
