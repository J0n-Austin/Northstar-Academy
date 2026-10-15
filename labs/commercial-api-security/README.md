# COMM-101 / COMM-102 — Account Access and Search Security

**Track:** Commercial Software Security · **Estimated:** 5–8 focused hours · **Environment:** real Python 3 / SQLite / localhost HTTP. **Status:** intentionally vulnerable starter. **Evidence:** practice-only.

## Fictional workplace ticket

Northstar Finance's account API passed basic functional tests. A QA engineer noticed that switching the numeric account identifier displays a different synthetic customer's details, and a security reviewer flagged a string-built SQL query. You're the junior developer assigned to reproduce, diagnose, remediate, and document both issues.

The accounts (`alex` and `blair`) are synthetic. **`X-Demo-User` only identifies a test persona and is not real authentication.** Do not deploy this application to any internet-facing host. The HTTP server binds to 127.0.0.1.

## Learning goals

1. Explain Broken Object Level Authorization (BOLA) as an object-level server-side access decision, not a UI issue.
2. Distinguish authentication from authorization; do not claim the demo header is secure authentication.
3. Use parameterized SQL for untrusted search terms, preserve normal LIKE behavior, and prevent cross-tenant data access.
4. Add regression tests for ordinary and adversarial requests and communicate the security impact without using real customer data.

## Start

```bash
cd labs/commercial-api-security
bash run-checks.sh          # EXPECTED to fail until the learner patches the starter
python3 src/api.py --port 8080
# another shell:
curl -H 'X-Demo-User: alex' http://127.0.0.1:8080/api/v1/accounts/101
curl -H 'X-Demo-User: alex' http://127.0.0.1:8080/api/v1/accounts/202
curl -G -H 'X-Demo-User: alex' --data-urlencode 'q=rent' http://127.0.0.1:8080/api/v1/transactions
```

## Assignments

**NS-COM-101 (BOLA):** In `src/bank.py`, ensure an account can only be returned to its owner. Make non-owner and unknown account requests indistinguishable (both unavailable). Test via the actual HTTP adapter and unit tests. Write down where you would integrate *real* identity authentication in production.

**NS-COM-102 (query safety):** Remove the unsafe string-built SQL without losing transaction search. Verify that quotation marks, wildcard characters, and malicious-looking input are treated only as data, and results never belong to a different user. For a production implementation, consider escaping `%` and `_` if search semantics require literal rather than wildcard matching.

**Operational rules:** No external scanning, no live customer data, no secrets, no public service binding. Use the seed data only.

## Submission / reviewer rubric

Submit a patch, output of `bash run-checks.sh`, an HTTP request/response example, and [`evidence-template.md`](evidence-template.md). Reviewer expects: sound access predicate, SQL placeholders and bound parameters, a proper negative access regression test, no new data exposure, and a clear limitation statement about demo identity.

**Passing the visible tests is practice evidence, not an employer-verified credential.**
