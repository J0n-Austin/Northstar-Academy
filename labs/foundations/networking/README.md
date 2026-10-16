# Networking — Real Engineering Workshop

Repair a length-prefixed framing protocol. A stream read may contain fewer bytes than requested; loop until the exact header and payload length are read or raise EOFError. Reject frames longer than max_bytes before allocating memory. Use network byte order and validate ports strictly.

## Workflow

1. Read the starter and predict the failed assertions.
2. Run `bash smoke-test.sh` for environment readiness.
3. Run `bash run-checks.sh`: assertions should fail on the intentionally broken starter.
4. Repair `starter.py`, add one additional meaningful edge-case test and rerun.
5. Record the exact commands, failure evidence, patch rationale and test output in your PR report.

**Only use synthetic inputs and localhost services.** Workstation tests are not synchronized with the public progress dashboard.
