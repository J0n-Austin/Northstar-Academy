# Sprint 5 · Real HTTP framework and trust boundaries

**Engineering question:** Which layer should reject a request, and which layer should enforce a banking invariant?

## Model the flow

1. An HTTP client sends a JSON document. FastAPI and Pydantic validate the syntactic shape and reject missing or invalid fields with `422`.
2. A bearer token is resolved to a user through a *database record*, not a caller-selected username. The service stores only a digest of opaque session tokens, with expiration.
3. The endpoint calls domain logic. The actor can access only resources owned by their user ID; returning `404` for out-of-scope records can avoid exposing object existence.
4. SQLAlchemy tracks changes until the database transaction commits. A failed write must roll back both sides of a transfer.
5. An allowlisted audit record records the operation and outcome without tokens, passwords or sensitive raw payloads.

**Worked command:** `curl -i http://127.0.0.1:8766/health` (start the server first). Predict the JSON body, media type, and status. Then change the path and observe how `404` differs from `401`.

**Common misconception:** Correct Pydantic shape validation is not object-level authorization. An authenticated user can still request somebody else's account ID.

## Guided exercise

Create Alice and Bob with the registration endpoint; obtain two bearer tokens; create an account under Alice; call the account endpoint with Bob's token. Document why the starter currently leaks the account. Add a failing test that requires a denied response before implementing the fix.

## Independent challenge

Ensure adding a new endpoint does not accidentally bypass the ownership rule. Inspect dependencies, write a negative cross-user test, and record a concise rationale for the boundary in a PR description.
