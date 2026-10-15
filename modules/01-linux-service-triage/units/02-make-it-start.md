# Unit 2 · Make it start   — autonomy L2 (Assisted)

**Ticket NS-211.** Get `telemetryd` starting cleanly again. The goal is given; how you
get there is up to you.

## Your job
Make this command succeed (exit 0, "healthy"):

```bash
bash bin/telemetryd --check
```

Right now it fails. Run it, read the error it prints, fix the cause, and run it again.
There is more than one thing wrong — keep going until `--check` is fully healthy. The
agent validates its config values and refuses to load its signing key unless the key
file's permissions are safe.

> Everything here is simulated. `etc/telemetryd.key` is not a real secret.

## What you'll practice
Reading error output, editing config, Linux file permissions (`chmod`).

## Done when
`bash check/check02.sh` passes.

If you need to start over from the original broken state: `bash setup.sh`.

Hints: `hints/02.md`.
