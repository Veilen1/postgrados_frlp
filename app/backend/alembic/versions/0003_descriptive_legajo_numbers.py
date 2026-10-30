"""Add descriptive identifiers and per-cohort student numbering.

Revision ID: 0003_descriptive_legajo_numbers
Revises: 0002_legajo_one_per_user
Create Date: 2026-10-30
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003_descriptive_legajo_numbers"
down_revision: str | None = "0002_legajo_one_per_user"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SEED_COHORT_ID = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"


def upgrade() -> None:
    op.add_column("cohortes", sa.Column("codigo_carrera", sa.String(length=4), nullable=True))
    op.add_column("cohortes", sa.Column("numero_cohorte", sa.Integer(), nullable=True))
    op.add_column(
        "cohortes",
        sa.Column(
            "ultimo_numero_legajo",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "codigo_carrera_formato",
        "cohortes",
        "codigo_carrera IS NULL OR "
        "(length(codigo_carrera) = 4 AND codigo_carrera = upper(codigo_carrera))",
    )
    op.create_check_constraint(
        "identificador_cohorte_completo",
        "cohortes",
        "(codigo_carrera IS NULL AND numero_cohorte IS NULL) OR "
        "(codigo_carrera IS NOT NULL AND numero_cohorte IS NOT NULL)",
    )
    op.create_check_constraint(
        "numero_cohorte_rango",
        "cohortes",
        "numero_cohorte IS NULL OR numero_cohorte BETWEEN 1 AND 99",
    )
    op.create_check_constraint(
        "ultimo_numero_legajo_no_negativo",
        "cohortes",
        "ultimo_numero_legajo >= 0",
    )

    bind = op.get_bind()
    bind.execute(
        sa.text(
            "UPDATE cohortes "
            "SET codigo_carrera = 'MISI', numero_cohorte = 1 "
            "WHERE id = :cohort_id "
            "AND anio = 2026 "
            "AND carrera = 'Maestría en Ingeniería en Sistemas de Información' "
            "AND codigo_carrera IS NULL "
            "AND numero_cohorte IS NULL"
        ),
        {"cohort_id": SEED_COHORT_ID},
    )

    legacy_counters = bind.execute(
        sa.text(
            """
            SELECT cohorte_id,
                   MAX(
                       CASE
                           WHEN numero_legajo ~ '^[0-9]{2}-[0-9]{3}-[0-9]{3}$'
                           THEN substring(numero_legajo from '([0-9]{3})$')::INTEGER
                           WHEN numero_legajo ~ '^[0-9]{2}-[A-Z0-9]{4}-[0-9]{2}-[0-9]{3}$'
                           THEN substring(numero_legajo from '([0-9]{3})$')::INTEGER
                           ELSE 0
                       END
                   ) AS max_serial,
                   COUNT(*) FILTER (WHERE estado = 'APROBADO') AS approved_count
            FROM legajos
            GROUP BY cohorte_id
            """
        )
    ).all()
    for row in legacy_counters:
        counter = max(row.max_serial or 0, row.approved_count or 0)
        bind.execute(
            sa.text("UPDATE cohortes SET ultimo_numero_legajo = :counter WHERE id = :cohort_id"),
            {"counter": counter, "cohort_id": row.cohorte_id},
        )

    op.create_unique_constraint(
        "uq_cohortes_identificador_anual",
        "cohortes",
        ["anio", "codigo_carrera", "numero_cohorte"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_cohortes_identificador_anual", "cohortes", type_="unique")
    op.drop_constraint(
        "ultimo_numero_legajo_no_negativo",
        "cohortes",
        type_="check",
    )
    op.drop_constraint("numero_cohorte_rango", "cohortes", type_="check")
    op.drop_constraint("identificador_cohorte_completo", "cohortes", type_="check")
    op.drop_constraint("codigo_carrera_formato", "cohortes", type_="check")
    op.drop_column("cohortes", "ultimo_numero_legajo")
    op.drop_column("cohortes", "numero_cohorte")
    op.drop_column("cohortes", "codigo_carrera")
