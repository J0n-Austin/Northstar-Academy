# Architecture — Real Engineering Workshop

Repair domain policies independently of transport code. Ensure authorization follows the stored owner, use exact positive integer cents, construct audit entries from an allowlist, and reject incomplete release approvals. A policy function must not mutate caller-owned state.

## Workflow

1. Read the starter and predict the failed assertions.
2. Run `bash smoke-test.sh` for environment readiness.
3. Run `bash run-checks.sh`: assertions should fail on the intentionally broken starter.
4. Repair `starter.py`, add one additional meaningful edge-case test and rerun.
5. Record the exact commands, failure evidence, patch rationale and test output in your PR report.

**Only use synthetic inputs and localhost services.** Workstation tests are not synchronized with the public progress dashboard.
