# Unit 1 · Read the system   — autonomy L1 (Guided)

**Ticket NS-210.** `telemetryd` on `plt-ingest-3` is down. Before anyone changes
anything, the on-call lead wants a clean read of the current state. Don't fix anything
yet — just report.

## Background
`telemetryd` is the Platform team's telemetry agent. It reads its configuration from
`etc/telemetryd.conf` (plus any overrides in `etc/telemetryd.d/`), validates its
environment, and reports health. You run it with:

```bash
bash bin/telemetryd --check
```

Its historical log is at `var/log/telemetryd.log`.

## Your job
Report three facts in `answers/01.txt`, as `key = value` lines:

```
failed_starts = <how many times the log shows the service failed to start>
latest_error  = <the error CODE on the most recent error line, e.g. E_SOMETHING>
endpoint      = <the endpoint the agent is configured to send to>
```

## What you'll practice
Reading logs and config, `grep`, counting, extracting a field.

## Done when
`bash check/check01.sh` passes.

Hints: `hints/01.md`.
