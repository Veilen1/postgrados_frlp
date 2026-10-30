"""Restrict each user to one legajo.

Revision ID: 0002_legajo_one_per_user
Revises: 0001_refresh_sessions
Create Date: 2026-10-31
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002_legajo_one_per_user"
down_revision: str | None = "0001_refresh_sessions"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_constraints = {
        constraint["name"]
        for constraint in sa.inspect(bind).get_unique_constraints("legajos")
    }
    if "uq_legajo_usuario" in existing_constraints:
        return

    duplicate = bind.execute(
        sa.text(
            "SELECT usuario_id FROM legajos "
            "GROUP BY usuario_id HAVING COUNT(*) > 1 LIMIT 1"
        )
    ).first()
    if duplicate is not None:
        raise RuntimeError(
            "No se puede limitar a un legajo por usuario: existen usuarios con legajos duplicados. "
            "Revisá esos registros antes de volver a ejecutar la migración."
        )

    op.create_unique_constraint("uq_legajo_usuario", "legajos", ["usuario_id"])


def downgrade() -> None:
    existing_constraints = {
        constraint["name"]
        for constraint in sa.inspect(op.get_bind()).get_unique_constraints("legajos")
    }
    if "uq_legajo_usuario" in existing_constraints:
        op.drop_constraint("uq_legajo_usuario", "legajos", type_="unique")
