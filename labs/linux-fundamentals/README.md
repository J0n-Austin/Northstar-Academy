# Linux Fundamentals Lab

A hands-on starter lab for the Northstar apprenticeship. You're dropped into a slice of
the fictional company's logs and config, and you work four short tickets using the
everyday Linux tools engineers reach for: `grep`, pipes, `awk`/`sed`, `jq`, `sort`,
and file permissions. A checker tells you when each one is right.

Everything here is simulated. Nothing is a real secret or a real system.

## Start the environment

**Option A — GitHub Codespaces (nothing to install).**
Push this folder to a GitHub repo, click **Code ▸ Codespaces ▸ Create codespace**, and
wait for it to build. You land in a real Linux shell with the tools installed.

**Option B — Locally with Dev Containers.**
Open the folder in VS Code with the Dev Containers extension and choose
**Reopen in Container**.

**Option C — Any Linux shell.**
If you already have `bash`, `grep`, `jq`, and friends, just clone the repo and run:

```bash
bash setup.sh
```

## How it works

1. Read a ticket in `tasks/` (start with `tasks/01-find-errors.md`).
2. Work in the shell. Most tasks ask you to save an answer to `answers/NN.txt`;
   one asks you to change the system itself.
3. Check your work:

```bash
bash run-checks.sh          # run all four
bash check/check01.sh       # or just one
```

4. Stuck? Each task has escalating hints in `hints/` — concept first, then tactics,
   then the full command. Try the concept before the full answer; the point is the
   reps, not the score.

## The tickets

| # | Ticket | Skills |
|---|--------|--------|
| 1 | Count timeout errors across the logs | `grep`, pipes |
| 2 | Rank the top error codes in `app.log` | field extraction, `sort`, `uniq -c` |
| 3 | List the degraded services from a JSON snapshot | `jq`, `sort` |
| 4 | Fix an over-permissive key file | permissions, `chmod` |

## Reset

`bash setup.sh` returns the lab to its starting state at any time.

## What's in here

```
linux-fundamentals-lab/
├── .devcontainer/        # Codespaces / Dev Containers setup
├── scenario/             # the simulated company data
│   ├── logs/             #   app.log, auth.log, worker.log
│   ├── service/          #   status.json
│   └── secrets/          #   service.key (simulated)
├── tasks/                # the four tickets
├── hints/                # escalating hints per task
├── check/                # the graders
├── answers/              # you write your answers here
├── run-checks.sh         # grade everything
└── setup.sh              # reset the lab
```
