/* Sockets & Protocols lab pack. Northstar's internal status service speaks
   NSP/1, a tiny length-prefixed protocol over TCP. The learner:
     1. talks to it by hand with `nc` (crafting valid frames),
     2. fixes the C framing code a client uses to find frame boundaries, and
     3. makes it work on a byte STREAM: TCP delivers bytes in arbitrary
        segments, so a header can be split across reads and several frames can
        arrive in one read. The receive buffer is also reused, so bytes past `n`
        are stale garbage from an earlier read and must never be trusted.
   The framing functions run in the C interpreter against batteries that
   include split headers, coalesced frames and stale-buffer cases, plus a
   client harness (`nsp-client`) that streams real server replies through the
   learner's code with visible and hidden segment boundaries. */

var CI = (typeof window !== "undefined" && window.CI) ? window.CI : require("./cinterp.js");

var NSP_HOST = "status.northstar.internal", NSP_PORT = 7070, NSP_MAX = 1024;
var NSP_BUILD = "build=7f3a2c";

function nspFrame(p) { var l = String(p.length); return "0000".slice(l.length) + l + ":" + p; }

var NSP_SPEC = [
  "# NSP/1 — Northstar Status Protocol",
  "",
  "Transport: TCP. Server: " + NSP_HOST + ":" + NSP_PORT,
  "",
  "## Framing",
  "Every message (both directions) is one frame:",
  "",
  "    LLLL:payload",
  "",
  "- LLLL  exactly 4 ASCII decimal digits: the payload length in bytes (0000-1024)",
  "- ':'   a single colon",
  "- payload  exactly LLLL bytes. No terminator; no newline.",
  "",
  "A frame's total size on the wire is 5 + LLLL.",
  "Lengths over 1024 are a protocol error: drop the connection, don't allocate.",
  "",
  "Example:  0004:PING   ->  server replies  0004:PONG",
  "",
  "## Commands (request payloads)",
  "PING     liveness check",
  "STATUS   service status and build id",
  "HELP     list commands",
  "",
  "## TCP is a stream, not messages",
  "recv() returns whatever bytes have arrived: part of a frame, exactly one, or",
  "several back to back. A header can be split across two reads. The receiver",
  "must buffer and only act on COMPLETE frames.",
  "",
  "Our client reuses one receive buffer, so bytes beyond the n received in this",
  "connection are leftovers from an earlier one. Only buf[0..n-1] is valid.",
  "",
].join("\n");

var NSP_SRC = [
  "/* nspframe.c - framing for the NSP/1 client (see docs/NSP.md).",
  " * buf holds the bytes received so far; ONLY buf[0..n-1] are valid.",
  " * (The buffer is reused - anything past n is stale data.) */",
  "",
  "/* frame_len: look at the frame header starting at buf[start].",
  " *   returns 0   if fewer than 5 bytes are available from start (need more data)",
  " *   returns -1  if the header is malformed or the length exceeds 1024",
  " *   otherwise returns the frame's total size (5 + payload length),",
  " *   even if the payload hasn't fully arrived yet. */",
  "int frame_len(const char *buf, int start, int n) {",
  "    int len = 0;",
  "    for (int i = 0; i < 4; i++) {",
  "        char c = buf[start + i];",
  "        if (c < '0' || c > '9') return -1;",
  "        len = len * 10 + (c - '0');",
  "    }",
  "    if (buf[start + 4] != ':') return -1;",
  "    return 5 + len;",
  "}",
  "",
  "/* frames_in: how many COMPLETE frames are at the start of buf[0..n-1]?",
  " *   counts consecutive complete frames from offset 0, stopping at the first",
  " *   incomplete one; returns -1 if a malformed header is found on the way. */",
  "int frames_in(const char *buf, int n) {",
  "    int len = frame_len(buf, 0, n);",
  "    if (len < 0) return -1;",
  "    if (len > 0 && len <= n) return 1;",
  "    return 0;",
  "}",
  "",
].join("\n");

var CLIENT_LOOP = [
  "/* client_loop.c - how nspframe.c is used (reference only; the lab harness",
  " * `nsp-client` runs this loop for you with your framing functions). */",
  "",
  "int fd = socket(AF_INET, SOCK_STREAM, 0);",
  "connect(fd, &status_addr, sizeof status_addr);       /* status.northstar.internal:7070 */",
  "send(fd, \"0006:STATUS0004:HELP\", 20, 0);              /* two requests, pipelined */",
  "",
  "char buf[4096];  int n = 0;  int off = 0;",
  "for (;;) {",
  "    int got = recv(fd, buf + n, sizeof buf - n, 0);   /* may return ANY number of bytes */",
  "    if (got <= 0) break;                              /* 0 = peer closed, <0 = error */",
  "    n += got;",
  "    for (;;) {                                        /* consume every complete frame */",
  "        int len = frame_len(buf, off, n);",
  "        if (len < 0) { close(fd); return PROTOCOL_ERROR; }",
  "        if (len == 0 || off + len > n) break;         /* need more bytes */",
  "        handle_payload(buf + off + 5, len - 5);",
  "        off += len;",
  "    }",
  "}",
  "",
].join("\n");

