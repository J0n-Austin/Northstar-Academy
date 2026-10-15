# Northstar Academy — the working demo app

A single self-contained web app that makes the core learning loop real: onboarding →
a portal with a live ticket queue and activity feed → open a ticket → do the work in a
**simulated in-browser terminal** → tasks check themselves → **open a pull request → mentor
review → merge** → progress, the activity feed, and an evidence-linked competency
transcript all update across the app. Fifteen labs across six curriculum stages (including an
ambiguous open ticket and an integrated capstone), a curriculum map, and a company wiki.
No backend, no accounts; state is saved in the browser.

## Files
- `northstar-academy.html` — **the product.** Open it in any browser.
- `northstar-interactive-lab.html` — the standalone single-lab version (Linux Fundamentals
  only), if you want just the terminal widget.
- `src/` — the source the pages are built from:
  - `engine.js` — the shell emulator over an in-memory filesystem: navigation
    (`cd`/`ls`/`pwd` with a live prompt, `~` and absolute paths, real directories,
    `mkdir`/`touch`/`cp`/`mv`/`rm`), text tools (`grep`, pipes, `sort`, `uniq`, `cut`,
    `sed`/`-i`, `awk`, `jq`, `wc`, `head`/`tail`), `chmod` (octal + symbolic), input/output
    redirection, **tab completion**, and an `edit`/`nano` hook for the file editor.
  - `engine2.js` — service triage pack: the `telemetryd` service, config + `conf.d`
    overrides, `--check`/`--stress` validation.
  - `engine3.js` — networking pack: a DNS/hosts resolver, a listening auth service, the
    gateway config, and `dig`/`ss`/`curl`/`gateway` over one shared model.
  - `engine4.js` — scripting & automation pack: a small bash interpreter (variables,
    `$1`/`$#`/`$@`, `${}`, `$( )`, `for … in … do … done`), `bash`/`sh`, `./script.sh`
    execution, and `crontab -l`/`-e`.
  - `cinterp.js` + `engine5.js` — the C programming lab: a genuine small C interpreter
    (functions, int/char/`const char *`, loops, `if`, array indexing, char arithmetic,
    logical ops, runtime traps for out-of-bounds / divide-by-zero / infinite loops) and a
    lab pack with `gcc`/`make test` that runs the learner's functions against in-browser hidden exercise inputs (visible in distributed source).
  - `engine6.js` — Windows internals pack: a static, simulated range (process tree, handle
    tables, PE headers, tokens) with `tasklist`/`handle`/`pe`/`token`. Read-and-reason; no
    code executes.
  - `engine7.js` — detection engineering pack: a rule evaluator (field match, group_by +
    threshold, `followed_by` correlation) over a labeled auth-event log, graded against the
    visible log and a hidden second log.
  - `engine8.js` — code review pack: three teammate PRs (`pr list/show/test`). Whether a PR
    should be approved is decided by running its code through the C interpreter, not an answer key.
  - `engine9.js` — Linux internals pack: a read-only host (`ps` with STAT, `lsof`, `procstat`,
    `df`, `du`, `mounts`) with a deleted-but-open log filling the disk, zombie processes, and an
    unexpected listener to hand off.
  - `engine10.js` — secure coding pack: harden `netparse.c` (bounds, ranges, length clamping)
    against adversarial tests with an out-of-bounds sanitizer. Defensive only.
  - `engine11.js` — incident analysis pack: metrics/changes/alerts/chat evidence, an impact
    window and root-cause change graded against the data, and a blameless postmortem
    (`postmortem-lint` for structure).
  - `engine12.js` — capstone: one environment combining the network, C and detection packs with
    an incident report that must contain facts only the learner's investigation reveals.
  - `engine13.js` — sockets & protocols pack: NSP/1, a length-prefixed protocol over a
    simulated TCP server (`nc`), C framing code tested against split headers, coalesced
    frames and stale receive buffers, and an `nsp-client` harness with hidden segmentations.
  - `engine14.js` — debugging pack: a regression to reproduce with a failing test, a simulated
    git (`log`/`show`/`diff`/`checkout`/`commit`/`bisect`, including `bisect run`), and a
    `trace` line-stepper built on the interpreter's trace hook.
  - `engine15.js` — ambiguous ticket pack: a vague stakeholder ticket with real and imagined
    problems; the dashboard, `ps` and page load are computed from the live config.
  - `app.template.html` — the UI; `build.js` injects `cinterp.js` and every `engineN.js`.
  - `test*.js` — Node unit tests (one per pack, plus `test_cinterp.js` for the C
    interpreter, `test_nav.js`, `test_edit.js`). `ui_test.js` drives the built page in a
    headless browser.

## Run the tests
```bash
cd src
node test.js       # base shell            (14 checks)
node test2.js      # service triage path   (12 checks)
node test3.js      # networking path       (13 checks)
node test4.js      # scripting/automation  (19 checks, incl. cheat-resistance)
node test5.js      # C lab pack            (18 checks, incl. cheat-resistance)
node test6.js      # Windows internals     (14 checks)
node test7.js      # detection engineering (19 checks, incl. cheat-resistance)
node test8.js      # code review           (16 checks)
node test9.js      # Linux internals       (17 checks)
node test10.js     # secure coding         (17 checks, incl. cheat-resistance)
node test11.js     # incident analysis     (19 checks)
node test12.js     # capstone              (20 checks)
node test13.js     # sockets & protocols   (34 checks, incl. hidden segmentations)
node test14.js     # debugging & bisect    (34 checks)
node test15.js     # ambiguous ticket      (30 checks)
node test_cinterp.js # C interpreter        (32 checks)
node test_nav.js   # navigation & paths    (59 checks)
node test_edit.js  # file editor contract  (18 checks)
```
Green is required before shipping a change — they verify the intended solution for every
task (and sensible variants) actually passes the auto-checker, and that hardcoded answers
fail the scripting task.

## Rebuild / verify the app
```bash
cd src
node build.js      # injects engine*.js into app.template.html -> ../northstar-academy.html, syntax-checks every script
node ui_test.js    # headless browser walk-through of every lab + portal/map/wiki/transcript (135 checks) (needs Chromium)
```

## What's real vs. simulated
- **Real:** the terminal runs your actual commands against real scenario data; the checkers
  grade real filesystem state (a written answer file, a changed permission, a healthy
  service, a script that generalizes to a second log); competencies and the activity feed
  are derived from that live state. All intended solutions are unit-tested.
- **Simulated:** the shell is a JS emulator, not Linux. It covers what these labs need plus
  common variants, not every flag. Authentic full-tool work still happens in Codespaces —
  this app is the zero-setup on-ramp.


> Important: the browser simulator is not a Linux shell, native compiler, trusted assessment, real pull request, or authenticated employer record. See `../docs/real-labs.html` and the root README for authentic Codespaces labs.
