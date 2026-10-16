# Sprint 6 · Identity, safe retries and evidence

**Engineering question:** Can this endpoint be called twice without moving money twice?

A client may time out after a service commits a transfer. Retrying with the *same* idempotency key must return the first result without additional side effects. Retrying a changed payload under that key must be rejected, not silently accepted. A durable database uniqueness constraint should guard `(user_id, request_key)`; check prior records before checking balances, and ensure races are handled within an atomic transaction.

The starter has intentionally incomplete replay behavior and account-level authorization. Your job is to repair these defects and validate balance conservation. Use a fresh test database for each case, including negative tests that assert *no side effects* after rejection.

## Security considerations

- Don't trust demo account IDs merely because they are integers.
- Return safe error messages; never leak a bearer token in logs or response bodies.
- Use allowlisted audit fields such as `operation` and `outcome`, not full HTTP request bodies.
- The local demo uses PBKDF2 for password digests and opaque bearer tokens. It is not a production IAM service: it lacks MFA, account recovery, secret rotation and abuse controls.

## Evidence report

Provide the failing test before your fix, a reference to the relevant SQL constraint, the passing test after the fix, and a short note on behavior under concurrent retries. Include the exact `pytest` command and an explanation of how you would extend the test for PostgreSQL isolation.