// ---------- reference implementations (compute expected answers only) ----------
function refFrameLen(buf, start, n) {
  if (n - start < 5) return 0;
  for (var i = 0; i < 4; i++) { var c = buf.charCodeAt(start + i); if (c < 48 || c > 57) return -1; }
  if (buf[start + 4] !== ":") return -1;
  var L = parseInt(buf.substr(start, 4), 10);
  return L > NSP_MAX ? -1 : 5 + L;
}
function refFramesIn(buf, n) {
  var off = 0, count = 0;
  while (off < n) {
    var L = refFrameLen(buf, off, n);
    if (L < 0) return -1;
    if (L === 0 || off + L > n) return count;
    count++; off += L;
  }
  return count;
}

// A case is [received, stale, start?]: buf = received + stale, n = received.length.
var STALE = "0099:stale-bytes-from-an-earlier-connection";
var NSP_TESTS = {
  frame_len: [
    ["0004:PING", "", 0], ["0004:PI", "", 0], ["000", "", 0], ["0004", "", 0], ["", "", 0],
    ["000", "4:PING" + STALE, 0], ["0004", ":PING" + STALE, 0], ["", STALE, 0],
    ["00x4:PING", "", 0], ["0004;PING", "", 0], ["9999:xxxx", "", 0], ["1025:", "", 0], ["1024:", "", 0], ["0000:", "", 0],
    ["0004:PING0002:ok", "", 9], ["0004:PING00", "02:ok" + STALE, 9], ["0004:PING0002:ok", "", 16],
  ],
  frames_in: [
    ["0004:PONG", ""], ["0004:PONG0002:ok", ""], ["0004:PONG00", "02:ok" + STALE], ["0004:PO", "NG"], ["", STALE],
    ["0004:PONGxx02:ok", ""], ["0000:0001:a", ""], ["0002:ab0002:cd0002:ef", ""], ["0002:ab0002:cd0002:e", "f"],
    ["0004:PONG0", "002:ok"], ["2000:", ""],
  ],
};
// Server reply stream used by the client harness, and the segmentations it's delivered in.
var REPLY_STREAM = nspFrame("ok uptime=3d " + NSP_BUILD) + nspFrame("commands: PING STATUS HELP");
var SEGMENTS = {
  visible: [3, 9, 14, 30, REPLY_STREAM.length],                 // header split, then two frames in one read
  hidden: [[2, 4, 5, 31, 33, 36, REPLY_STREAM.length], [REPLY_STREAM.length], [1, 2, 3, 4, 5, 6, 7, 8, 40, 61, REPLY_STREAM.length]],
};

function nspArgs(name, c) {
  var buf = c[0] + c[1];
  return name === "frame_len" ? [buf, c[2], c[0].length] : [buf, c[0].length];
}
function nspWant(name, c) { return name === "frame_len" ? refFrameLen(c[0] + c[1], c[2], c[0].length) : refFramesIn(c[0] + c[1], c[0].length); }

// Stream REPLY_STREAM through the learner's frame_len in the given segments.
// Mirrors client_loop.c: buffer accumulates; stale bytes sit past n.
function runClient(funcs, cuts) {
  var log = [], payloads = [], off = 0, prev = 0, ok = true, err = null;
  for (var s = 0; s < cuts.length && !err; s++) {
    var n = cuts[s], got = n - prev; prev = n;
    var buf = REPLY_STREAM.slice(0, n) + STALE;
    log.push("recv() -> " + got + " byte" + (got === 1 ? "" : "s") + "   " + JSON.stringify(REPLY_STREAM.slice(n - got, n)));
    for (var guard = 0; guard < 50; guard++) {
      var len;
      try { len = CI.runFunc(funcs, "frame_len", [buf, off, n]); }
      catch (e) { if (!e.cError) throw e; err = "crash in frame_len: " + e.message; break; }
      if (len < 0) { err = "frame_len returned -1 (protocol error) at offset " + off + " — client closed the connection"; break; }
      if (len === 0 || off + len > n) break;
      var pl = buf.slice(off + 5, off + len);
      payloads.push(pl); log.push("   frame complete (" + len + " bytes) <- " + JSON.stringify(pl));
      off += len;
    }
    var count;
    try { count = CI.runFunc(funcs, "frames_in", [buf, n]); } catch (e) { if (!e.cError) throw e; count = "crash: " + e.message; }
    var want = refFramesIn(buf, n);
    if (count !== want) { ok = false; log.push("   frames_in(buf, " + n + ") = " + count + "  (expected " + want + ")"); }
  }
  var expectPl = ["ok uptime=3d " + NSP_BUILD, "commands: PING STATUS HELP"];
  if (err) { ok = false; log.push("   " + err); }
  if (JSON.stringify(payloads) !== JSON.stringify(expectPl)) ok = false;
  return { ok: ok, log: log, payloads: payloads };
}

