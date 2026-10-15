const { createShell } = require("./engine.js");
const { installSockets, runNspTests, nspServe, NSP_SRC } = require("./engine13.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };
const all = (r, n) => r.results[n].passed === r.results[n].total;
const clientOk = (r) => r.client.visible.ok && r.client.hidden.every(Boolean);

// server behaviour
ok("server answers PING", nspServe("0004:PING").out === "0004:PONG");
ok("server handles pipelined requests", nspServe("0004:PING0006:STATUS").out.indexOf("0004:PONG0025:ok uptime=3d build=7f3a2c") === 0);
ok("server rejects a bad header", /ERR framing/.test(nspServe("PING STATUS").out));
ok("server waits on a short header", /rest of a header/.test(nspServe("PING").notes[0]));
ok("server waits on short payload", /waiting for 2 more/.test(nspServe("0006:STAT").notes[0]));
ok("server rejects oversized length", /exceeds 1024/.test(nspServe("2000:x").out));

// shipped code fails
const r0 = runNspTests(NSP_SRC);
ok("shipped file compiles", r0.compiled);
ok("frame_len fails as shipped", !all(r0, "frame_len"));
ok("frames_in fails as shipped", !all(r0, "frames_in"));
ok("client stream fails as shipped", !clientOk(r0));

// fix frame_len only
const FL = NSP_SRC.replace("    int len = 0;\n    for (int i = 0; i < 4; i++) {", "    int len = 0;\n    if (n - start < 5) return 0;\n    for (int i = 0; i < 4; i++) {")
  .replace("    if (buf[start + 4] != ':') return -1;\n    return 5 + len;", "    if (buf[start + 4] != ':') return -1;\n    if (len > 1024) return -1;\n    return 5 + len;");
const r1 = runNspTests(FL);
ok("fixed frame_len passes", all(r1, "frame_len"));
ok("frames_in still fails with one-frame assumption", !all(r1, "frames_in"));
ok("client still fails (coalesced frames counted wrong)", !clientOk(r1));

// fix frames_in
const FULL = FL.replace("    int len = frame_len(buf, 0, n);\n    if (len < 0) return -1;\n    if (len > 0 && len <= n) return 1;\n    return 0;",
  "    int off = 0;\n    int count = 0;\n    while (off < n) {\n        int len = frame_len(buf, off, n);\n        if (len < 0) return -1;\n        if (len == 0 || off + len > n) return count;\n        count++;\n        off += len;\n    }\n    return count;");
const r2 = runNspTests(FULL);
ok("fixed frames_in passes", all(r2, "frames_in"));
ok("client passes visible + hidden segmentations", clientOk(r2));

// using strlen instead of n is the classic mistake: stale bytes break it
const STRLEN = FULL.replace("    if (n - start < 5) return 0;", "    if (strlen(buf) - start < 5) return 0;");
ok("frame_len using strlen (not n) fails the stale-buffer cases", !all(runNspTests(STRLEN), "frame_len"));
// forgetting the max-length check
ok("missing max length check fails", !all(runNspTests(FULL.replace("    if (len > 1024) return -1;\n", "")), "frame_len"));

// shell
const sh = createShell(); installSockets(sh);
ok("spec readable", /LLLL:payload/.test(sh.run("cat docs/NSP.md").out));
ok("nc PING round trip", sh.run("printf '0004:PING' | nc status.northstar.internal 7070").out === "0004:PONG");
ok("echo also works (trailing newline ignored)", sh.run("echo 0004:PING | nc status.northstar.internal 7070").out === "0004:PONG");
ok("wrong port is refused", /Connection refused/.test(sh.run("echo 0004:PING | nc status.northstar.internal 80").err));
ok("unknown host fails", sh.run("echo x | nc nope 7070").code === 1);
const st = sh.run("printf '0006:STATUS' | nc status.northstar.internal 7070").out;
ok("STATUS reveals build id", /build=7f3a2c/.test(st));
ok("nspState records status", sh.nspState().status);
ok("bad length shows server waiting", /waiting/.test(sh.run("printf '0005:PING' | nc status.northstar.internal 7070").out));
ok("make test fails on shipped", sh.run("make test").code === 1);
ok("make test shows buffer context", /valid bytes: 3/.test(sh.run("make test").out));
sh.writeFile("src/nspframe.c", sh.fileContent("src/nspframe.c").replace("    int len = 0;\n    for", "    int len = 0;\n    if (strlen(buf) - start < 5) return 0;\n    for"));
ok("a strlen-based fix surfaces the stale-buffer case", /\+ stale/.test(sh.run("make test").out));
sh.reset();
ok("nsp-client fails on shipped", sh.run("nsp-client").code === 1);
sh.writeFile("src/nspframe.c", FULL);
ok("make test passes after fixes", sh.run("make test").code === 0);
const cl = sh.run("nsp-client");
ok("nsp-client succeeds and shows recv() segments", cl.code === 0 && /recv\(\) -> 3 bytes/.test(cl.out) && /commands: PING STATUS HELP/.test(cl.out));
ok("gcc refuses the reference-only socket file politely", /reference only/.test(sh.run("gcc src/client_loop.c").err));
sh.reset();
ok("reset restores buggy source", /if \(len > 0 && len <= n\) return 1;/.test(sh.fileContent("src/nspframe.c")));
ok("reset clears nc state", !sh.nspState().status);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
