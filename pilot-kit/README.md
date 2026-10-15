# Northstar Pilot Kit (Phase 1)

Everything a coordinator needs to run the wizard-of-oz pilot. Drop this folder into the repo
root (next to `labs/`, `modules/`, `mockups/`).

## Start here
`RUNBOOK.md` — the full plan: what the pilot must prove, who plays what, the one-time setup
checklist, the week-by-week journey, facilitation policy, and the go/no-go gate.

## What's in the kit
```
pilot-kit/
├── RUNBOOK.md                       # the operational plan — read first
├── personas/                        # voice guides for the people behind the curtain
│   ├── mentor-okafor.md             #   the reviewer (the most important voice)
│   ├── ops-bot.md                   #   terse automated ops updates
│   └── oncall-lead.md               #   the teammate whose theory is sometimes wrong
├── templates/
│   ├── ticket-issue-form.yml        # → copy to .github/ISSUE_TEMPLATE/ticket.yml
│   ├── pull-request-template.md     # → copy to .github/pull_request_template.md
│   ├── welcome-message.md           #   day-0 onboarding message
│   └── reviewer-feedback.md         #   use on every review (and log the minutes)
└── measurement/
    ├── review-log.csv               # the review-time log (the key measurement)
    └── metrics.md                   # what to track + the gate thresholds
```

## Two files go to the repo root, not inside pilot-kit
- `templates/ticket-issue-form.yml` → `.github/ISSUE_TEMPLATE/ticket.yml`
- `templates/pull-request-template.md` → `.github/pull_request_template.md`

Copy them into the **learner repo template** so every learner's repo has consistent tickets
and PRs.

## The one rule that matters most
Measure review time from the first submission. If the review-minutes column in
`review-log.csv` is empty at the end, the pilot missed its main job — the whole point of
Phase 1 is learning what review costs before anyone commits to a price.
