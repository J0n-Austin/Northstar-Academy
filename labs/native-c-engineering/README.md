# CORE-C01 — Native C frame parser

**Status:** real Linux/GCC exercise · **level:** guided → independent · **assessment:** practice only.

## The incident
A new telemetry agent sends compact binary sensor frames. The receiving service sometimes records nonsensical readings and accepts frames that contain more bytes than specified. Your job is to diagnose and patch the decoder **without** changing the published function signature or weakening input validation.

## Contract
See `src/frame.h`. The data format is: `version (1 byte, value 1) | flags (1 byte, 0..1) | reading (2 bytes, signed big-endian) | label_length (1 byte) | label (1..15 lowercase ASCII letters or '-')`. A valid frame has **exactly** five header bytes plus the stated label length; nothing may trail it. Return `-1` on malformed input and leave the caller's output structure unchanged on failure.

## Tasks
1. Inspect and reproduce the defective behavior using the real GCC test executable.
2. Identify the root cause; correct the parser in `src/frame.c`.
3. Run the full tests, then build with `SANITIZE=1 bash run-checks.sh` to check for runtime memory/UB issues.
4. Write `evidence.md`: reproduction, change summary, test output, unexpected results, and one new test you'd recommend.
5. Open a GitHub PR with the fix and request review; explain how it differs from the browser's simulated C exercise.

```bash
cd labs/native-c-engineering
bash run-checks.sh             # expected to FAIL before your fix
SANITIZE=1 bash run-checks.sh
```

**Hint ladder:** Check byte order first; check what counts as a full frame. `man 3 memcpy` is not needed to understand network endianness. Do not copy solutions from elsewhere.

**Rubric (practice):** protocol conformance 40%; safe bounds/validation 25%; tests 20%; investigation notes 15%. Passing source-visible tests is not an independently verified credential.
