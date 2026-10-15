# Stage 2 — Acceptance test checklist

Check these steps after cloning or pushing the repository. This checklist distinguishes automated acceptance from browser and workspace validation.

## 1. Automated release gate (Codespaces or Ubuntu)

```bash
npm run check
```

Expected:

- v2 curriculum schema valid: 3 tracks, 21 delivered modules, original 15 simulated modules, 2 live commercial workspace modules.
- 18/18 existing simulator suites green; no engine or browser lab data deleted.
- 4 real lab smoke scripts green (the two Stage 1 native labs and two Stage 2 commercial labs).
- Both generated standalone HTML pages created, and the exact Pages allowlist validated.
- HTTP test serves all 9 public routes and blocks 4 private source/instructor paths.
- Dependency-free UI logic verification checks commercial track filters and all four guided decisions (`npm run verify:ui`).

The new commercial starter *learner* tests **should fail** before repairs:

```bash
bash labs/commercial-api-security/run-checks.sh
bash labs/commercial-transaction-integrity/run-checks.sh
```

A green repository release check means all content is packaged and the training defects remain, NOT that the student solved them.

## 2. Pages UI acceptance (manual)

1. Home URL loads, with Stage 2 and links to **Curriculum explorer** and **Commercial security residency**.
2. Original **Northstar Academy** opens and all 15 stages/labs remain visible. Complete one original lab, refresh, and confirm its local browser progress persists.
3. Curriculum explorer reports **21 available modules** and **3 tracks**. Filtering Commercial returns **2 workspace modules**; filtering CNO returns zero delivered modules and displays a planned track description.
4. Use text search `sql` to find the account security module. Its prerequisite links/labels, `≈ 8 hours`, practice-only warning and workspace path appear.
5. Open the commercial residency page. Choose incorrect then correct answers in each of the four practice prompts; hints appear and the practice counter updates. Refresh to confirm it is a stateless demonstration (does not claim verified progress).
6. Navigate back through all relative links. Repeat on mobile-sized viewport, check keyboard-only navigation and legibility.
7. Confirm direct routes work when hosted under `https://OWNER.github.io/REPOSITORY/`, not just the domain root. This is especially important for GitHub Pages project sites.
8. Check **Actions**: verify then deploy green. If deployment fails, inspect permissions, Pages source, GitHub Actions availability and branch name `main`.

## 3. Real module functional acceptance

In Codespaces or local Ubuntu, **do not expose the deliberately vulnerable HTTP adapter beyond localhost**.

**COMM-101 / COMM-102**:

```bash
cd labs/commercial-api-security
python3 src/api.py --port 8080
# in another terminal:
curl -i -H 'X-Demo-User: alex' http://127.0.0.1:8080/api/v1/accounts/101
curl -i -H 'X-Demo-User: alex' http://127.0.0.1:8080/api/v1/accounts/202
```

Before patch, the second call incorrectly reveals blair's synthetic account (BOLA). After patch, it must return 404. Patch the unsafe query, then run `bash run-checks.sh`. The 11 learner tests should pass. Record your evidence.

**COMM-201 / COMM-202**:

```bash
cd labs/commercial-transaction-integrity
bash run-checks.sh
python3 src/cli.py --db /tmp/ns-demo-ledger-stage2.sqlite3
```

Before patch, idempotency and rollback tests fail. Implement atomic operations and idempotency using the existing `transfer_requests` table. The 9 learner tests should then pass. The test suite intentionally injects a failure mid-operation.

## 4. Security and publishing acceptance

- `_site` should have exactly **8 public HTML pages + .nojekyll** (not the source Python files or private instructor material).
- GitHub's public source browser can still show all source committed in the repo, even when those files are not deployed to Pages.
- Never use real identities, financial data, secrets, or production databases for the exercises.
- Neither browser decision checks nor visible unit tests should be represented as verified credentials.

## 5. Go/no-go for next stage

Proceed when Pages navigation is correct under the actual repository URL, the original simulator behaves as before, Codespaces launches, both new exercises reproduce their defects, and the learner instructions are clear to an outside tester. Record issues in GitHub Issues before expanding further.
