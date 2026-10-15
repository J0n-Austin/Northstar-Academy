# CORE-NET01 — POSIX socket framing

**Status:** real local TCP and Unix-domain sockets · **level:** guided → independent · **assessment:** practice only.

## Ticket
The Northstar telemetry gateway occasionally drops a message after it is split into multiple TCP segments. A teammate claims “one send is one recv.” Investigate why this is incorrect and repair the transport helper without changing its public API.

## Protocol and limits
Two-byte unsigned **big-endian length prefix**, followed by `1..256` bytes. A PING request receives PONG, other messages ERR. The service binds only to `127.0.0.1`, processes one connection, and exits. Message boundaries are application-defined, not guaranteed by TCP `read()` calls.

## Work items
1. Inspect `src/io.c`, `src/server.c`, and `src/client.c`; describe the bug hypothesis.
2. Run the local TCP demo to observe the functional happy path.
3. Run the real socket regression tests. Fix `read_exact` to cope with partial reads, EOF and interrupted reads (EINTR) without reading beyond its destination.
4. Re-run regression tests and demo. Optionally capture the localhost flow using `sudo tcpdump -i lo -w trace.pcap tcp port <port>` (Wireshark/tcpdump optional).
5. Submit a PR with an evidence report explaining TCP streams and documenting the tests and limitations.

```bash
cd labs/posix-protocol
bash run-demo.sh                # actual client/server over 127.0.0.1
bash run-checks.sh             # expected FAIL before fixing the helper
SANITIZE=1 bash run-checks.sh
```

**Rubric:** correct handling of partial reads and EOF 45%; error/interrupt handling 20%; reproduction and tests 20%; clear technical report 15%.

All fixtures are synthetic, local, and intentionally safe. Practice checks are visible; there is no hidden or verified grader here.
