# Linux — Real Engineering Workshop

Audit a failing child process without hiding its exit status, validate a private file mode, and reject missing required configuration. Use a subprocess argument list rather than a shell command string. Compare stdout and stderr separately, bound execution time and map subprocess.TimeoutExpired into TimeoutError.

## Workflow

1. Read the starter and predict the failed assertions.
2. Run `bash smoke-test.sh` for environment readiness.
3. Run `bash run-checks.sh`: assertions should fail on the intentionally broken starter.
4. Repair `starter.py`, add one additional meaningful edge-case test and rerun.
5. Record the exact commands, failure evidence, patch rationale and test output in your PR report.

**Only use synthetic inputs and localhost services.** Workstation tests are not synchronized with the public progress dashboard.
