# Module 01 · Linux Service Triage

You're an apprentice on Northstar's **Platform team**. The telemetry agent, `telemetryd`,
is down on `plt-ingest-3`. Over four tickets you'll read the system, bring it back,
investigate why it keeps failing under load, and write the incident up — moving from
guided steps to independent investigation.

This module is all shell work against a simulated service. Nothing is a real secret or a
real system. It assumes you've done the **Linux Fundamentals Lab** (grep, pipes, jq,
permissions).

## Start

```bash
bash setup.sh          # resets the scenario to its starting (broken) state
bash run-checks.sh     # grade your progress any time
```

Then work the units in order:

| # | Unit | Autonomy | What you practice |
|---|------|----------|-------------------|
| 1 | `units/01-read-the-system.md` | L1 · Guided | Read logs & config; report state |
| 2 | `units/02-make-it-start.md` | L2 · Assisted | Diagnose from errors; fix config & permissions |
| 3 | `units/03-investigate.md` | L3 · Investigative | Test hypotheses; find the real cause; write an RCA |
| — | `milestone/incident.md` | L3 · Integrative | Professional incident report |

Each unit has a brief (the ticket), escalating hints in `hints/`, and an auto-grader in
`check/`. Try the concept before the final hint — the reps are the point.

## The autonomy ladder in this module
Unit 1 tells you the exact commands. Unit 2 gives you the goal and lets you find the way.
Unit 3 gives you only a symptom and a *misleading* teammate theory, and expects you to
reach the cause with evidence. That ramp is deliberate.

## Competencies this module maps to
Ratings are earned from the reviewed work here and feed the competency record.

- **Linux service troubleshooting** — Units 1, 2
- **Evidence-based investigation** — Unit 3
- **Professional incident reporting** — Milestone

## Autograder vs. review
The checkers verify reproducible outcomes: the service is healthy, the facts are right,
the report has the required structure. They do **not** grade the *quality* of your
reasoning or writing — that's for mentor review, which is where the real feedback lives.
Passing the checks is necessary, not sufficient.

## Files
```
modules/01-linux-service-triage/
├── bin/telemetryd          # the simulated agent you triage
├── etc/                    # its config (telemetryd.conf + telemetryd.d/ overrides)
├── var/log/telemetryd.log  # historical incident log (read-only reference)
├── units/                  # the four tickets
├── hints/                  # escalating hints per unit
├── check/                  # the auto-graders
├── answers/                # you write your answers here
├── instructor/             # rubric + reference solutions (for reviewers)
├── setup.sh                # reset the scenario
└── run-checks.sh           # grade everything
```
