"""add_shelf_and_case_columns

Revision ID: f33afd1e32f2
Revises: 01add_openai_columns
Create Date: 2025-04-14 15:18:02.924222

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f33afd1e32f2'
down_revision = '01add_openai_columns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add shelf and case columns to collection_items table
    op.add_column('collection_items', sa.Column('shelf', sa.String(), nullable=True))
    op.add_column('collection_items', sa.Column('case', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove shelf and case columns from collection_items table
    op.drop_column('collection_items', 'case')
    op.drop_column('collection_items', 'shelf')
