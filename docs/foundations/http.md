# HTTP and APIs: contracts across a network boundary

## 1. Trace the entire exchange

An API is a contract between components that may have different authors, deployments and failure modes. Read the method, path, headers, status and body separately. `GET /health` returning HTTP 200 means the request was handled successfully *at the HTTP layer*; the body may still violate the application contract if required JSON fields are absent. Conversely, an HTTP 404 can be correct when a resource does not exist or the server intentionally conceals a private resource.

Use two terminals. Start `python3 -m app.server --port 8765` in the residency folder and then request `curl -i http://127.0.0.1:8765/health`. The `-i` flag includes response headers. Compare the observed JSON with the documented fields. If the server will not start, first distinguish a process error from a request-level defect.

## 2. Methods and status codes

GET should not intentionally change state. A POST may create a transaction; it must validate the request and communicate the resulting outcome. A 400 means an invalid client input, 401 indicates missing or invalid authentication, 403 means authenticated but forbidden, 404 indicates not found, 409 often means a conflict, and 500 means the server could not complete the operation. These are conventions whose meaning should be documented for each endpoint. Avoid leaking detailed SQL messages in client-facing 500 responses.

A successful status cannot substitute for server-side access control. A developer may hide a forbidden UI button, but an attacker can send the request directly. Check ownership in the server-side domain/data layer. In this synthetic training repo, `X-Demo-User` is an explicitly untrusted simulation identity; it is *not* authentication and must never protect public systems.

## 3. Serialization, validation and pagination

JSON object keys are strings, but values can be strings, numbers, booleans, arrays, objects or null. Decide which forms are valid for each field. The service should reject unknown or malformed amounts before touching persistent data. Pagination is a contract: define the default and maximum page size, the stable sort key, and the behavior of negative/invalid offsets. Naively converting arbitrary strings with `int()` without catching errors can produce an unintended HTTP 500 instead of a 400.

```http
GET /accounts?limit=2&offset=0 HTTP/1.1
Accept: application/json
```

Trace where the parameters are parsed, normalized, bound in SQL and finally serialized. Ask whether page 2 still belongs to the same authorized actor.

## 4. Retry and idempotency reasoning

A network timeout gives incomplete knowledge: the client cannot tell whether the server committed work but lost the response. A retry of a non-idempotent transfer can debit twice. For reliable money movement, a client supplies a stable idempotency key for one intended operation. The server stores a fingerprint and result durably as part of a transaction. Replaying the *same request* must not debit again, and reusing the same key for a different transfer should be rejected. A client-side in-memory cache alone is insufficient: processes restart and multiple workers may serve requests.

## 5. Practice and handoff

1. Complete the HTTP workshop, which starts an ephemeral-port localhost server and checks actual HTTP response semantics.
2. Produce a contract table for /health, /accounts and /transfers: method, path, status, response shape, errors, authorization policy.
3. Reproduce the residency health-check defect and write one regression assertion.
4. Use a different demo identity to test forbidden account access; explain why the header is insecure for a real deployment.
5. Document retry assumptions and demonstrate a test proving a duplicate operation did *not* execute twice.

In your engineering evidence, include exact requests and sanitized responses, not screenshots alone. A reviewer should be able to reproduce the defect without guessing hidden setup steps.

## Case study: green health check, red deployment

**Incoming ticket:** Operations sees HTTP 200 from `/health` but cannot identify the deployed release because the `build` field is absent. A developer suggests returning HTTP 500 whenever the field is missing. That makes the absence obvious, but it confuses two independent questions: whether the process is healthy and whether it conforms to a release-identification contract. Decide which endpoint behavior the documented contract actually promises, and write a regression test for it.

**Reproduce:** Start the localhost banking server and run `curl -i` on `/health`. Record the status line, `Content-Type` and response JSON. Now run an unauthorized account request and compare its response status/body. Does the server return the same behavior for an unknown account and a known but unauthorized account? Explain the privacy tradeoff, and why a caller-controlled header cannot establish real authentication.

**Boundary matrix:** For `/accounts/7`, test: missing identity, wrong identity, unknown ID, malformed ID `abc`, invalid page sizes and authorized correct identity. For each case, predict whether the service should return 200, 400, 401, 403 or 404 based on the **documented** contract, not on a generic assumption. Test whether an error body unintentionally includes SQL fragments or private data. A stable error shape makes client-side error handling easier but must not reveal security-sensitive details.

**Retry experiment:** Imagine the client submits a transfer, the server commits it, then the response is lost. If the client blindly repeats the POST, the bank may debit twice. Sketch an idempotency table with key, request fingerprint, status and stored result. The insertion/check and transfer must be coordinated transactionally. Ask what happens when two workers receive the same key concurrently. Why does sleeping and trying again not solve duplicate execution?

**Residency handoff:** For NS-C401, provide the literal failing response and its asserted contract. For NS-C403, show both authorized and unauthorized requests. For NS-C406, demonstrate a replay test that checks the balance after each call rather than just comparing HTTP codes.


# Extended engineering lessons · Stage 4.1A

## 5. Content types and serialization

An API contract includes representation details. A valid JSON body delivered with the wrong content type can be rejected by clients, and an arbitrary object can fail serialization. Validate content type before reading input and return a consistent JSON response shape. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import json
payload=json.dumps({"ok": True}).encode("utf-8")
assert payload.startswith(b"{")
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A 200 status does not prove that the content matches the declared media type.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the http workshop.

**Review question:** Which response metadata tells a client how to parse JSON? An API contract includes representation details. A 200 status does not prove that the content matches the declared media type.

## 6. Pagination and stable ordering

Large resources should be paginated to avoid unbounded responses. A limit without a deterministic order can skip or repeat rows when new records are inserted. Keyset pagination scales better for many append-only workloads; offset pagination is simpler but requires tradeoff analysis. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
rows=[{"id":3},{"id":1},{"id":2}]
page=sorted(rows,key=lambda x:x["id"])[:2]
assert [x["id"] for x in page]==[1,2]
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A LIMIT without ORDER BY does not establish stable page contents.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the http workshop.

**Review question:** Why order results before pagination? Large resources should be paginated to avoid unbounded responses. A LIMIT without ORDER BY does not establish stable page contents.

## 7. Timeouts, retries and backoff

Networks fail partially: a client may time out after the server commits an operation. Retrying blindly can duplicate effects. Pair timeouts with idempotency keys, bounded retries and exponential backoff with jitter; decide which failure categories are retryable. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
def delays():
    for attempt in range(3):
        yield min(8, 2 ** attempt)
assert list(delays())==[1,2,4]
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Timeout does not imply the server rolled back the request.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the http workshop.

**Review question:** When should a payment request be safely retried? Networks fail partially: a client may time out after the server commits an operation. Timeout does not imply the server rolled back the request.

## 8. HTTP API compatibility

External clients rely on status codes, field names and failure formats. Adding a required field can break existing callers; version or migrate contracts deliberately. Contract tests should cover absent and invalid fields as well as successful requests. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
def respond(account):
    return {"id":account["id"],"balance_cents":account["balance_cents"]}
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A breaking change is not made safe simply by documenting it after deployment.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the http workshop.

**Review question:** What best detects an accidental response change? External clients rely on status codes, field names and failure formats. A breaking change is not made safe simply by documenting it after deployment.
