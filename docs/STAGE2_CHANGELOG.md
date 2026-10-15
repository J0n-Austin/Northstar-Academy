# Stage 2 — Curriculum Architecture and Commercial Pilot

Date: 2026-10-15 · Artifact version: `1.2.0-stage2`

## Delivered

- `curriculum/catalog.v2.json`: single canonical **course inventory** with tracks, prerequisite DAG, status, audience, competencies, lab environment, estimates and public routes.
- `docs/curriculum.html`: generated data-driven track explorer with search, environment filters, prerequisites and clear practice-vs-verified warnings. Generation is offline and compatible with GitHub Pages project URLs.
- `docs/commercial-track.html`: browser-readable commercial residency briefing and four interactive decision checks. **Does not run or grade the Python labs.**
- `labs/commercial-api-security`: localhost-only synthetic account API (Python stdlib, HTTP and SQLite), two intentionally seeded security defects, 11 contract/HTTP tests, mentor evidence template.
- `labs/commercial-transaction-integrity`: synthetic transfer ledger and CLI, idempotency/atomicity defects, 9 contract tests including rollback/failure injection, evidence template.
- Full CI/test integration, explicit Pages allowlist expansion, local HTTP smoke and refreshed docs and home page.
- Original 15 browser simulations and four legacy workspace labs are retained. No change to existing emulator code, its progression state, or historical lab paths.

## Important limits

- **Stage 2 is a first substantial commercial pilot, not the full planned commercial pathway.** Backend frameworks, threat modeling, CI security, cloud IAM and authenticated applications remain future milestones.
- CI expects intentionally unfinished exercises. `bash run-checks.sh` in each new commercial lab **must initially fail**; the repository-level smoke tests verify that the defects exist and are reproducible. A green CI run does **not** mean the learner has completed the tasks.
- `X-Demo-User` is not authentication; these synthetic examples bind HTTP to loopback. The commercial code intentionally contains defects and is never published to GitHub Pages.
- Visible practice tests and browser checks are not protected grading. No employer credential, verified work history, real banking functionality, or user account system is implemented.
- Pages only hosts the allowlisted compiled HTML and does not execute Python. Use local Linux or GitHub Codespaces for real labs.
- Existing repo `curriculum/catalog.v1.json` remains as an audit/migration snapshot; `catalog.v2.json` is now the navigational source of truth.

## Release gate

- `npm run check` must pass on Node 20+/Python 3, GCC, Bash.
- The static curriculum browser page must reflect all available modules and public links. Planned modules must not masquerade as delivered.
- Legacy simulator tests must all pass unchanged.
- Commercial smoke tests must pass while their starter learner suites fail only on known seeded defects.
- The release's temporary **corrected copies** should pass all learner contract tests. Reference changes are not distributed in the public starter ZIP.

## Next implementation decision

After manual Pages acceptance, prioritize foundational backend exercises (Java/Spring Boot or Python framework), authenticated user flows, security-focused pull-request assessment, persistent progress architecture, and sandbox isolation. These are not included yet.
