# Stage 1 implementation record

## Shipped in this release

- Corrected GitHub Pages packaging: static allowlisted build now includes the interactive academy and lab instructions, not just mockups.
- GitHub Actions verifies original simulation tests, curriculum inventory and real-workspace smoke checks before deploying.
- Added root `npm run check` release gate and an auditable `_site` allowlist/link verifier.
- Added versioned curriculum metadata (inventory, not yet the simulator's runtime source of truth).
- Added `CORE-C01` native C parser exercise with real compiler, source-visible unit tests, optional sanitizers, and practice evidence template.
- Added `CORE-NET01` POSIX sockets exercise with real loopback TCP client/server, deterministic-ish fragmented-message test, and practice evidence template.
- Extended Codespaces devcontainer for GCC/Clang/GDB and shell prerequisites.
- Documented the difference between simulated browser work and authentic Linux execution.
- Removed sample instructor solution notes from the upload-ready student repository and kept them in a separate private handoff artifact.

## Explicitly deferred

- Login, durable cross-device accounts, progress synchronization, secure hidden grading, private scenario delivery, per-learner isolated runtime provisioning, billing, employers, and verified credentials. GitHub Pages cannot provide these without separate services.
- Full commercial and CNO curricula; Stage 1 builds their shared technical infrastructure first.
- Headless browser UI testing in CI: the existing Playwright test depends on an unpublished test environment and a hardcoded browser path; original simulator engine tests still run.

## Release verification

Run `npm run check`; it exercises catalog, 18 simulator regression suites, real lab smoke checks, and the exact Pages publishing artifact and local HTTP routes.

Expected learning-mode behavior: `bash labs/native-c-engineering/run-checks.sh` and `bash labs/posix-protocol/run-checks.sh` **fail on starter bugs**, by design. Fixing the code makes them pass. CI runs separate smoke tests to avoid failing the entire repository because training exercises are incomplete.

## Next release candidates

1. CI browser smoke tests against the assembled `_site` using a pinned compatible Playwright/browser version.
2. External learner pilot on the two real labs; measure environment failures, mentor review time and ability to complete independently.
3. Wire the versioned catalog into the UI and create a shared assessment schema.
4. Begin commercial secure-backend residency while expanding native C/GDB and socket labs.
5. Add remote execution/authentication only once a real pilot demands it.