function runNspTests(src) {
  var chk = CI.compileCheck(src, ["frame_len", "frames_in"]);
  if (!chk.ok) return { compiled: false, error: chk.error, results: {} };
  var results = {};
  ["frame_len", "frames_in"].forEach(function (name) {
    var cases = NSP_TESTS[name], passed = 0, firstFail = null;
    cases.forEach(function (c) {
      var want = nspWant(name, c), got, err = null;
      try { got = CI.runFunc(chk.funcs, name, nspArgs(name, c)); } catch (e) { if (e.cError) err = e.message; else throw e; }
      if (err === null && got === want) passed++;
      else if (!firstFail) firstFail = { c: c, want: want, got: err ? "runtime error: " + err : got };
    });
    results[name] = { passed: passed, total: cases.length, firstFail: firstFail };
  });
  var client = { visible: runClient(chk.funcs, SEGMENTS.visible), hidden: SEGMENTS.hidden.map(function (h) { return runClient(chk.funcs, h).ok; }) };
  return { compiled: true, funcs: chk.funcs, results: results, client: client };
}

// The server: parse a request byte stream, reply frame by frame.
function nspServe(req) {
  var out = "", off = 0, notes = [];
  while (off < req.length) {
    var hdr = req.substr(off, 5);
    if (hdr.length < 5) { notes.push("server waiting for the rest of a header (" + hdr.length + "/5 bytes) — connection timed out"); break; }
    if (!/^[0-9]{4}:$/.test(hdr)) { out += nspFrame("ERR framing: expected 4 digits and ':' (got " + JSON.stringify(hdr) + ")"); notes.push("server closed the connection"); break; }
    var L = parseInt(hdr.slice(0, 4), 10);
    if (L > NSP_MAX) { out += nspFrame("ERR length " + L + " exceeds 1024"); notes.push("server closed the connection"); break; }
    var pl = req.substr(off + 5, L);
    if (pl.length < L) { notes.push("server waiting for " + (L - pl.length) + " more payload byte" + (L - pl.length === 1 ? "" : "s") + " (header said " + L + ") — connection timed out"); break; }
    var cmd = pl.trim().toUpperCase();
    if (cmd === "PING") out += nspFrame("PONG");
    else if (cmd === "STATUS") out += nspFrame("ok uptime=3d " + NSP_BUILD);
    else if (cmd === "HELP") out += nspFrame("commands: PING STATUS HELP");
    else out += nspFrame("ERR unknown command " + JSON.stringify(pl));
    off += 5 + L;
  }
  return { out: out, notes: notes };
}

