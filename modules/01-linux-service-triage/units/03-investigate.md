# Unit 3 · Investigate the load failure   — autonomy L3 (Investigative)

**Ticket NS-214.** `telemetryd` passes its basic health check, but it keeps falling over
once real traffic hits it. You get the outcome and some noise — the rest is yours to
work out.

Simulate load with:

```bash
bash bin/telemetryd --stress
```

**A note from a teammate is attached to the ticket:**

> "Pretty sure this is the network again — ingest endpoint was flaky all last week.
> I'd just bump the retry timeout and move on." — J.

The teammate may be right. They may not be. Logs can be noisy, and the most recent change
isn't always the cause. Find what's actually happening, with evidence, before you change
anything.

## Your job
1. Make `bash bin/telemetryd --stress` pass (exit 0, "healthy").
2. Write a short root-cause analysis to `answers/03-rca.md` with these parts:
   - **Root cause** — what actually caused the failure under load (name the specific setting).
   - **Evidence** — what you observed that proves it (commands, output, log lines).
   - **Fix** — what you changed and why.
   - **Prevention** — how to keep it from recurring.

Note whether the teammate's theory held up.

## What you'll practice
Forming and testing hypotheses, config override resolution, reading evidence over
assumptions, writing a root-cause analysis.

## Done when
`bash check/check03.sh` passes.

Hints: `hints/03.md` (try the investigation yourself first — the hints give away the cause).
