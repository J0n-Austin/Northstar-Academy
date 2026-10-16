# Stage 4.2 — Release and browser acceptance

## Static build

From the repository root run `npm run check`. The source of truth remains `curriculum/foundations.v1.json`, `catalog.v2.json`, `banking.residency.json`, and `banking.v2.json`. The GitHub Pages allowlist must continue excluding source code, training fixtures, private solutions, tokens and server code.

## Browser verification

1. Open GitHub Pages at `app/northstar-academy.html#foundations`. Confirm ten foundation units and 72 lessons.
2. Enter a new lesson under Linux or Networking. Inspect the worked example, use the four-step diagnostic trace, answer the formative check, add a substantive note and advance to the next prerequisite. Confirm persistence after refresh.
3. Visit the existing 4-sprint banking residency. Confirm all eight original tickets still exist.
4. Open **Advanced banking V2** from the sidebar or commercial pathway. Confirm six new tickets across Sprints 5 and 6. Open NS-B502, save a draft, refresh, submit for simulated feedback, and confirm that incomplete submissions request revision.
5. Open an original Linux Fundamentals simulator and complete a command. Check that mobile layout shows no horizontal clipping.
6. Open `#map`, choose Commercial, and confirm Advanced Banking V2 links into the integrated board. Switch to Core and verify new foundation modules appear. CNO specialization must still be marked planned.

## Native exercise verification

All ten `labs/foundations/*/smoke-test.sh` checks should pass. Individual `run-checks.sh` suites start red until repaired. Avoid changing hidden/build tests to mask expected learner failures.

For Banking V2: create a virtualenv in `labs/banking-platform-v2`, install `requirements.txt`, run `bash smoke-test.sh` (green), then `bash run-checks.sh` (four initial learner failures on authorization, replay, statements and audit; one contract passes). Run `python -m alembic upgrade head` against a **disposable** database; the migration should succeed. Optional PostgreSQL uses `docker compose up -d postgres` with a loopback-only port. Do not deploy vulnerable code or publicize authentication tokens.

## Acceptance gate

Do not advance without a green build, original simulator regressions, static publishing checks, native smoke tests, and manual browser navigation/progress checks. No student proficiency or employer assessment is independently verified in this release.