function installSockets(shell) {
  shell._addDirs(["docs", "src", "answers"]);
  shell._addFiles({
    "docs/NSP.md": { content: NSP_SPEC, mode: "644" },
    "src/nspframe.c": { content: NSP_SRC, mode: "644" },
    "src/client_loop.c": { content: CLIENT_LOOP, mode: "444" },
    "README.txt": { content: "NSP/1 client work. Spec: docs/NSP.md\n  printf '<frame>' | nc " + NSP_HOST + " " + NSP_PORT + "   talk to the server\n  make test        framing tests (split headers, coalesced frames, stale buffers)\n  nsp-client       run the real client loop over a segmented TCP stream\n", mode: "644" },
  });
  var hosts = {}; hosts[NSP_HOST] = "10.0.5.20"; hosts["status"] = "10.0.5.20";
  var state = { pong: false, status: false };

  shell._addCommand("nc", function (a, stdin) {
    var p = shell._parseFlags(a), rest = p.rest;
    if (rest.length < 2) return { out: "", err: "usage: <data> | nc <host> <port>", code: 2 };
    var host = rest[0], port = parseInt(rest[1], 10);
    if (!hosts[host] && host !== "10.0.5.20") return { out: "", err: "nc: getaddrinfo for host \"" + host + "\" port " + rest[1] + ": Name or service not known", code: 1 };
    if (port !== NSP_PORT) return { out: "", err: "nc: connect to " + host + " port " + port + " (tcp) failed: Connection refused", code: 1 };
    var req = (stdin || "").replace(/\n$/, "");
    if (!req) return { out: "(connected; nothing sent. Pipe a frame in: printf '0004:PING' | nc " + host + " " + port + ")", code: 0 };
    var r = nspServe(req);
    if (r.out.indexOf("PONG") >= 0) state.pong = true;
    if (r.out.indexOf(NSP_BUILD) >= 0) state.status = true;
    var lines = [];
    if (r.out) lines.push(r.out);
    r.notes.forEach(function (n) { lines.push("nc: " + n); });
    return { out: lines.join("\n"), code: 0 };
  });

  function readSrc() { var f = shell._fs()[shell._root("src/nspframe.c")]; return f ? f.content : null; }
  function gcc(a) {
    var file = shell._parseFlags(a).rest.find(function (x) { return /\.c$/.test(x); });
    if (!file) return { out: "", err: "gcc: no input files", code: 1 };
    if (/client_loop\.c$/.test(file)) return { out: "", err: file + ": reference only — needs the full socket headers; the lab's nsp-client runs this loop for you", code: 1 };
    var node = shell._fs()[shell._norm(file)];
    if (!node) return { out: "", err: "gcc: " + file + ": No such file or directory", code: 1 };
    var chk = CI.compileCheck(node.content, []);
    return chk.ok ? { out: "", code: 0 } : { out: "", err: file + ": error: " + chk.error, code: 1 };
  }
  shell._addCommand("gcc", gcc); shell._addCommand("cc", gcc);

  function show(c) { return c.map(function (x) { return JSON.stringify(x); }).join(", "); }
  function runner() {
    var src = readSrc(); if (src === null) return { out: "", err: "no src/nspframe.c", code: 1 };
    var r = runNspTests(src);
    if (!r.compiled) return { out: "nspframe.c: compile error\n  " + r.error, code: 1 };
    var lines = ["Running NSP framing tests..."], all = true;
    ["frame_len", "frames_in"].forEach(function (nm) {
      var x = r.results[nm], ok = x.passed === x.total; if (!ok) all = false;
      var line = "  " + (ok ? "ok  " : "FAIL") + " " + nm + "  (" + x.passed + "/" + x.total + ")";
      if (!ok) {
        var c = x.firstFail.c, buf = c[0] + c[1];
        var call = nm === "frame_len" ? "frame_len(buf, " + c[2] + ", " + c[0].length + ")" : "frames_in(buf, " + c[0].length + ")";
        line += "\n       first failing case: " + call + "  expected " + x.firstFail.want + ", got " + x.firstFail.got +
          "\n       buf = " + JSON.stringify(c[0]) + (c[1] ? " + stale " + JSON.stringify(c[1].slice(0, 16) + (c[1].length > 16 ? "..." : "")) : "") + "   (valid bytes: " + c[0].length + ")";
      }
      lines.push(line);
    });
    var hid = r.client.hidden.filter(Boolean).length;
    lines.push("  " + (r.client.visible.ok && hid === r.client.hidden.length ? "ok  " : "FAIL") + " client stream  (visible segmentation " + (r.client.visible.ok ? "ok" : "fails") + ", hidden " + hid + "/" + r.client.hidden.length + ")");
    if (!(r.client.visible.ok && hid === r.client.hidden.length)) all = false;
    lines.push(all ? "All tests passed." : "Some tests failed.");
    return { out: lines.join("\n"), code: all ? 0 : 1 };
  }
  shell._addCommand("make", function (a) { var t = shell._parseFlags(a).rest[0] || ""; if (t && t !== "test") return { out: "make: nothing to be done for '" + t + "'", code: 0 }; return runner(); });
  shell._addCommand("run-tests", runner);

  shell._addCommand("nsp-client", function () {
    var src = readSrc(); if (src === null) return { out: "", err: "no src/nspframe.c", code: 1 };
    var chk = CI.compileCheck(src, ["frame_len", "frames_in"]);
    if (!chk.ok) return { out: "", err: "nsp-client: build failed: " + chk.error, code: 1 };
    var r = runClient(chk.funcs, SEGMENTS.visible);
    var out = ["connect(" + NSP_HOST + ":" + NSP_PORT + ") ok", "send() 20 bytes  \"0006:STATUS0004:HELP\""].concat(r.log);
    out.push(r.ok ? "close()  — 2 replies received, all frames accounted for" : "close()  — client did not receive both replies correctly");
    return { out: out.join("\n"), code: r.ok ? 0 : 1 };
  });

  shell.nspResults = function () { var s = readSrc(); return s === null ? null : runNspTests(s); };
  shell.nspState = function () { return { pong: state.pong, status: state.status }; };
  var baseReset = shell.reset;
  shell.reset = function () { state.pong = false; state.status = false; return baseReset.apply(shell, arguments); };
}

if (typeof module !== "undefined") module.exports = { installSockets: installSockets, runNspTests: runNspTests, nspServe: nspServe, NSP_SRC: NSP_SRC, refFramesIn: refFramesIn };
