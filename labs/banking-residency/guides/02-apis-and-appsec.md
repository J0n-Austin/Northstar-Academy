# APIs and application security

## Identity is not authorization

The X-Demo-User header is an insecure stand-in only. In production validate an authenticated principal; check object ownership for every resource. OWASP API1:2023 describes BOLA.

## SQL parameters

Do not interpolate user text into query strings. Bound parameters keep data separate from SQL syntax. Add negative tests with quote and comment characters.

## Data structures and API response modeling

Compare database rows, dicts and JSON arrays. Make explicit allowlists for response fields. Think through pagination and error semantics.

## Design discussion

Document which trusted identity provider and access control model a real bank would require. Identify all routes that access accounts.

## Checkpoint

Write two examples of a failure mode and a test that would detect each one.

## What is the trust boundary?

The service reads `X-Demo-User`, which any caller can fabricate. This is deliberately NOT an authentication system. In a production application, a trusted session or validated token would identify the caller. That principal must then be authorized for each operation. Object-level authorization cannot rely on a UI control being hidden. Draw the path from a principal to account ownership and the database predicate that enforces the check.

## BOLA reproduction

Compare `curl -i -H 'X-Demo-User: alice' http://127.0.0.1:8765/accounts/1` with the same request for `/accounts/2`. The first should succeed; the second should deny access. The test is most valuable when it proves both a permitted and a denied case. Explain the difference between authentication (who are you?) and authorization (can you access this account?).

## Parameterized query reasoning

A search string such as `1` is data. A string containing quotes and SQL comment characters should also be data. SQL parameter binding prevents user text from becoming query syntax. The owner filter must still be enforced: parameterization alone is not sufficient for multi-tenant access control. In your design notes, identify other endpoints using database IDs that would need the same policy.

## Security review methodology

Review the request interface, trust boundary, data access, output fields, and negative tests. Write a small threat model: asset, actor, entry point, failure mode, and mitigation. In the PR, explain whether you would return 403 or 404 for unauthorized object access and what information each response reveals. Include tradeoffs instead of treating all security choices as universal.
