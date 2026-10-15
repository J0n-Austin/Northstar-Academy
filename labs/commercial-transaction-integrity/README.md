# COMM-201 / COMM-202 — Transaction Integrity and Idempotency

**Track:** Commercial Software Security · **Estimated:** 5–8 focused hours · **Environment:** Python 3 / SQLite, real CLI and unit tests. **Status:** intentionally defective starter. **Assessment:** practice-only.

## Fictional workplace assignment

Northstar Finance processes a small number of synthetic transfers. QA found that duplicate deliveries of the same request can debit an account twice; incident review also discovered that a failure between debit and credit can destroy value. Investigate both defects and make the business operation safe and retryable.

These exercises use only synthetic cents-based balances. This is not a payment service or a reference banking architecture.

## Skills

- Explain request idempotency and distinguish retrying *the same operation* from making a new operation.
- Enforce identical-input replay for an idempotency key; reject reuse with different request arguments.
- Use a database transaction to make debit, credit, movement audit and request tracking all-or-nothing.
- Develop failure-injection tests, and validate conservation of balances after exceptions.
- Use integer cents and test boundary cases; do not use floating point for monetary balances.

## Start

```bash
cd labs/commercial-transaction-integrity
bash run-checks.sh      # EXPECTED to fail until you fix the starter
python3 src/cli.py --db /tmp/northstar-demo-ledger.sqlite3
python3 src/cli.py --db /tmp/northstar-demo-ledger.sqlite3 --transfer --request-id demo-01 --cents 1000
python3 src/cli.py --db /tmp/northstar-demo-ledger.sqlite3 --transfer --request-id demo-01 --cents 1000
```

Using the same request ID twice should not transfer funds twice once fixed. Use a **new** temporary DB path or delete your *synthetic* demo DB to restart; never run cleanup commands on real data.

## Work tickets

**NS-COM-201 (Idempotency):** For the same request ID and identical arguments, return a successful no-op/replayed result; with different arguments return `TransferRejected`. Persist request IDs to SQLite and retain a unique constraint. Prove that a retry does not duplicate movement records.

**NS-COM-202 (Atomicity):** Remove the early commit. Put account checks, debit, credit, movement insertion and idempotency-record insertion inside one atomic transaction. Roll back on the provided `fail_after_debit=True` simulation. Then demonstrate that retrying after a rollback transfers funds exactly once.

**Stretch assignment:** Study why simultaneous requests require careful concurrency handling and compare SQLite transaction locking with a transactional database server. This starter does not teach distributed exactly-once guarantees.

## Submit

Commit your code, completed [`evidence-template.md`](evidence-template.md), failure-injection output and `bash run-checks.sh` output. Reviewer checks transaction scope, balance invariants, idempotency collision handling and a complete failure narrative. Source-visible tests provide **practice feedback, not verified hiring credentials**.
