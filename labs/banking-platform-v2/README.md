# Northstar Banking Platform V2 — advanced local apprenticeship

A **real FastAPI + SQLAlchemy application**, with optional PostgreSQL via Docker Compose, versioned Alembic migrations, bearer-token sessions and synthetic banking records. The V2 codebase introduces more realistic maintenance surface than the original stdlib/SQLite residency; the original is preserved as Sprints 1–4, and this becomes the advanced continuation (Sprints 5–6).

**Local training only.** Do not host the application publicly or use real credentials, customers or financial information. Authentication is for instructional purposes, not production assurance. API docs should only be opened through a localhost/Codespaces private forwarded port. Bind `127.0.0.1` and keep ports private.

## Environment

From this directory in Codespaces / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
bash smoke-test.sh  # passes for infrastructure readiness
bash run-checks.sh  # fails on intentionally unfinished tickets
python -m alembic upgrade head
python -m service.api  # localhost:8766
```

Visit `http://127.0.0.1:8766/docs` **only on your private workstation**. Use `curl` or FastAPI `TestClient` to exercise HTTP contracts. The small `/health` response is public to localhost, while accounts and transfers require a bearer token.

### Optional PostgreSQL

```bash
docker compose up -d postgres
export NORTHSTAR_DATABASE_URL='postgresql+psycopg://northstar:local_demo_only@127.0.0.1:55432/northstar_training'
python -m alembic upgrade head
python -m service.api
```

The integration tests use isolated SQLite databases by default, so their passing results **do not prove PostgreSQL concurrency safety**. Add explicit Postgres integration tests for transaction-isolation claims.

## Ticket sequence

- **NS-B501:** inspect framework routing, authorization dependencies and credential lifecycle
- **NS-B502:** repair cross-customer account disclosure
- **NS-B503:** implement idempotent, atomic, concurrency-aware transfers
- **NS-B504:** implement scoped statement read model and pagination
- **NS-B505:** add allowlisted audit evidence and negative tests
- **NS-B506:** apply migrations, assess PostgreSQL tradeoffs and document release validation

Read `guides/01-*` through `03-*` and use `templates/pr-report.md`. The browser board is learner-reported; only actual test runs and human-reviewed code can establish proficiency.

## Assessment contract

Starter smoke checks pass. The `tests/test_contract.py` suite is **red by design** until the student implements the tickets. Do not change tests just to hide failures. Preserve the older `labs/banking-residency` project to study regression history. Independent grading infrastructure is not part of this release.
