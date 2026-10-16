# Data-Structures — Real Engineering Workshop

Implement membership tracking with a set, detect cycles in a directed prerequisite graph, and produce a valid topological order. Validate missing dependencies rather than silently dropping them. Sort jobs by priority while maintaining the original order for ties; explain runtime and memory complexity.

## Workflow

1. Read the starter and predict the failed assertions.
2. Run `bash smoke-test.sh` for environment readiness.
3. Run `bash run-checks.sh`: assertions should fail on the intentionally broken starter.
4. Repair `starter.py`, add one additional meaningful edge-case test and rerun.
5. Record the exact commands, failure evidence, patch rationale and test output in your PR report.

**Only use synthetic inputs and localhost services.** Workstation tests are not synchronized with the public progress dashboard.
