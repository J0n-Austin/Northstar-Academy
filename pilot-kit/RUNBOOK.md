# Northstar Pilot Runbook — Phase 1

How to run the wizard-of-oz pilot end to end with a small group, and what it has to prove
before any further spend. This is the operational companion to the roadmap's Phase 1.

> Everything runs on tools that already exist — GitHub, a chat app, Codespaces — with
> humans playing the parts the platform doesn't have yet. No backend, no accounts, no
> billing.

## What this pilot must prove (the gate)
Phase 1 is a measurement exercise, not a launch. It passes when you can answer three
questions with real numbers:

1. **What does review cost?** Median reviewer minutes per submission. This decides whether
   the economics can ever work.
2. **Where do learners get stuck?** The specific units, tickets, and concepts that stall
   people — and whether the hints and coworker help unstick them.
3. **Do they stay?** Completion and retention through the course slice, without gimmicks.

If you can't answer these at the end, the pilot didn't do its job — fix the instrumentation,
not the conclusion.

## Scope
- **Learners:** 10–20. Recruit for the entry-learner profile you decided in Phase 0.
- **Content:** the existing slice — the Linux Fundamentals Lab, then Module 01 · Linux
  Service Triage (through the incident-report milestone). One coherent arc.
- **Duration:** ~4 weeks part-time (adjust to the profile). Keep it short enough to finish.
- **Not in scope:** offensive content, a real portal, payments, certificates.

## Who plays what (facilitators)
A pilot needs 2–4 people behind the curtain. One person can wear several hats for a small
cohort. Full voice/behaviour guides are in `personas/`.

| Role | Does | Played by |
|---|---|---|
| Pilot lead | Runs the cohort, owns the schedule and the measurement sheet | A founder |
| Mentor-reviewer | Reviews PRs and milestones, gives feedback, judges the milestone | A founder or hired reviewer — `personas/mentor-okafor.md` |
| Coworker voices | The ambient workplace: ticket updates, a repro script, a *wrong* theory | Anyone on the team — `personas/ops-bot.md`, `personas/oncall-lead.md` |
| Observer | Takes notes on where people stall; never helps | Anyone not reviewing |

The point of the coworker voices is realism and the L3 "noisy, sometimes-wrong input" the
module depends on. Keep them in character and clearly fictional.

## One-time setup checklist
- [ ] Create a **private GitHub org** (or a private repo per learner).
- [ ] Add the MVP repo as a **template repo**; give each learner their own copy (GitHub's
      "Use this template", or GitHub Classroom if you want it managed).
- [ ] Copy `templates/ticket-issue-form.yml` to `.github/ISSUE_TEMPLATE/` in the learner
      repo template so tickets are consistent.
- [ ] Turn on **Codespaces** for the org; confirm the root devcontainer builds and both
      labs' `run-checks.sh` pass in a fresh codespace.
- [ ] Set up a **chat space** (Slack or Discord): one channel per learner (or a shared
      channel), plus a private facilitators' channel.
- [ ] Create the **review log** from `measurement/review-log.csv` (Google Sheet or the CSV).
- [ ] Draft the **welcome message** from `templates/welcome-message.md`.
- [ ] Agree a **review SLA** (e.g. first review within 1 business day) and who covers it.
- [ ] Dry-run the whole thing yourself once, timing your own review of one submission.

## The learner journey (indicative, 4 weeks)
| Week | Learner does | Facilitators do |
|---|---|---|
| 0 · Onboarding | Accepts repo invite, opens a codespace, reads the welcome ticket | Send welcome; confirm everyone can run `run-checks.sh` |
| 1 | Linux Fundamentals Lab (4 tasks) | Light touch; answer blockers in character; log stuck points |
| 2 | Module 01 Units 1–2 (read, then fix the service) | First PR reviews; **log review minutes per submission** |
| 3 | Module 01 Unit 3 + milestone (investigate, incident report) | Review the RCA and report; run the milestone as a short live defense |
| 4 · Wrap | Exit survey; short retro | Compile the three numbers; hold the go/no-go |

## Facilitation policy
- **Reviews are the product.** Give real, specific feedback on reasoning and writing, not
  just "passed the checks." Use `templates/reviewer-feedback.md`.
- **Time every review.** Start a timer when you open a submission, stop when you post
  feedback. Log it immediately (`measurement/review-log.csv`). This is the single most
  important measurement.
- **Hints before answers.** Point learners to the unit's `hints/` ladder; don't hand over
  solutions. Note when someone needs the final hint — that's a stuck point.
- **Stay in character** for coworker messages, and keep the NS-214 "it's the network"
  theory *wrong* on purpose. The skill is reaching the real cause past the noise.
- **Don't rescue silently.** If someone is stuck, the observer logs it before anyone helps.

## Measurement
Log as you go — reconstructing it later doesn't work. See `measurement/metrics.md` for the
full list and the gate thresholds. The essentials:
- Every submission review → a row in `review-log.csv` (learner, unit, minutes, outcome, notes).
- Stuck points → a line in the observer notes (learner, where, what unblocked them).
- Completion → who finished each unit and the milestone.
- Exit survey → realism, difficulty, confidence, would-recommend.

## Go / no-go (end of pilot)
- [ ] Median review minutes per submission is known and written down.
- [ ] The top 3–5 stuck points are identified, with whether hints/coworkers resolved them.
- [ ] Completion and retention through the slice are known.
- [ ] Exit-survey signal on realism and difficulty is in hand.
- [ ] A clear call: the experience is worth continuing (proceed to Phase 2 planning), needs
      rework (iterate and re-pilot), or doesn't land (stop and rethink).

## Risks during the pilot
- **Review backlog** → learners stall waiting. Cap cohort size to what your reviewers can
  turn around within the SLA.
- **Facilitators break character or over-help** → you stop measuring real difficulty. Brief
  everyone on the personas first.
- **Codespaces quota/cost** → monitor usage; local devcontainers are the fallback.
- **Measuring vibes, not cost** → if review minutes aren't logged, the pilot failed its main
  job regardless of how it felt.
