# Relational databases: data that survives failures

## 1. Model the invariants

A database is more than a place to put JSON. Tables define entities and relationships; constraints reject invalid states; transactions group operations that must succeed together. In a toy banking service, `accounts` records a stable identifier, an owner and integer cents. The invariant `cents >= 0` should be enforced by both business logic and a database CHECK constraint where appropriate. In a real financial ledger, design choices are more complex and balances are often derived from immutable entries; this lab intentionally narrows the scope.

Use integer cents, not floating-point dollars, to avoid imprecise arithmetic. Primary keys uniquely identify rows, foreign keys preserve relationships, and UNIQUE constraints enforce idempotency-key uniqueness. A good schema makes invalid states difficult to represent.

## 2. Safe queries and authorization

A SQL injection occurs when untrusted values become part of executable SQL syntax. Placeholders such as `?` in SQLite cause values to be bound as data. They protect values, *not* identifiers such as dynamic table names; an allowlist is needed if SQL structure itself changes. The query should include the server-authorized account owner, rather than fetching every row and filtering in the browser.

```python
rows = conn.execute(
    'SELECT id, cents FROM accounts WHERE owner = ? ORDER BY id LIMIT ? OFFSET ?',
    (actor, limit, offset),
).fetchall()
```

Observe that parameterization and authorization are two separate controls. A fully parameterized query can still expose private records if it lacks a correct owner predicate.

## 3. Transaction boundaries and rollback

Transfers have at least two operations: subtract from source and add to destination. These must be atomic. In Python's `sqlite3`, explicitly manage transactions in code and understand when the library commits or rolls back. Simulate a failure between debit and credit, then check **both** balances. Do not settle for an exception alone. The total amount should not change for an internal transfer, and the source must not become negative.

```sql
BEGIN;
UPDATE accounts SET cents = cents - 500 WHERE id = 1 AND cents >= 500;
-- verify exactly one row was changed, then credit account 2
COMMIT;
```

If a required step fails, roll back the transaction. A conditional UPDATE can enforce sufficient funds but only if the affected row count is checked. Separate the success of an SQL statement from the success of the business operation.

## 4. Concurrency, performance and migration

Two simultaneous requests can both observe an older balance unless the transaction strategy prevents a lost update. SQLite's locking and PostgreSQL's transaction/isolation semantics differ: do not assume a solution transfers unchanged. Indexes can speed owner-filtered retrieval but impose storage and write costs. Use `EXPLAIN QUERY PLAN` to inspect behavior and measure before optimizing. Schema migrations must be reversible or have a documented safe rollback approach; dropping data is not a harmless refactor.

## 5. Applied practice

Run `python3 -m unittest discover -s tests -v` in `labs/foundations/sql`. Create schema constraints, parameterized owner-scoped queries, and a transfer operation that passes rollback tests. Then read the residency's `app/bank.py`, reproduce the unauthorized query, and annotate every place an actor value enters SQL. Complete NS-C402 and NS-C405 only after documenting your database assumptions.

## Case study: a transfer that says failed but still debits

**Incoming ticket:** A transfer of 200 cents from account 1 to account 2 returns HTTP 500 after an injected exception. The service retries later, but the customer's balance is already 200 cents lower. The logs indicate the debit SQL statement returned successfully. That alone does not prove the overall transfer succeeded. Find the transaction boundary and identify any premature `commit()`.

**Reproduce with a ledger table:** Begin with balances 1000 and 500. Record their sum: 1500. Start a transfer and deliberately raise an exception immediately after the debit. Query both balances. If you see 800 and 500, the system has lost 200. If you see 1000 and 500, rollback preserved the invariant. A test should check both individual balances and the conservation property; do not merely assert `RuntimeError` is raised.

**Design the database contract:** Define `id` as a primary key, `owner` as not-null, and `cents` as integer with a nonnegative CHECK. The source debit query should condition on available funds and update exactly one row; check `rowcount`. The destination must exist; an UPDATE affecting zero rows is not an acceptable transfer success. Use parameter placeholders for all caller-supplied values. Observe that placeholders prevent SQL injection but do nothing to prove the source account belongs to the requesting user.

**Think about concurrency:** A read-then-update scheme can be unsafe when two workers use stale balances. A guarded UPDATE inside a transaction reduces the risk, but a full strategy must match the database's isolation and lock semantics. SQLite is adequate for this controlled local workshop; a PostgreSQL production migration would require revisiting the transaction strategy, schemas, concurrency tests and operational rollback plan.

**Residency handoff:** Run the failing test from Sprint 3 and capture exact before/after balances. Fix the transaction boundary. Add failure injection for nonexistent destination and inadequate funds. Write down which properties your tests demonstrate and which concurrency behaviors they do *not* test.


# Extended engineering lessons · Stage 4.1A

## 5. Foreign keys and schema constraints

A database can enforce relationships even when application code contains defects. Foreign keys prevent orphan records when enabled, CHECK constraints reject invalid domain values, and UNIQUE constraints reject duplicate keys. Treat constraints as a second defense, not a replacement for authorization. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import sqlite3
c=sqlite3.connect(":memory:"); c.execute("PRAGMA foreign_keys=ON")
c.execute("CREATE TABLE parent(id INTEGER PRIMARY KEY)")
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** SQLite foreign keys require explicit enablement per connection.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the sql workshop.

**Review question:** What protects relationship integrity at the storage boundary? A database can enforce relationships even when application code contains defects. SQLite foreign keys require explicit enablement per connection.

## 6. Indexes and query planning

Indexes can speed up selective lookups but add write costs and cannot compensate for incorrect queries. Study EXPLAIN QUERY PLAN and design indexes around equality predicates, joins and ordering. Evaluate the workload instead of indexing every column blindly. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import sqlite3
db=sqlite3.connect(":memory:");db.execute("CREATE TABLE a(owner TEXT, id INTEGER)")
db.execute("CREATE INDEX idx_owner ON a(owner)")
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** An index improves access paths, not authorization decisions.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the sql workshop.

**Review question:** Why might an index slow bulk inserts? Indexes can speed up selective lookups but add write costs and cannot compensate for incorrect queries. An index improves access paths, not authorization decisions.

## 7. Isolation and concurrent writes

Two requests can read the same balance before either updates it. A correct transfer needs transactional boundaries, locking or atomic conditions so the invariant holds under concurrency. Database isolation is a design decision; understand lost updates, stale reads and deadlocks. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
balance=100
requested=[80,80]
assert sum(requested)>balance  # both cannot safely succeed
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Sequential tests alone cannot establish concurrent correctness.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the sql workshop.

**Review question:** What catches a lost-update risk? Two requests can read the same balance before either updates it. Sequential tests alone cannot establish concurrent correctness.

## 8. Migrations and rollback plans

Schema changes must work for existing populated databases. A migration defines forward changes, data backfills and operational rollback implications; blindly dropping a populated table is not acceptable. Practice migrating from one compatible schema version to another. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import sqlite3
db=sqlite3.connect(":memory:");db.execute("CREATE TABLE event(id INTEGER PRIMARY KEY)")
db.execute("ALTER TABLE event ADD COLUMN category TEXT")
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A schema migration is more than a create_all call on an empty database.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the sql workshop.

**Review question:** Which migration strategy reduces rollout risk? Schema changes must work for existing populated databases. A schema migration is more than a create_all call on an empty database.
