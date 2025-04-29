"""Add openai_api_key and port columns to users table

Revision ID: 01add_openai_columns
Revises: 
Create Date: 2025-04-09

"""
from alembic import op
import sqlalchemy as sa # type: ignore


# revision identifiers, used by Alembic.
revision = '01add_openai_columns'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add openai_api_key column if it doesn't exist
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name = 'openai_api_key'
        ) THEN
            ALTER TABLE users ADD COLUMN openai_api_key TEXT NULL;
            RAISE NOTICE 'Added openai_api_key column to users table';
        ELSE
            RAISE NOTICE 'openai_api_key column already exists';
        END IF;
    END $$;
    """)
    
    # Add port column if it doesn't exist
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name = 'port'
        ) THEN
            ALTER TABLE users ADD COLUMN port TEXT NULL;
            RAISE NOTICE 'Added port column to users table';
        ELSE
            RAISE NOTICE 'port column already exists';
        END IF;
    END $$;
    """)


def downgrade() -> None:
    # Remove port column if it exists
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name = 'port'
        ) THEN
            ALTER TABLE users DROP COLUMN port;
            RAISE NOTICE 'Removed port column from users table';
        ELSE
            RAISE NOTICE 'port column does not exist';
        END IF;
    END $$;
    """)
    
    # Remove openai_api_key column if it exists
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name = 'openai_api_key'
        ) THEN
            ALTER TABLE users DROP COLUMN openai_api_key;
            RAISE NOTICE 'Removed openai_api_key column from users table';
        ELSE
            RAISE NOTICE 'openai_api_key column does not exist';
        END IF;
    END $$;
    """)
