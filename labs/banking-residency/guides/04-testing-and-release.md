# Testing and release

## Least privilege and joins

A history report must never return other customers’ data. JOIN source accounts against the actor and test the negative path.

## Safe observability

Record a minimal structured event (operation, result and a bounded safe actor label). Never log secrets, raw request bodies or credentials.

## CI and regression

Separate infrastructure smoke checks from learner acceptance tests, and do not hide expected starter defects. Every fix requires a regression test and successful full suite.

## Code review

A strong PR explains root cause, alternative approaches, observed test results, risk and rollback. An automated reviewer can coach structure, but cannot verify that code was implemented correctly.

## Checkpoint

Write two examples of a failure mode and a test that would detect each one.

## Data minimization extends beyond writes

A read-only endpoint can still be a security defect. Join transfer history to the source account and filter by the requesting actor to prevent cross-customer leakage. Test an account with transactions, an account with none, and a caller who owns no matching source account. Consider whether destination owners should see the same record and state your policy explicitly.

## Security observability without secrets

Audit logs should record what kind of operation occurred and its outcome, not entire request bodies, passwords, raw authentication tokens, or account payloads. Design a bounded set of permitted keys and add a test with a dummy token to prove it never appears in the event. Structured events enable aggregation while reducing unnecessary personal data exposure. Document remaining threats: malicious administrators, forged demo identities, inadequate retention, and loss of event integrity.

## Code review as engineering communication

Your PR should contain a precise reproduction, root cause, implementation summary, expected and observed tests, security impact, deployment risk and rollback. Separate evidence you actually obtained from assumptions. Respond to review comments by explaining alternatives, not by arguing that the tests happen to be green. A deterministic portal review checks document completeness only; independent verification still requires actual code and test evaluation.

## Design review exercise

Draw your minimal service architecture and describe how you would change it for production: real identity, authorization policy, migration tooling, a server framework, observability, structured error responses, concurrency and database operational controls. Which of those concerns are intentionally out of scope for this educational service? This is a bridge from a small Python program into larger secure backend systems, not a production banking design.
