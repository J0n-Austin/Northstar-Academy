# Task 3 — List the degraded services

**Ticket NS-103.** The status endpoint dumped a JSON snapshot. The incident lead
wants just the names of the services that are **degraded** (not down, not healthy).

## Your job
From `scenario/service/status.json`, write the **names** of every service whose
`state` is `"degraded"`, **sorted alphabetically**, one per line, to `answers/03.txt`.

## What you'll practice
`jq` (querying and filtering JSON), `sort`.

## Done when
`answers/03.txt` lists the degraded service names, one per line, sorted.

```bash
bash check/check03.sh
```

Stuck? `hints/03.md`.
