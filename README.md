# Northstar Academy — Stage 4.2 Combined Curriculum Release

**What ships:** 72 interactive foundations lessons in 10 units, ten real Python/Linux workshops, a four-step diagnostic trace visualization, the original 15 browser labs, the initial 4-sprint banking residency, and a second 2-sprint advanced FastAPI service with six tickets. The public website remains a GitHub Pages static artifact; vulnerable learner code runs only in Codespaces/Linux on localhost. Browser progress is **unverified practice**.

**Upgrade existing repository:** extract this release and copy its inner contents into your Git checkout; preserve `.git`, and do not copy instructor-only packets. Then run `npm run check`, commit and push to `main`. The Actions workflow runs extra FastAPI smoke and Alembic migration checks using an isolated Python environment before publishing Pages.

**Local prerequisites:** Node 20+, Python 3.10+ and GCC for existing native C labs. The advanced service additionally requires Python dependencies from `labs/banking-platform-v2/requirements.txt` and optionally Docker Compose for PostgreSQL. The project is not production-ready and must never be exposed to a public network.

**Manual validation:** `docs/STAGE42_TESTING.md`.

---

# Stage 4.1 — Educational Depth & Foundations

The existing Stage 4 banking residency remains intact. **New:** 24 authored, prerequisite-aware foundation lessons in six units (Python, HTTP, SQL, Testing, Debugging, CS); six long technical guides; six independent, runnable Python workshops with 48 public behavioral checks; formative quizzes, interactive three-stage concept flows and saved learning reflections.

**Start here:** Open `app/northstar-academy.html#foundations` through GitHub Pages, complete the first Python unit, then run `labs/foundations/python/run-checks.sh` in Codespaces. As in the residency, learner fixtures are intentionally broken. `npm run check` validates the release and should pass; learner contract tests fail until students repair the code.

**Important:** Foundation lesson completions are open-book practice and self-reported. They do not establish coding competence. Independent skills require tests, commits, and real reviewers.

For the full acceptance walkthrough see `docs/STAGE41_TESTING.md`.

---

> **Stage 4 (v1.4): Connected Banking Engineering Residency.** See [Stage 4 testing](docs/STAGE4_TESTING.md). The Stage 3 portal and 15 original simulations remain available. Real coding runs in Codespaces or Linux; GitHub Pages remains static.

# Northstar Engineering Academy — Stage 3 Integrated Learner Portal

**Version:** `1.3.0-stage3` · **Website:** static GitHub Pages · **Native labs:** GitHub Codespaces / local Ubuntu · **Authentication and verified employer assessments:** not implemented.

Northstar is a simulated engineering workplace with a canonical curriculum, a ticket-driven browser portal, and **real workspace labs**. Stage 3 brings Commercial Software Security assignments directly into the same student portal as the original 15 simulations. The CNO track remains planned.

## Quick start

**Requirements:** Node.js 20+, Python 3, Bash, GCC, and standard Linux tooling. All current commercial labs use Python's standard library only; no pip requirements, third-party SaaS or cloud account is needed. GitHub Actions uses Node 22.

```bash
npm run check        # full release gate: curriculum + 18 simulator test suites + native smoke + build + Pages verification + HTTP smoke
npm run build        # rebuild generated academy, curriculum page and _site
python3 -m http.server 8000 --directory _site
# visit http://127.0.0.1:8000/
```

**Do not confuse smoke checks with learner completion:** the two new commercial exercises intentionally ship with defects. Running their full `run-checks.sh` initially produces failing assertions, and this is expected. `npm run check` verifies that the starter state is reproducible and that production build rules are sound.

## Stage 3 integrated learner experience

Open `app/northstar-academy.html` after `npm run build`, or use the GitHub Pages homepage. The app now has one student work queue, one curriculum/pathway browser, integrated commercial-security tickets and a local practice evidence record. Students can switch between Core, Commercial Security and planned CNO in the curriculum and between simulated tasks and real-workspace assignments in My Work.

The original 15 browser labs are unchanged. **New practice state is stored in the same browser only; it is not verified grading or secure evidence.** The real code labs still run separately in Codespaces/Ubuntu.

See [`docs/STAGE3_CHANGELOG.md`](docs/STAGE3_CHANGELOG.md) and [`docs/STAGE3_TESTING.md`](docs/STAGE3_TESTING.md).

## Stage 2 foundation (retained)

