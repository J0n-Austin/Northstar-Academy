# Transaction design

## ACID and invariants

A transfer must preserve total funds and never produce negative balances. Debit and credit belong in one atomic transaction. Explain how a rollback protects invariants.

## Concurrency control

A check-then-write sequence is vulnerable to races. SQLite BEGIN IMMEDIATE serializes writers for this exercise. In production, discuss stronger concurrency and scaling needs.

## Idempotent retries

A client can retry after a lost response, so repeated keys must return the original result without repeating side effects. A reused key with different parameters should be rejected.

## Testing scenarios

Test success, insufficient funds, foreign account, repeat request and conflicting payload. Use temporary databases for isolation.

## Checkpoint

Write two examples of a failure mode and a test that would detect each one.

## Money as integers and invariants

Balances are modeled as integer cents. Before modifying state, write down the invariant: for a successful internal transfer, total money across both accounts does not change. No balance becomes negative if the transfer is rejected for insufficient funds. Consider what occurs if a debit is committed and the credit fails. A unit of business work must not be split across multiple independent commits.

## ACID and a concrete race

SQLite can acquire a write lock with `BEGIN IMMEDIATE`. Inside the transaction, validate the source account, its owner, destination existence and available funds, then update both balances. Two concurrent transactions that each read the old balance before writing can overspend if the check and debit are not serialized. Sketch the interleaving of two $70 transfers from a $100 account, then explain how the chosen transaction boundary prevents it in this small exercise.

## Network retries and idempotency

A client can submit a transfer, the server can commit it, and the response can be lost. Retrying without an idempotency key would execute the operation again. A unique `(actor, request_key)` constraint creates a durable replay boundary. It must store enough details to detect a repeated key with a different amount or destination. A successful replay returns the original transfer identifier without updating accounts. Distinguish an initial `201 Created` response from a replayed `200 OK` response.

## Validation matrix

Construct a table with success, insufficient funds, foreign source, duplicate key same payload, duplicate key different payload, and malformed amount. List the expected HTTP status, database effect, and test name for each case. Confirm expected rollback behavior through a fresh test database. Do not weaken acceptance tests to force a green result.
