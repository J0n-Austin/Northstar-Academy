"""Initial synthetic bank schema.
Revision ID: 0001_initial
Revises:
"""
from alembic import op
import sqlalchemy as sa
revision='0001_initial'
down_revision=None
branch_labels=None
depends_on=None

def upgrade():
    op.create_table('users',sa.Column('id',sa.Integer(),primary_key=True),sa.Column('username',sa.String(80),nullable=False),sa.Column('password_digest',sa.String(220),nullable=False),sa.UniqueConstraint('username'))
    op.create_table('tokens',sa.Column('id',sa.Integer(),primary_key=True),sa.Column('user_id',sa.Integer(),sa.ForeignKey('users.id'),nullable=False),sa.Column('digest',sa.String(64),nullable=False),sa.Column('expires_at',sa.Integer(),nullable=False),sa.UniqueConstraint('digest'))
    op.create_table('accounts',sa.Column('id',sa.Integer(),primary_key=True),sa.Column('user_id',sa.Integer(),sa.ForeignKey('users.id'),nullable=False),sa.Column('label',sa.String(100),nullable=False),sa.Column('balance_cents',sa.Integer(),nullable=False))
    op.create_table('transfers',sa.Column('id',sa.Integer(),primary_key=True),sa.Column('user_id',sa.Integer(),sa.ForeignKey('users.id'),nullable=False),sa.Column('source_id',sa.Integer(),sa.ForeignKey('accounts.id'),nullable=False),sa.Column('destination_id',sa.Integer(),sa.ForeignKey('accounts.id'),nullable=False),sa.Column('amount_cents',sa.Integer(),nullable=False),sa.Column('request_key',sa.String(120),nullable=False),sa.UniqueConstraint('user_id','request_key',name='uq_transfer_user_request'))
    op.create_table('audit_events',sa.Column('id',sa.Integer(),primary_key=True),sa.Column('user_id',sa.Integer(),nullable=False),sa.Column('operation',sa.String(50),nullable=False),sa.Column('outcome',sa.String(30),nullable=False))

def downgrade():
    for table in ('audit_events','transfers','accounts','tokens','users'):op.drop_table(table)
