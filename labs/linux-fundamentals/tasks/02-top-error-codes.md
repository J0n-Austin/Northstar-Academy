# Task 2 — Rank the error codes

**Ticket NS-102.** The on-call engineer wants to know which error codes dominate
`app.log` so they know what to fix first.

## Your job
In `scenario/logs/app.log`, every ERROR line ends with a code like `code=E500`.
Find the **top 3 most frequent** error codes. Write them to `answers/02.txt`, one per
line, **highest count first**, in the format:

```
CODE COUNT
```

For example a line might read `E500 7` (the code, a space, then how many times it
appeared).

## What you'll practice
`grep`, extracting a field (`grep -oE`, `cut`, `sed`, or `awk`), `sort`, `uniq -c`.

## Done when
`answers/02.txt` has exactly 3 lines, ranked by count, each `CODE COUNT`.

```bash
bash check/check02.sh
```

Stuck? `hints/02.md`.
