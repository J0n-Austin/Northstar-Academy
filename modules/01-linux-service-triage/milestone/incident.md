# Milestone · Incident report   — autonomy L3 (Integrative)

**Ticket NS-220.** The `telemetryd` outage is resolved. Operations needs a written
incident report for the record and for the postmortem review. This is the part of the job
that turns a fix into something the team learns from.

## Prerequisite
The service must be fully healthy — both of these pass:

```bash
bash bin/telemetryd --check
bash bin/telemetryd --stress
```

(If you skipped ahead, finish Units 2 and 3 first.)

## Your job
Write the incident report to `answers/incident-report.md`. Use these five sections:

- **Summary** — what happened, in two or three sentences someone can grasp quickly.
- **Impact** — what was affected and for roughly how long.
- **Root cause** — the underlying causes. There were three distinct issues across the
  outage; cover them.
- **Resolution** — what you changed to restore service.
- **Prevention** — concrete steps to stop a recurrence.

Write it the way you'd want to read it at 2am: plain, specific, no blame. Reference the
tickets (NS-210, NS-211, NS-214) where relevant.

## What you'll practice
Synthesis across an investigation, professional incident communication.

## Done when
`bash check/check-milestone.sh` passes.

Hints: `hints/milestone.md`.
