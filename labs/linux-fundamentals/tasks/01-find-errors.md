# Task 1 — Find the timeout errors

**Ticket NS-101.** Operations thinks a flaky dependency is causing timeouts. Before
anyone digs in, they want a count.

## Your job
Across **all** log files in `scenario/logs/`, count how many **ERROR** lines also
mention **timeout** (case-insensitive). Write just that number to `answers/01.txt`.

## What you'll practice
`grep`, pipes (`|`), reading across multiple files.

## Done when
`answers/01.txt` contains a single number.

```bash
# run the checker for this task
bash check/check01.sh
```

Stuck? `hints/01.md` has escalating hints.
