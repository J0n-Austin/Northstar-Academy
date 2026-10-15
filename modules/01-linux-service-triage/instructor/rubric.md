# Module 01 — Reviewer rubric

The auto-grader confirms the outcome. Review judges the **reasoning, evidence, and
communication** the grader can't see. Spend review time on Units 3 and the milestone;
Units 1–2 are largely self-checking.

## What the autograder covers (don't re-grade)
- Unit 1: the three reported facts are correct.
- Unit 2: `telemetryd --check` is healthy.
- Unit 3: `telemetryd --stress` is healthy **and** the RCA has the required parts and names the real setting.
- Milestone: both checks healthy **and** the report has five sections covering ≥2 of 3 causes.

## What review adds (per autonomy level)

**Unit 2 (L2) — approach.** Did they fix causes or guess? Did they read the error output,
or change things at random until it worked? A learner who flailed but passed still needs
feedback.

**Unit 3 (L3) — judgment. This is the core of the module.**
- Did they test the teammate's network theory and *rule it out with evidence*, or ignore it?
- Is the root cause supported by observation (commands, log lines), not assertion?
- Did they find the override in `telemetryd.d/` themselves, or only after the final hint?
- Is the fix minimal and correct (remove/correct the override), not a workaround that masks it?

**Milestone (L3) — communication.**
- Is the Summary readable by a non-expert in 20 seconds?
- Is it blame-free and specific?
- Does Prevention propose something real (e.g. review overrides, alert on dropped events,
  validate `max_batch` range at load) rather than "be more careful"?

## Suggested competency ratings from this module
| Competency | Evidence | Typical rating after clean completion |
|---|---|---|
| Linux service troubleshooting | Units 1–2 | Assisted → Independent |
| Evidence-based investigation | Unit 3 | Developing → Assisted |
| Professional incident reporting | Milestone | Developing → Assisted |

Ratings are the reviewer's call, linked to the specific artifacts. One clean run is rarely
"Independent" on its own — look for the skill repeating across modules.

## Red flags
- RCA or report that reads as AI-generated boilerplate with no specifics from *this*
  scenario (no real log lines, no real settings). Ask them to walk through it live.
- `--stress` passing because they raised the safe limit in `bin/telemetryd` rather than
  fixing the config. Check what they actually changed.
