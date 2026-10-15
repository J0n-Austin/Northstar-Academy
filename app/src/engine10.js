/* Secure Coding lab pack (defensive). The learner hardens netparse.c — three
   input-handling functions that trust their callers. Each one is "correct" for
   friendly input and wrong (or crashes) for hostile input. `make test` runs
   them through the C interpreter against adversarial batteries (including
   hidden cases), so the fix has to be real validation, not a special case.
   Out-of-bounds reads are trapped and reported, the way a sanitizer would. */

var CI = (typeof window !== "undefined" && window.CI) ? window.CI : require("./cinterp.js");

var SEC_SRC = [
  "/* netparse.c - parsing helpers for the config loader.",
  " * All three trust their input. Make each one safe for ANY input:",
  " * never read past the end of a string, and reject values that are out of range. */",
  "",
  "/* checksum: sum of the first len bytes of s.",
  " * Must return -1 if len is negative or longer than the string. */",
  "int checksum(const char *s, int len) {",
  "    int sum = 0;",
  "    for (int i = 0; i < len; i++) {",
  "        sum = sum + s[i];",
  "    }",
  "    return sum;",
  "}",
  "",
  "/* parse_port: a TCP port from a decimal string.",
  " * Must return -1 for empty input, any non-digit, or a value outside 1..65535. */",
  "int parse_port(const char *s) {",
  "    int p = 0;",
  "    if (s[0] == 0) return -1;",
  "    for (int i = 0; s[i] != 0; i++) {",
  "        if (s[i] < '0' || s[i] > '9') return -1;",
  "        p = p * 10 + (s[i] - '0');",
  "    }",
  "    return p;",
  "}",
  "",
  "/* copy_len: how many bytes may be copied from s into a buffer of size max.",
  " * Must never exceed max (and never exceed the string). Return 0 if max < 0. */",
  "int copy_len(const char *s, int max) {",
  "    return strlen(s);",
  "}",
  "",
].join("\n");

var SEC_FUNCS = ["checksum", "parse_port", "copy_len"];

function refChecksum(s, len) { if (len < 0 || len > s.length) return -1; var t = 0; for (var i = 0; i < len; i++) t += s.charCodeAt(i); return t; }
function refParsePort(s) { if (!/^[0-9]+$/.test(s)) return -1; if (s.length > 6) return -1; var v = parseInt(s, 10); return v >= 1 && v <= 65535 ? v : -1; }
function refCopyLen(s, max) { if (max < 0) return 0; return Math.min(s.length, max); }

// visible + hidden adversarial cases. Each: args array.
var SEC_TESTS = {
  checksum:   [["abc", 3], ["abc", 0], ["abc", 2], ["abc", 4], ["", 1], ["key", -1], ["northstar", 9], ["x", 50]],
  parse_port: [["80"], ["8443"], ["65535"], ["65536"], ["0"], ["99999"], [""], ["80a"], ["00443"], ["1"]],
  copy_len:   [["hello", 10], ["hello", 3], ["hello", 5], ["", 4], ["abc", 0], ["abc", -2], ["a-much-longer-header-value", 16]],
};
function secExpected(name, a) { return name === "checksum" ? refChecksum(a[0], a[1]) : name === "parse_port" ? refParsePort(a[0]) : refCopyLen(a[0], a[1]); }

function runSecTests(src) {
  var chk = CI.compileCheck(src, SEC_FUNCS);
  if (!chk.ok) return { compiled: false, error: chk.error, results: {} };
  var results = {};
  SEC_FUNCS.forEach(function (name) {
    var cases = SEC_TESTS[name], passed = 0, firstFail = null, traps = 0, firstTrap = null;
    cases.forEach(function (args) {
      var want = secExpected(name, args), got, err = null;
      try { got = CI.runFunc(chk.funcs, name, args.slice()); }
      catch (e) { if (e.cError) err = e.message; else throw e; }
      if (err) { traps++; if (!firstTrap) firstTrap = { args: args, msg: err }; }
      if (err === null && got === want) passed++;
      else if (!firstFail) firstFail = { args: args, want: want, got: err ? "SANITIZER: " + err : got };
    });
    results[name] = { passed: passed, total: cases.length, traps: traps, firstFail: firstFail, firstTrap: firstTrap };
  });
  return { compiled: true, results: results };
}

function installSecure(shell) {
  shell._addDirs(["src", "answers"]);
  shell._addFiles({
    "src/netparse.c": { content: SEC_SRC, mode: "644" },
    "README.txt": { content: "netparse hardening.\n  make test        run the adversarial test suite (with an out-of-bounds sanitizer)\n  gcc src/netparse.c   compile check\nEdit with: edit src/netparse.c\n", mode: "644" },
  });
  function readSrc() { var f = shell._fs()[shell._root("src/netparse.c")]; return f ? f.content : null; }

  function gcc(a) {
    var file = shell._parseFlags(a).rest.find(function (x) { return /\.c$/.test(x); });
    if (!file) return { out: "", err: "gcc: no input files", code: 1 };
    var node = shell._fs()[shell._norm(file)];
    if (!node) return { out: "", err: "gcc: " + file + ": No such file or directory", code: 1 };
    var chk = CI.compileCheck(node.content, []);
    return chk.ok ? { out: "", code: 0 } : { out: "", err: file + ": error: " + chk.error, code: 1 };
  }
  shell._addCommand("gcc", gcc);
  shell._addCommand("cc", gcc);

  function runner() {
    var src = readSrc();
    if (src === null) return { out: "", err: "no src/netparse.c", code: 1 };
    var r = runSecTests(src);
    if (!r.compiled) return { out: "netparse.c: compile error\n  " + r.error, code: 1 };
    var lines = ["Running netparse adversarial tests (sanitizer on)..."], all = true;
    SEC_FUNCS.forEach(function (n) {
      var x = r.results[n], ok = x.passed === x.total; if (!ok) all = false;
      var line = "  " + (ok ? "ok  " : "FAIL") + " " + n + "  (" + x.passed + "/" + x.total + ")" + (x.traps ? "  [" + x.traps + " sanitizer trap" + (x.traps > 1 ? "s" : "") + "]" : "");
      if (!ok && x.firstFail) line += "\n       first failing case: " + n + "(" + x.firstFail.args.map(function (v) { return JSON.stringify(v); }).join(", ") + ") expected " + x.firstFail.want + ", got " + x.firstFail.got;
      if (x.firstTrap) line += "\n       SANITIZER: " + x.firstTrap.msg + "  in " + n + "(" + x.firstTrap.args.map(function (v) { return JSON.stringify(v); }).join(", ") + ")";
      lines.push(line);
    });
    lines.push(all ? "All tests passed. No sanitizer findings." : "Some tests failed.");
    return { out: lines.join("\n"), code: all ? 0 : 1 };
  }
  shell._addCommand("make", function (a) { var t = shell._parseFlags(a).rest[0] || ""; if (t && t !== "test") return { out: "make: nothing to be done for '" + t + "'", code: 0 }; return runner(); });
  shell._addCommand("run-tests", runner);
  shell.secResults = function () { var s = readSrc(); return s === null ? null : runSecTests(s); };
}

if (typeof module !== "undefined") module.exports = { installSecure: installSecure, runSecTests: runSecTests, SEC_SRC: SEC_SRC };
