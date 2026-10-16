# Sprint 5 · Persistent schemas and migrations

**Engineering question:** How can a team evolve a database without destroying existing records?

The `models.py` file declares domain tables using SQLAlchemy. Alembic's initial migration creates equivalent tables, with explicit constraints and foreign-key relationships. New fields should be added in compatible steps: an additive column, a data backfill, and only then stricter validation. For migrations applied to live datasets, rolling code back cannot automatically reverse money movement or destructive data updates.

## Repeatable exercises

Run `alembic upgrade head` on a fresh SQLite file. Use `alembic current` to verify the revision; then inspect the schema and compare it to model declarations. On a disposable database only, inspect `alembic downgrade base`. Explain which tables disappear, and why that command is inappropriate on a database containing important data.

**PostgreSQL option:** `docker compose up -d postgres`, set `NORTHSTAR_DATABASE_URL=postgresql+psycopg://northstar:local_demo_only@127.0.0.1:55432/northstar_training`, then run migrations again. This container is bound to loopback and uses deliberately disposable credentials.

## Edge cases

Two transaction requests may read a balance simultaneously. On PostgreSQL, investigate row-level locks (`SELECT ... FOR UPDATE`) and ensure rows are acquired in a deterministic order. SQLite's concurrency semantics differ; use the same business-invariant assertions but don't assume one engine's locking implementation applies to the other.

**Independent challenge:** Propose an additive migration for a transfer `status` field, write a test against existing rows, and include a realistic forward-fix plan.
