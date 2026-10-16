# Debugging and observability: from symptom to cause

## 1. Separate symptom, hypothesis and evidence

A product report such as “account listing broke after deployment” is a symptom. It does not identify the defect. Reproduce it with stable inputs; capture expected and observed results; write a hypothesis; design one experiment that could falsify the hypothesis. Avoid editing multiple unrelated modules before you know which assumption failed. A minimal reproduction and a clean test fixture let other engineers verify the claim.

## 2. Follow the value through the stack

Trace `request -> HTTP parsing -> domain logic -> SQL -> response`. At each boundary inspect only necessary values: request method/path, normalized identifier, authorized actor, query predicate, affected-row count and returned representation. The visible exception may be far downstream of the initial error. Use `python3 -m pdb` for breakpoints and stepping, or focused diagnostics during development. Never publish raw customer records or authorization headers in a traceback response.

## 3. Make logs useful without making them dangerous

A good event has a stable name, outcome and request identifier. Do not log secrets, full bearer tokens, access credentials or raw sensitive bodies. A sanitization rule must work with mixed case header names and nested structures. Logs are for diagnosing an event, while audit trails may have additional integrity/retention requirements. These are not interchangeable.

```json
{"event":"authorization_denied","request_id":"req-05","resource":"account","outcome":"denied"}
```

This tells a developer enough to correlate an event without exposing the account's complete sensitive contents. Avoid writing a full secret into logs and relying on redaction *after* export.

## 4. Root cause versus trigger

A bad account identifier may *trigger* an exception; the root cause may be that an unchecked conversion escapes the HTTP handler and returns 500 instead of a documented 400. Reports should distinguish trigger, faulty assumption, impact, correction, validation and potential prevention. A “fixed” label with no reproducible before-and-after proof does not demonstrate competence.

## 5. Reproduce the workshop bug

Run the debugging workshop tests. Inspect the input event stream and identify which invalid record causes counts to drift. Make a small fix, then create a regression test for the original trigger. Submit a one-page investigation with exact command, expected output, observed output, defect location, corrected behavior and risks. Bring the same discipline to the banking health contract, authorization investigations and audit logging tickets.

## Case study: wrong owner, correct SQL

**Incoming ticket:** A transaction history endpoint occasionally shows data for the wrong customer. The SQL query appears to include an owner predicate, so a developer immediately blames the database. Trace the actor value: the HTTP handler extracts a demo header; domain code accepts that actor; the SQL layer binds it as a parameter. If the supplied actor was wrong at the input boundary, correct SQL can still return the wrong user's data.

**Hypothesis-driven investigation:** First reproduce with two distinct synthetic identities and deterministic records. Capture each request (sanitize headers), the response status and the returned account IDs. Next inspect the value passed into the domain function, then inspect the SQL bindings. Change only one variable per experiment. If the result changes when the header changes, that is evidence that the identity boundary matters; it does not prove the entire authorization design is safe.

**Safe diagnostics:** Instead of logging raw `Authorization` headers or complete customer objects, emit structured events with event, correlation ID, outcome and coarse failure category. Apply a strict allowlist when building log records. Redacting the literal word "password" is insufficient: tokens may appear under varied casing or nested keys. Add a test that passes nested headers and asserts no secret string appears anywhere in the resulting event representation.

**Report the cause precisely:** Trigger: request with actor header for another user. Defect: the training server treats caller-controlled identity as trusted. Impact: demonstration permits impersonation if exposed outside localhost. Containment: bind the server to 127.0.0.1 and restrict access to synthetic fixtures. Production correction: real authenticated identity propagation and server-side authorization, supported by reviewed identity architecture. Simply hiding the header in the browser would not fix the defect.

**Residency handoff:** NS-C407 and NS-C408 ask you to think critically about historical data and audit logs. Include the reproduction, trace, precise source-level fault, corrected behavior, regression tests, release risk and rollback plan in your PR evidence. Do not state that the local demo has production authentication.


# Extended engineering lessons · Stage 4.1A

## 5. Stack traces and exception boundaries

A stack trace shows where an error surfaced, not always where it originated. Follow the call chain and inspect validated assumptions at each boundary. HTTP handlers should return safe errors without leaking account numbers, stack traces or credentials. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
def parse(raw): return int(raw)
try: parse("bad")
except ValueError as exc: assert type(exc).__name__ == "ValueError"
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Suppressing a stack trace in the response is different from suppressing the internal diagnostic event.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the debugging workshop.

**Review question:** Which clue helps locate a failure path? A stack trace shows where an error surfaced, not always where it originated. Suppressing a stack trace in the response is different from suppressing the internal diagnostic event.

## 6. Structured events and correlation

Structured logs let engineers filter by request ID, outcome and component. Request correlation identifies a transaction across services without placing secrets or personal details in log messages. Logs should preserve causality and be bounded in size. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
event={"request_id":"req-42","action":"transfer","ok":False}
assert "password" not in event
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** More logs can reduce security if they include raw authorization headers or sensitive bodies.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the debugging workshop.

**Review question:** Which field helps join events across a request? Structured logs let engineers filter by request ID, outcome and component. More logs can reduce security if they include raw authorization headers or sensitive bodies.

## 7. Race investigation

A bug that only appears under load needs controlled concurrent reproduction. Use deterministic barriers or synchronized workers rather than hoping the race occurs. Capture transaction ordering and invariant failures; use atomic write conditions or locking to resolve the root cause. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import threading
b=threading.Barrier(2)
assert b.parties==2
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Passing a single-threaded test does not prove thread safety.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the debugging workshop.

**Review question:** What helps reproduce a concurrency race reliably? A bug that only appears under load needs controlled concurrent reproduction. Passing a single-threaded test does not prove thread safety.

## 8. Performance profiles and baselines

Optimize after measuring. Capture timing, query counts and relevant input size. A growing N+1 query problem may dominate request time even if each individual query is fast. Use representative workloads and measure again after a targeted change. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import time
t=time.perf_counter();sum(range(1000));elapsed=time.perf_counter()-t
assert elapsed>=0
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A single timing sample is not evidence of a reliable performance improvement.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the debugging workshop.

**Review question:** What should happen before optimization? Optimize after measuring. A single timing sample is not evidence of a reliable performance improvement.
