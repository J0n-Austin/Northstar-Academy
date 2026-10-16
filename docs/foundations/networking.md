# Networking, sockets & service operations

Understand the packet-to-API stack and its trust boundaries: IP and ports, TCP stream framing, TLS, HTTP and proxies. Real network faults reveal why a green socket is not the same as a correct service.

## Learning environment

Use a local Python 3 runtime, avoid production secrets, and document input and output for every claim. The learner workshop deliberately starts with defects and its contract tests are meant to fail until repaired. Never expose training services on a public interface.


# Extended engineering lessons · Stage 4.1A

## 5. Observability across layers

Diagnose requests using layers: DNS resolution, TCP connection, TLS handshake, HTTP status and business result. Successful connectivity does not mean correct authorization. Gather evidence at the narrowest useful layer and avoid collecting secrets. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import urllib.parse
assert urllib.parse.urlsplit("http://127.0.0.1:8765/health").path=="/health"
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Ping success is neither proof an HTTPS endpoint works nor proof its data is correct.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the networking workshop.

**Review question:** Which step best isolates an HTTP 403 issue? Diagnose requests using layers: DNS resolution, TCP connection, TLS handshake, HTTP status and business result. Ping success is neither proof an HTTPS endpoint works nor proof its data is correct.

## 6. HTTP proxies and deployment edges

Reverse proxies can terminate TLS, enforce limits and forward requests. Applications must distrust client-supplied forwarded headers unless they come from trusted infrastructure. Test origin binding and health checks after deploying behind a proxy. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
headers={"X-Forwarded-For":"203.0.113.7"}
assert "X-Forwarded-For" in headers
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Never trust X-Forwarded-For from arbitrary direct clients for security decisions.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the networking workshop.

**Review question:** When are forwarded headers trustworthy? Reverse proxies can terminate TLS, enforce limits and forward requests. Never trust X-Forwarded-For from arbitrary direct clients for security decisions.