| Feature | What's real? | Location |
|---|---|---|
| Curriculum registry | Machine-validated JSON schema 2.0 with module prerequisites, competency codes, states, and track definitions | `curriculum/catalog.v2.json` |
| Browser curriculum explorer | Generated static HTML using the JSON source of truth; filter by specialization and environment | `docs/curriculum.html` |
| Commercial residency briefing | Interactive decision checks and assignment instructions. Not a real code grader | `docs/commercial-track.html` |
| Account-level security, COMM-101/102 | **Actual localhost HTTP server**, SQLite, ownership and unsafe SQL fixes, unit/integration tests | `labs/commercial-api-security/` |
| Transfer integrity, COMM-201/202 | **Actual SQLite transactions** and CLI, intentional idempotency and atomicity bugs, failure-injection tests | `labs/commercial-transaction-integrity/` |
| Preserved originals | Fifteen fully functional browser simulations and four real Linux workspace labs | `app/`, `labs/`, `modules/` |

Commercial pilots use synthetic customer/account data. The HTTP teaching stub identifies a **demo persona**, but it does not authenticate clients, so it must never be deployed as real banking software or exposed to public networks.

### Run the new practical labs

Open the repo with **Code → Codespaces → Create codespace on main** or use Ubuntu locally:

```bash
cd labs/commercial-api-security
bash run-checks.sh       # learner suite; expected failures until fixed
python3 src/api.py --port 8080
# in another terminal (localhost only):
curl -H 'X-Demo-User: alex' http://127.0.0.1:8080/api/v1/accounts/101

cd ../commercial-transaction-integrity
bash run-checks.sh       # learner suite; expected failures until fixed
python3 src/cli.py --db /tmp/ns-test-ledger.sqlite3
```

Each lab's README contains the ticket, success criteria, review rubric and evidence template. Learners should work on **branches**, then produce a PR containing the patch, regression results and evidence. No protected reference solutions are included in the repository.

## Build and hosted content boundaries

- `app/src/build.js` compiles the existing standalone browser academy without changing its emulator engine; `scripts/build-curriculum.js` compiles `docs/curriculum.html` from canonical JSON; `scripts/build-site.js` publishes a **strict allowlist** of HTML pages to `_site/`.
- GitHub Pages hosts only static UI. Running Python, grading changes securely, persisting a protected learning record and managing real user identities are **not** supported by Pages itself.
- The source GitHub repository may be public. All committed files, including visible tests and deliberately vulnerable examples, can be inspected by anyone; never commit secrets, instructor answer keys or employer-owned materials.
- Student progress inside the existing simulator remains local to that browser. The student portal now shows an integrated curriculum and a separate, explicitly unverified commercial practice record.
- `curriculum/catalog.v1.json` remains the historical Stage 1 snapshot. v2 is now authoritative for public navigation. CNO specialization is explicitly marked **planned**.

## Update your existing GitHub Pages repository

1. Back up or commit local edits, then extract the Stage 3 ZIP over your existing local repo root (keep `.git`). If you changed files since the Stage 2 ZIP, review the diff before replacing them.
2. On Ubuntu or Codespaces, run `npm run check` (or at minimum `npm run build` if you are only previewing).
3. Run `git status && git add -A && git commit -m "Stage 3: integrate commercial security" && git push origin main`.
4. Wait for GitHub Actions verification and deployment; confirm GitHub Pages source is set to **GitHub Actions**.
5. Open `https://j0n-austin.github.io/Northstar-Academy/` and select the integrated commercial entry point; follow [`docs/STAGE3_TESTING.md`](docs/STAGE3_TESTING.md).

**New repositories:** Initialize an empty repository only if you are not using the existing one. Do not run `git init` again in an existing repo.

## Documentation and planned work

- [`docs/STAGE2_CHANGELOG.md`](docs/STAGE2_CHANGELOG.md): completed scope, limitations, future priorities.
- [`docs/STAGE2_TESTING.md`](docs/STAGE2_TESTING.md): build, hosted site and native lab acceptance checklist.
- [`docs/TESTING.md`](docs/TESTING.md): Stage 1 simulator and native-lab checks, still relevant.
- [`docs/product-roadmap.md`](docs/product-roadmap.md): longer-term educational vision.
- [`docs/competency-evidence.md`](docs/competency-evidence.md): current evidence limitations.

**Future phase after acceptance:** full backend engineering foundations (likely Java/Spring Boot or Python framework), more authentic secure SDLC/CI security, an identity-aware application lab, competency evidence exports, and eventually sandboxed trusted grading. No credential, regulated apprenticeship status, placement guarantee, or employer verification is claimed in this pilot.
