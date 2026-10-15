const { createShell } = require("./engine.js");
const { installSecure, runSecTests, SEC_SRC } = require("./engine10.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };
const all = (r, n) => r.results[n].passed === r.results[n].total;

var r = runSecTests(SEC_SRC);
ok("shipped file compiles", r.compiled);
ok("checksum fails as shipped", !all(r, "checksum"));
ok("checksum failure includes a sanitizer trap (OOB read)", r.results.checksum.traps > 0);
ok("parse_port fails as shipped (no range check)", !all(r, "parse_port"));
ok("copy_len fails as shipped (ignores max)", !all(r, "copy_len"));

var FIXED = SEC_SRC
  .replace("    int sum = 0;\n", "    int sum = 0;\n    if (len < 0 || len > strlen(s)) return -1;\n")
  .replace("        p = p * 10 + (s[i] - '0');\n    }\n    return p;",
           "        p = p * 10 + (s[i] - '0');\n        if (p > 65535) return -1;\n    }\n    if (p < 1) return -1;\n    return p;")
  .replace("    return strlen(s);", "    if (max < 0) return 0;\n    int n = strlen(s);\n    if (n > max) return max;\n    return n;");
var rf = runSecTests(FIXED);
ok("fixed checksum passes", all(rf, "checksum"));
ok("fixed parse_port passes", all(rf, "parse_port"));
ok("fixed copy_len passes", all(rf, "copy_len"));

// a range check placed only after the loop also passes (p can't overflow in the sim for 6 digits)
var ALT = FIXED.replace("        if (p > 65535) return -1;\n    }\n    if (p < 1) return -1;", "    }\n    if (p < 1 || p > 65535) return -1;");
ok("alternative parse_port (check after loop) passes", all(runSecTests(ALT), "parse_port"));

// special-casing the visible example doesn't pass the battery
var CHEAT = SEC_SRC.replace("    return strlen(s);", "    if (max == 3) return 3;\n    return strlen(s);");
ok("special-cased copy_len fails hidden cases", !all(runSecTests(CHEAT), "copy_len"));
// clamping only the upper bound misses len<0
var HALF = SEC_SRC.replace("    int sum = 0;\n", "    int sum = 0;\n    if (len > strlen(s)) return -1;\n");
ok("checksum without negative-len check still fails", !all(runSecTests(HALF), "checksum"));

var sh = createShell(); installSecure(sh);
ok("gcc compiles the shipped file", sh.run("gcc src/netparse.c").code === 0);
var mt = sh.run("make test");
ok("make test fails on shipped file", mt.code === 1);
ok("make test reports the sanitizer", /SANITIZER: out-of-bounds read/.test(mt.out));
sh.writeFile("src/netparse.c", FIXED);
ok("make test passes after hardening", sh.run("make test").code === 0);
ok("secResults exposes state", all(sh.secResults(), "parse_port"));
sh.reset();
ok("reset restores the original", /return strlen\(s\);/.test(sh.fileContent("src/netparse.c")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
