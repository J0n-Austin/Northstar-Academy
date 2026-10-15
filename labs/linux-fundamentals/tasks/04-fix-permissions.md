# Task 4 — Fix the key file permissions

**Ticket NS-104.** The telemetry service won't start. Its logs say it refuses to load
its signing key because the file is readable by other users.

## Your job
`scenario/secrets/service.key` currently has permissions that are too open. The service
requires it to be readable and writable **only by its owner** — mode **600**
(`-rw-------`). Fix the permissions.

> Nothing here is a real secret; the file is simulated for training.

## What you'll practice
`ls -l`, reading permission bits, `chmod`.

## Done when
`scenario/secrets/service.key` is mode `600`.

```bash
bash check/check04.sh
```

Stuck? `hints/04.md`.
