"""Persist applicant personal and academic profile fields.

Revision ID: 0004_legajo_applicant_profile
Revises: 0003_descriptive_legajo_numbers
Create Date: 2026-11-17
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004_legajo_applicant_profile"
down_revision: str | None = "0003_descriptive_legajo_numbers"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("legajos", sa.Column("nacionalidad", sa.String(length=100), nullable=True))
    op.add_column("legajos", sa.Column("domicilio", sa.String(length=255), nullable=True))
    op.add_column("legajos", sa.Column("titulo", sa.String(length=255), nullable=True))
    op.add_column("legajos", sa.Column("universidad", sa.String(length=255), nullable=True))
    op.add_column("legajos", sa.Column("anio_egreso", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("legajos", "anio_egreso")
    op.drop_column("legajos", "universidad")
    op.drop_column("legajos", "titulo")
    op.drop_column("legajos", "domicilio")
    op.drop_column("legajos", "nacionalidad")
