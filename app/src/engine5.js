/* C Programming lab pack (Course 1). The learner edits logutil.c, which must
   define three functions. `gcc` does a structural compile check; `make test`
   (and `./logutil-tests`) actually RUN each function through the C interpreter
   against a battery of inputs — including hidden ones — so a correct fix
   generalizes and a hardcoded answer fails. The shipped file has one real bug
   per function for the learner to find and fix. */

var CI = (typeof window !== "undefined" && window.CI) ? window.CI : require("./cinterp.js");

var BUGGY = [
  "/* logutil.c - Northstar log helpers. Three functions, each has one bug. */",
  "",
  "/* count_char: how many times does character c appear in s? */",
  "int count_char(const char *s, char c) {",
  "    int n = 0;",
  "    for (int i = 0; i < strlen(s) - 1; i++) {  /* bug: misses the last character */",
  "        if (s[i] == c) n++;",
  "    }",
  "    return n;",
  "}",
  "",
  "/* to_int: parse a non-negative integer, or return -1 if s has any non-digit */",
  "int to_int(const char *s) {",
  "    int v = 0;",
  "    for (int i = 0; s[i] != 0; i++) {",
  "        v = v * 10 + (s[i] - '0');          /* bug: no digit validation */",
  "    }",
  "    return v;",
  "}",
  "",
  "/* longest_run: length of the longest run of consecutive c in s */",
  "int longest_run(const char *s, char c) {",
  "    int best = 0;",
  "    int cur = 0;",
  "    for (int i = 0; s[i] != 0; i++) {",
  "        if (s[i] == c) cur++;               /* bug: cur never resets on a miss */",
  "        if (cur > best) best = cur;",
  "    }",
  "    return best;",
  "}",
  "",
].join("\n");

// reference implementations, used only to COMPUTE expected answers
function refCountChar(s, c) { var n = 0; for (var i = 0; i < s.length; i++) if (s[i] === c) n++; return n; }
function refToInt(s) { if (!/^[0-9]*$/.test(s)) return -1; return s === "" ? 0 : parseInt(s, 10); }
function refLongestRun(s, c) { var best = 0, cur = 0; for (var i = 0; i < s.length; i++) { if (s[i] === c) { cur++; if (cur > best) best = cur; } else cur = 0; } return best; }

// test batteries (visible + hidden); each case: [args..., expected]
var TESTS = {
  count_char: [["banana", "a"], ["", "x"], ["aaaa", "a"], ["mississippi", "s"], ["edge", "e"]],
  to_int: [["0"], ["2048"], [""], ["20x8"], ["00042"], ["9a"]],
  longest_run: [["aabbbbac", "b"], ["xyz", "b"], ["", "a"], ["cccc", "c"], ["abcabc", "a"]],
};
function expectedFor(name, args) {
  if (name === "count_char") return refCountChar(args[0], args[1]);
  if (name === "to_int") return refToInt(args[0]);
  if (name === "longest_run") return refLongestRun(args[0], args[1]);
}
function toCArgs(name, args) { // convert JS test args to interpreter args (char -> code)
  if (name === "count_char" || name === "longest_run") return [args[0], args[1].charCodeAt(0)];
  return [args[0]];
}

// Run the whole test suite against the learner's source. Returns per-function results.
function runTests(src) {
  var chk = CI.compileCheck(src, ["count_char", "to_int", "longest_run"]);
  if (!chk.ok) return { compiled: false, error: chk.error, funcs: {} };
  var funcs = chk.funcs, results = {};
  Object.keys(TESTS).forEach(function (name) {
    var cases = TESTS[name], passed = 0, firstFail = null;
    for (var i = 0; i < cases.length; i++) {
      var args = cases[i], want = expectedFor(name, args), got, errMsg = null;
      try { got = CI.runFunc(funcs, name, toCArgs(name, args)); }
      catch (e) { if (e.cError) { errMsg = e.message; } else throw e; }
      if (errMsg === null && got === want) passed++;
      else if (!firstFail) firstFail = { args: args, want: want, got: errMsg ? ("runtime error: " + errMsg) : got };
    }
    results[name] = { passed: passed, total: cases.length, firstFail: firstFail };
  });
  return { compiled: true, funcs: funcs, results: results };
}

function installC(shell) {
  shell._addDirs(["src", "answers"]);
  shell._addFiles({ "src/logutil.c": { content: BUGGY, mode: "644" } });

  function readSrc() { var f = shell._fs()[shell._root("src/logutil.c")]; return f ? f.content : null; }

  // gcc / cc: a structural compile check that reports like a compiler
  function gcc(a) {
    var rest = shell._parseFlags(a).rest;
    var file = rest.find(function (x) { return /\.c$/.test(x); });
    if (!file) return { out: "", err: "gcc: no input files", code: 1 };
    var node = shell._fs()[shell._norm(file)];
    if (!node) return { out: "", err: "gcc: " + file + ": No such file or directory", code: 1 };
    var chk = CI.compileCheck(node.content, []);
    if (!chk.ok) return { out: "", err: file + ": error: " + chk.error, code: 1 };
    return { out: "", code: 0 };
  }
  shell._addCommand("gcc", gcc);
  shell._addCommand("cc", gcc);

  function testRunner() {
    var src = readSrc();
    if (src === null) return { out: "", err: "no src/logutil.c", code: 1 };
    var r = runTests(src);
    if (!r.compiled) return { out: "logutil.c: compile error\n  " + r.error, err: "", code: 1 };
    var lines = ["Running logutil tests..."], allPass = true;
    ["count_char", "to_int", "longest_run"].forEach(function (name) {
      var res = r.results[name], ok = res.passed === res.total;
      if (!ok) allPass = false;
      var line = "  " + (ok ? "ok  " : "FAIL") + " " + name + "  (" + res.passed + "/" + res.total + ")";
      if (!ok && res.firstFail) {
        var ff = res.firstFail;
        line += "\n       first failing case: " + name + "(" + ff.args.map(function (x) { return JSON.stringify(x); }).join(", ") + ") expected " + ff.want + ", got " + ff.got;
      }
      lines.push(line);
    });
    lines.push(allPass ? "All tests passed." : "Some tests failed.");
    return { out: lines.join("\n"), code: allPass ? 0 : 1 };
  }
  shell._addCommand("make", function (a) {
    var target = shell._parseFlags(a).rest[0] || "";
    if (target && target !== "test") return { out: "make: nothing to be done for '" + target + "'", code: 0 };
    return testRunner();
  });
  shell._addCommand("run-tests", testRunner);  // plain alias, no ./ needed

  // expose results so the app's checker can grade per function
  shell.cTestResults = function () { var s = readSrc(); return s === null ? null : runTests(s); };
}

if (typeof module !== "undefined") module.exports = { installC: installC, runTests: runTests, BUGGY: BUGGY };
