const { createShell } = require("./engine.js");
const { installC, runTests, BUGGY } = require("./engine5.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };
const eq = (l, g, w) => { if (g === w) { console.log("PASS", l); pass++; } else { console.log("FAIL", l, "\n  got:", JSON.stringify(g), "\n  want:", JSON.stringify(w)); fail++; } };

// the shipped buggy file should NOT pass
var r = runTests(BUGGY);
ok("buggy file compiles", r.compiled);
ok("count_char fails as shipped (off-by-one)", r.results.count_char.passed < r.results.count_char.total);
ok("to_int fails as shipped (no validation)", r.results.to_int.passed < r.results.to_int.total);
ok("longest_run fails as shipped (no reset)", r.results.longest_run.passed < r.results.longest_run.total);

// the correctly fixed file passes everything
var FIXED = BUGGY
  .replace("i < strlen(s) - 1", "i < strlen(s)")                    // count_char: cover the whole string
  .replace("v = v * 10 + (s[i] - '0');          /* bug: no digit validation */",
           "if (s[i] < '0' || s[i] > '9') return -1;\n        v = v * 10 + (s[i] - '0');")
  .replace("if (s[i] == c) cur++;               /* bug: cur never resets on a miss */",
           "if (s[i] == c) cur++; else cur = 0;");
var rf = runTests(FIXED);
ok("fixed count_char passes all", rf.results.count_char.passed === rf.results.count_char.total);
ok("fixed to_int passes all", rf.results.to_int.passed === rf.results.to_int.total);
ok("fixed longest_run passes all", rf.results.longest_run.passed === rf.results.longest_run.total);

// a plausible alternative fix for count_char (NUL-terminator loop) also passes
var ALT = FIXED.replace("for (int i = 0; i < strlen(s); i++) {  /* bug: misses the last character */", "for (int i = 0; s[i] != 0; i++) {");
ok("alternative count_char loop also passes", runTests(ALT).results.count_char.passed === runTests(ALT).results.count_char.total);

// hardcoding fails the hidden cases
var CHEAT = BUGGY.replace(/int count_char\([^{]*\{[\s\S]*?\n\}/,
  "int count_char(const char *s, char c) {\n    return 3;   /* hardcoded for banana */\n}");
var rc = runTests(CHEAT);
ok("hardcoded count_char does NOT pass all cases", rc.results.count_char.passed < rc.results.count_char.total);

// the lab commands in a shell
var sh = createShell(); installC(sh);
ok("gcc on the shipped file compiles clean (code 0)", sh.run("gcc -Wall src/logutil.c").code === 0);
ok("make test fails on the buggy file", sh.run("make test").code === 1);
ok("make test names a failing function", /FAIL count_char/.test(sh.run("make test").out));
// fix it via the editor path (writeFile), then make test passes
sh.writeFile("src/logutil.c", FIXED);
ok("make test passes after fixes", sh.run("make test").code === 0);
ok("make test reports all passed", /All tests passed/.test(sh.run("make test").out));
ok("run-tests alias works too", sh.run("run-tests").code === 0);
ok("cTestResults exposes per-function state", sh.cTestResults().results.to_int.passed === sh.cTestResults().results.to_int.total);

// gcc catches a syntax error the learner might introduce
sh.writeFile("src/logutil.c", "int count_char(const char *s, char c) { return 0 }");
ok("gcc reports a syntax error (missing ;)", sh.run("gcc src/logutil.c").code === 1);

// reset restores the buggy file
sh.reset();
ok("reset restores the original buggy source", sh.fileContent("src/logutil.c").indexOf("i < strlen(s) - 1") >= 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
