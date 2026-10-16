# Testing foundation workshop — real Python practice

**Environment:** Python 3 standard library, Codespaces or Linux. All accounts/events are synthetic; do not use customer data.

## Your assignment

Open [`docs/foundations/testing.md`](../../../docs/foundations/testing.md) and complete the four `testing` foundation lessons in the academy portal before starting this workshop. The `starter.py` module has **intentional defects or TODOs**, and tests capture the public behavior you must implement. Do not change the test requirements just to make a green run.

## Commands

```bash
cd labs/foundations/testing
bash smoke-test.sh  # must PASS in untouched starter
bash run-checks.sh   # must FAIL until you fix starter.py
python3 -m unittest discover -s tests -p 'test_contract.py' -v
```

## Engineering workflow

1. Read docstrings and predict which contracts currently fail.
2. Run one test, record failure and isolate the relevant function.
3. Write a negative-case test of your own; implement the minimal robust fix.
4. Rerun the entire suite and check that you did not mutate inputs or expose private fields.
5. In a branch, commit your fix and write 100–200 words covering root cause, invariants, tests run and one remaining risk.

**Progress boundary:** A portal quiz passing or a checkbox marked complete does not verify these tests. The browser cannot execute this Python. To claim demonstrated skill, submit code and output to an actual reviewer.
