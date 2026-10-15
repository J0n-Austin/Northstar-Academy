/* Debugging & Testing lab pack. A user-visible regression in textstats.c
   shipped because the test suite never covered it. The learner works the way
   a professional does:
     1. reproduce: write a failing test case from the bug report,
     2. localize: use (simulated) git history and `git bisect` — ideally
        `git bisect run make test`, which only works once step 1 is done —
        to find the commit that introduced it,
     3. fix it on main, commit, and keep the test as a regression guard.
   A `trace` command steps a function line by line (via the C interpreter's
   trace hook), so the learner can watch variables instead of guessing. */

var CI = (typeof window !== "undefined" && window.CI) ? window.CI : require("./cinterp.js");

// ---------- source building blocks ----------
var DBG_HDR = {
  h1: "/* textstats.c - small text helpers for the log summary page. */\n",
  h2: "/* textstats.c - small text helpers for the log summary page.\n * Words are separated by single spaces (ASCII 32). */\n",
  h3: "/* textstats.c - small text helpers for the log summary page.\n * Words are separated by spaces (ASCII 32); runs of spaces count once.\n * v1.3 */\n",
  h4: "/* textstats.c - small text helpers for the log summary page.\n * Words are separated by spaces (ASCII 32); runs of spaces count once.\n * v1.4 */\n",
  h5: "/* textstats.c - small text helpers for the log summary page.\n * Words are separated by spaces (ASCII 32); runs of spaces count once.\n *   word_count(\"deploy failed\")  -> 2\n *   upper_count(\"Deploy OK\")     -> 3\n * v1.4 */\n",
};
var DBG_WC = {
  g1: "int word_count(const char *s) {\n    int n = 0;\n    int in_word = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] == ' ') {\n            in_word = 0;\n        } else if (in_word == 0) {\n            in_word = 1;\n            n++;\n        }\n    }\n    return n;\n}\n",
  g2: "int word_count(const char *s) {\n    int n = 0;\n    int inside = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] == ' ') {\n            inside = 0;\n        } else if (inside == 0) {\n            inside = 1;\n            n++;\n        }\n    }\n    return n;\n}\n",
  bad: "int word_count(const char *s) {\n    if (s[0] == 0) return 0;\n    int n = 1;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] == ' ') n++;\n    }\n    return n;\n}\n",
  bad2: "int word_count(const char *s) {\n    if (s[0] == 0) {\n        return 0;\n    }\n    int n = 1;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] == ' ') {\n            n++;\n        }\n    }\n    return n;\n}\n",
};
var DBG_UC = {
  u1: "int upper_count(const char *s) {\n    int n = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] >= 65 && s[i] <= 90) n++;\n    }\n    return n;\n}\n",
  u2: "int upper_count(const char *s) {\n    int n = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] >= 'A' && s[i] <= 'Z') n++;\n    }\n    return n;\n}\n",
  u3: "int upper_count(const char *s) {\n    if (s[0] == 0) return 0;\n    int n = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] >= 'A' && s[i] <= 'Z') n++;\n    }\n    return n;\n}\n",
  u4: "/* upper_count: number of ASCII capital letters */\nint upper_count(const char *s) {\n    if (s[0] == 0) return 0;\n    int n = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] >= 'A' && s[i] <= 'Z') n++;\n    }\n    return n;\n}\n",
};

// oldest -> newest. The regression is f13b9d2, whose message doesn't say so.
var DBG_COMMITS = [
  { sha: "a1c09e2", date: "2026-09-08", author: "Lin Chen", msg: "textstats: add word_count and upper_count", h: "h1", w: "g1", u: "u1" },
  { sha: "b7f3d10", date: "2026-09-09", author: "Lin Chen", msg: "Document word separator", h: "h2", w: "g1", u: "u1" },
  { sha: "c22e8a4", date: "2026-09-14", author: "Ravi Jain", msg: "upper_count: use char literals instead of magic numbers", h: "h2", w: "g1", u: "u2" },
  { sha: "d90b1f7", date: "2026-09-17", author: "Ravi Jain", msg: "word_count: clearer variable name", h: "h2", w: "g2", u: "u2" },
  { sha: "e4a7c33", date: "2026-09-21", author: "Lin Chen", msg: "Clarify separator semantics, add version", h: "h3", w: "g2", u: "u2" },
  { sha: "f13b9d2", date: "2026-09-24", author: "Mo Okafor", msg: "Performance pass on hot paths", h: "h3", w: "bad", u: "u3" },
  { sha: "0a8e5c1", date: "2026-09-29", author: "Ravi Jain", msg: "upper_count: doc comment", h: "h3", w: "bad", u: "u4" },
  { sha: "19d4f7a", date: "2026-10-01", author: "Lin Chen", msg: "word_count: house brace style", h: "h3", w: "bad2", u: "u4" },
  { sha: "2b6e0c8", date: "2026-10-05", author: "Mo Okafor", msg: "Bump version to 1.4", h: "h4", w: "bad2", u: "u4" },
  { sha: "3f7a91d", date: "2026-10-08", author: "Lin Chen", msg: "Docs: usage examples in header", h: "h5", w: "bad2", u: "u4" },
];
var DBG_BAD_SHA = "f13b9d2";
function snapshotOf(c) { return DBG_HDR[c.h] + "\n" + DBG_WC[c.w] + "\n" + DBG_UC[c.u]; }

var DBG_CASES = [
  "# Regression tests for src/textstats.c  (run: make test)",
  "# format:  function \"input\" expected",
  "word_count \"hello world\" 2",
  "word_count \"one\" 1",
  "word_count \"\" 0",
  "upper_count \"Hello World\" 2",
  "upper_count \"abc\" 0",
  "",
].join("\n");

var BUG_REPORT = [
  "BUG-311  Log summary shows the wrong word count",
  "Reported by: support (via #ops-dashboard)",
  "",
  "The summary card for alert messages shows word counts that are too high.",
  "Example: the message \"  deploy failed \" (it has leading and trailing spaces",
  "from the alert template) shows as 5 words. It should be 2.",
  "",
  "This was right a few weeks ago - we noticed it after the 1.4 release.",
  "",
].join("\n");

// reference implementations
function refWordCount(s) { return s.split(" ").filter(function (x) { return x.length; }).length; }
function refUpperCount(s) { var n = 0; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if (c >= 65 && c <= 90) n++; } return n; }
var DBG_REF = { word_count: refWordCount, upper_count: refUpperCount };
var DBG_HIDDEN = {
  word_count: ["hello world", "  deploy failed ", "a  b", " ", "", "one", "   x", "x   ", "a b c d", "  "],
  upper_count: ["Hello World", "", "ABC", "aBc", "Z@[A", "no caps here"],
};

function parseCases(text) {
  var cases = [], errors = [];
  (text || "").split("\n").forEach(function (line, i) {
    var t = line.trim(); if (!t || t[0] === "#") return;
    var m = t.match(/^(\w+)\s+"((?:[^"\\]|\\.)*)"\s+(-?\d+)$/);
    if (!m) { errors.push({ line: i + 1, text: t }); return; }
    cases.push({ fn: m[1], input: m[2].replace(/\\(.)/g, "$1"), want: parseInt(m[3], 10), line: i + 1 });
  });
  return { cases: cases, errors: errors };
}
function callC(funcs, fn, input) {
  try { return { v: CI.runFunc(funcs, fn, [input]) }; } catch (e) { if (e.cError) return { err: e.message }; throw e; }
}
// does the learner's test file contain a correct test that the regression fails?
function findReproducer(casesText) {
  var bad = CI.parseProgram(snapshotOf(DBG_COMMITS[DBG_COMMITS.length - 1]));
  var p = parseCases(casesText);
  return p.cases.filter(function (c) {
    if (c.fn !== "word_count") return false;
    if (c.want !== refWordCount(c.input)) return false;   // the expectation itself must be right
    var r = callC(bad, "word_count", c.input);
    return r.err || r.v !== c.want;
  });
}
function battery(src) {
  var chk = CI.compileCheck(src, ["word_count", "upper_count"]);
  if (!chk.ok) return false;
  return Object.keys(DBG_HIDDEN).every(function (fn) {
    return DBG_HIDDEN[fn].every(function (inp) { var r = callC(chk.funcs, fn, inp); return !r.err && r.v === DBG_REF[fn](inp); });
  });
}

// minimal line diff (LCS) for git show / git diff
function lineDiff(a, b) {
  var A = a.split("\n"), B = b.split("\n"), n = A.length, m = B.length, L = [];
  for (var i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
  for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  var out = [], x = 0, y = 0;
  while (x < n && y < m) {
    if (A[x] === B[y]) { out.push(" " + A[x]); x++; y++; }
    else if (L[x + 1][y] >= L[x][y + 1]) { out.push("-" + A[x]); x++; }
    else { out.push("+" + B[y]); y++; }
  }
  while (x < n) out.push("-" + A[x++]);
  while (y < m) out.push("+" + B[y++]);
  // keep only changed lines with 2 lines of context
  var keep = out.map(function () { return false; });
  out.forEach(function (l, k) { if (l[0] !== " ") for (var d = -2; d <= 2; d++) if (out[k + d] !== undefined) keep[k + d] = true; });
  var res = [], gap = false;
  out.forEach(function (l, k) { if (keep[k]) { if (gap && res.length) res.push("@@"); res.push(l); gap = false; } else gap = true; });
  return res.join("\n");
}

function installDebugging(shell) {
  var SRC = "src/textstats.c";
  shell._addDirs(["src", "tests", "tickets", "answers"]);
  var commits = DBG_COMMITS.map(function (c) { return { sha: c.sha, date: c.date, author: c.author, msg: c.msg, snap: snapshotOf(c) }; });
  var g;   // git state
  function initGit() { g = { commits: commits.slice(), head: commits.length - 1, detached: false, bisect: null }; }
  initGit();
  shell._addFiles({
    "src/textstats.c": { content: commits[commits.length - 1].snap, mode: "644" },
    "tests/cases.txt": { content: DBG_CASES, mode: "644" },
    "tickets/BUG-311.txt": { content: BUG_REPORT, mode: "644" },
    "README.txt": { content: "textstats regression hunt. Bug: tickets/BUG-311.txt\n  make test                run tests/cases.txt against src/textstats.c\n  trace <fn> \"<input>\"     step through a function line by line\n  git log | show | diff | status | checkout | bisect | commit\ntests/cases.txt is your local test file; checkout doesn't touch it.\n", mode: "644" },
  });
  function fsGet(p) { var f = shell._fs()[shell._root(p)]; return f ? f.content : null; }
  function fsPut(p, c) { shell.writeFile(p, c); }
  function headSnap() { return g.commits[g.head].snap; }
  function dirty() { var w = fsGet(SRC); return w !== null && w !== headSnap(); }
  function findIdx(ref) {
    if (!ref || ref === "HEAD") return g.head;
    if (ref === "main" || ref === "master") return g.commits.length - 1;
    var m = String(ref).match(/^HEAD~(\d+)$/); if (m) return Math.max(0, g.head - parseInt(m[1], 10));
    for (var i = 0; i < g.commits.length; i++) if (ref.length >= 4 && g.commits[i].sha.indexOf(ref) === 0) return i;
    return -1;
  }
  function checkoutIdx(i, force) {
    if (dirty() && !force) return "error: Your local changes to the following files would be overwritten by checkout:\n\t" + SRC + "\nPlease commit your changes or discard them (git checkout -- " + SRC + ") before you switch.";
    g.head = i; g.detached = i !== g.commits.length - 1 || !!(g.bisect);
    fsPut(SRC, g.commits[i].snap);
    return null;
  }

  // ---- make test ----
  function makeTest() {
    var src = fsGet(SRC), t = fsGet("tests/cases.txt");
    if (src === null) return { out: "", err: "make: *** No rule to make target '" + SRC + "'", code: 2 };
    var chk = CI.compileCheck(src, ["word_count", "upper_count"]);
    if (!chk.ok) return { out: "textstats.c: compile error\n  " + chk.error, code: 1 };
    var p = parseCases(t), lines = ["Running tests/cases.txt (" + p.cases.length + " cases)..."], failed = 0;
    p.errors.forEach(function (e) { lines.push("  tests/cases.txt:" + e.line + ": can't parse: " + e.text); failed++; });
    p.cases.forEach(function (c) {
      var r = callC(chk.funcs, c.fn, c.input), good = !r.err && r.v === c.want;
      if (!good) failed++;
      lines.push("  " + (good ? "ok  " : "FAIL") + " " + c.fn + "(" + JSON.stringify(c.input) + ") = " + (r.err ? "runtime error: " + r.err : r.v) + (good ? "" : "   expected " + c.want));
    });
    lines.push(failed ? failed + " failing." : "All tests passed.");
    return { out: lines.join("\n"), code: failed ? 1 : 0 };
  }
  shell._addCommand("make", function (a) { var t = shell._parseFlags(a).rest[0] || ""; if (t && t !== "test") return { out: "make: nothing to be done for '" + t + "'", code: 0 }; return makeTest(); });
  shell._addCommand("run-tests", makeTest);

  // ---- trace: a line stepper ----
  shell._addCommand("trace", function (a) {
    var fn = a[0];
    if (!fn) return { out: "", err: "usage: trace <function> \"<input>\"   e.g. trace word_count \"  a b\"", code: 2 };
    var src = fsGet(SRC), chk = CI.compileCheck(src || "", []);
    if (!chk.ok) return { out: "", err: "trace: " + SRC + " doesn't compile: " + chk.error, code: 1 };
    var f = chk.funcs.find(function (x) { return x.name === fn; });
    if (!f) return { out: "", err: "trace: no function '" + fn + "' in " + SRC, code: 1 };
    var args = a.slice(1).map(function (x) { return /^-?\d+$/.test(x) ? parseInt(x, 10) : x; });
    while (args.length < f.params.length) args.push("");
    var srcLines = src.split("\n"), out = ["trace " + fn + "(" + args.map(function (x) { return JSON.stringify(x); }).join(", ") + ")"], steps = 0, MAX = 150, more = 0;
    var r;
    try {
      r = CI.runFunc(chk.funcs, fn, args, { trace: function (e) {
        if (e.fn !== fn) return;
        steps++; if (steps > MAX) { more++; return; }
        var vars = Object.keys(e.vars).filter(function (k) { return typeof e.vars[k] !== "string"; }).map(function (k) { return k + "=" + e.vars[k]; }).join(" ");
        var code = (srcLines[e.line - 1] || "").trim(); if (code.length > 38) code = code.slice(0, 37) + "…";
        out.push("  L" + String(e.line).padEnd(3) + " " + code.padEnd(39) + " " + vars);
      } });
      if (more) out.push("  … " + more + " more steps not shown");
      out.push("  => returns " + r);
    } catch (e) { if (!e.cError) throw e; out.push("  !! runtime error: " + e.message); }
    return { out: out.join("\n"), code: 0 };
  });

  // ---- git ----
  function fmtLog(oneline) {
    var out = [];
    for (var i = g.commits.length - 1; i >= 0; i--) {
      var c = g.commits[i], deco = "";
      if (i === g.head && !g.detached) deco = " (HEAD -> main)";
      else if (i === g.head) deco = " (HEAD)" + (i === g.commits.length - 1 ? " (main)" : "");
      else if (i === g.commits.length - 1) deco = " (main)";
      if (oneline) out.push(c.sha + deco + " " + c.msg);
      else out.push("commit " + c.sha + deco + "\nAuthor: " + c.author + "\nDate:   " + c.date + "\n\n    " + c.msg + "\n");
    }
    return out.join("\n");
  }
  function bisectStep() {
    var b = g.bisect;
    if (b.bad === null) return "status: waiting for a bad commit (git bisect bad)";
    if (b.good === null) return "status: waiting for a good commit (git bisect good <sha>)";
    if (b.bad - b.good <= 1) {
      b.done = g.commits[b.bad].sha;
      var c = g.commits[b.bad];
      return c.sha + " is the first bad commit\ncommit " + c.sha + "\nAuthor: " + c.author + "\nDate:   " + c.date + "\n\n    " + c.msg + "\n\n" + "(run git bisect reset to return to main)";
    }
    var mid = Math.floor((b.good + b.bad) / 2), left = b.bad - b.good - 1, stepsLeft = Math.max(0, Math.ceil(Math.log2(left + 1)) - 1);
    var e = checkoutIdx(mid, false); if (e) return e;
    g.detached = true;
    return "Bisecting: " + (left - 1) + " revision" + (left - 1 === 1 ? "" : "s") + " left to test after this (roughly " + stepsLeft + " step" + (stepsLeft === 1 ? "" : "s") + ")\n[" + g.commits[mid].sha + "] " + g.commits[mid].msg;
  }
  function bisect(args) {
    var sub = args[0];
    if (sub === "start") { g.bisect = { good: null, bad: null, done: null, log: [] }; return { out: "status: waiting for both good and bad commits", code: 0 }; }
    if (!g.bisect && sub !== "reset") return { out: "", err: "You need to start by \"git bisect start\"", code: 1 };
    if (sub === "bad" || sub === "good") {
      var i = findIdx(args[1]); if (i < 0) return { out: "", err: "fatal: bad revision '" + args[1] + "'", code: 128 };
      if (sub === "bad") g.bisect.bad = g.bisect.bad === null ? i : Math.min(g.bisect.bad, i);
      else g.bisect.good = g.bisect.good === null ? i : Math.max(g.bisect.good, i);
      g.bisect.log.push("git bisect " + sub + " " + g.commits[i].sha);
      if (g.bisect.good !== null && g.bisect.bad !== null && g.bisect.good >= g.bisect.bad) return { out: "", err: "Some good revs are not ancestors of the bad rev. (Did you mark them the wrong way round?)", code: 1 };
      return { out: bisectStep(), code: 0 };
    }
    if (sub === "reset") { var was = g.bisect; g.bisect = null; var e = checkoutIdx(g.commits.length - 1, false); if (e) return { out: "", err: e, code: 1 }; g.detached = false; return { out: was ? "Previous HEAD position was " + (was.done || "") + "\nSwitched to branch 'main'" : "We are not bisecting.", code: 0 }; }
    if (sub === "log") return { out: g.bisect.log.join("\n") || "(nothing yet)", code: 0 };
    if (sub === "run") {
      var cmd = args.slice(1).join(" ");
      if (!cmd) return { out: "", err: "usage: git bisect run <cmd>", code: 2 };
      if (g.bisect.good === null || g.bisect.bad === null) return { out: "", err: "git bisect run: mark a good and a bad commit first", code: 1 };
      var out = [], guard = 0;
      while (!g.bisect.done && guard++ < 20) {
        var r = shell.run(cmd), verdict = r.code === 0 ? "good" : "bad";
        out.push("running '" + cmd + "'  -> exit " + r.code + " (" + verdict + ")  at " + g.commits[g.head].sha);
        if (verdict === "bad") g.bisect.bad = Math.min(g.bisect.bad, g.head); else g.bisect.good = Math.max(g.bisect.good, g.head);
        g.bisect.log.push("git bisect " + verdict + " " + g.commits[g.head].sha);
        var s = bisectStep(); out.push(s);
        if (/^error/.test(s)) break;
      }
      out.push("bisect run success");
      return { out: out.join("\n"), code: 0 };
    }
    return { out: "", err: "usage: git bisect [start|bad|good|run|log|reset]", code: 1 };
  }
  shell._addCommand("git", function (a) {
    var sub = a[0], args = a.slice(1);
    if (sub === "log") return { out: fmtLog(args.indexOf("--oneline") >= 0), code: 0 };
    if (sub === "show") {
      var i = findIdx(args[0] || "HEAD"); if (i < 0) return { out: "", err: "fatal: bad revision '" + args[0] + "'", code: 128 };
      var c = g.commits[i], parent = i > 0 ? g.commits[i - 1].snap : "";
      return { out: "commit " + c.sha + "\nAuthor: " + c.author + "\nDate:   " + c.date + "\n\n    " + c.msg + "\n\ndiff --git a/" + SRC + " b/" + SRC + "\n--- a/" + SRC + "\n+++ b/" + SRC + "\n" + lineDiff(parent, c.snap), code: 0 };
    }
    if (sub === "diff") { if (!dirty()) return { out: "", code: 0 }; return { out: "diff --git a/" + SRC + " b/" + SRC + "\n--- a/" + SRC + "\n+++ b/" + SRC + "\n" + lineDiff(headSnap(), fsGet(SRC)), code: 0 }; }
    if (sub === "status") {
      var o = [g.detached ? "HEAD detached at " + g.commits[g.head].sha : "On branch main"];
      if (g.bisect) o.push("You are currently bisecting, started from branch 'main'.\n  (use \"git bisect reset\" to get back to the original branch)");
      o.push(dirty() ? "Changes not staged for commit:\n\tmodified:   " + SRC : "nothing to commit, working tree clean");
      return { out: o.join("\n"), code: 0 };
    }
    if (sub === "checkout" || sub === "switch" || sub === "restore") {
      if (sub === "restore" || args[0] === "--") { fsPut(SRC, headSnap()); return { out: "Updated 1 path from the index", code: 0 }; }
      var force = args.indexOf("-f") >= 0 || args.indexOf("--force") >= 0, ref = args.filter(function (x) { return x[0] !== "-"; })[0];
      var j = findIdx(ref); if (j < 0) return { out: "", err: "error: pathspec '" + ref + "' did not match any file(s) known to git", code: 1 };
      var e = checkoutIdx(j, force); if (e) return { out: "", err: e, code: 1 };
      if (j === g.commits.length - 1 && !g.bisect) { g.detached = false; return { out: "Switched to branch 'main'", code: 0 }; }
      g.detached = true;
      return { out: "Note: switching to '" + g.commits[j].sha + "'.\nYou are in 'detached HEAD' state.\nHEAD is now at " + g.commits[j].sha + " " + g.commits[j].msg, code: 0 };
    }
    if (sub === "bisect") return bisect(args);
    if (sub === "add") return { out: "", code: 0 };
    if (sub === "commit") {
      var mi = args.indexOf("-m"), am = args.indexOf("-am"), msg = mi >= 0 ? args[mi + 1] : am >= 0 ? args[am + 1] : null;
      if (!msg) return { out: "", err: "error: use git commit -am \"message\" (no editor in this lab)", code: 1 };
      if (g.detached || g.bisect) return { out: "", err: "You are in 'detached HEAD' state" + (g.bisect ? " (bisecting)" : "") + ". Run git bisect reset / git checkout main before committing.", code: 1 };
      if (!dirty()) return { out: "On branch main\nnothing to commit, working tree clean", code: 1 };
      var sha = (Math.abs(fsGet(SRC).split("").reduce(function (h, ch) { return (h * 31 + ch.charCodeAt(0)) | 0; }, 7)) + 0x1000000).toString(16).slice(-7);
      g.commits.push({ sha: sha, date: "2026-10-15", author: "Sam Reyes", msg: msg, snap: fsGet(SRC) });
      g.head = g.commits.length - 1;
      return { out: "[main " + sha + "] " + msg + "\n 1 file changed", code: 0 };
    }
    return { out: "", err: "git: '" + (sub || "") + "' is not supported in this lab (try: log, show, diff, status, checkout, bisect, commit)", code: 1 };
  });

  shell.dbgState = function () {
    var main = g.commits[g.commits.length - 1];
    return {
      reproducers: findReproducer(fsGet("tests/cases.txt")).length,
      bisectAnswer: fsGet("answers/bisect.txt") || "",
      onMain: !g.detached && !g.bisect && g.head === g.commits.length - 1,
      mainFixed: g.commits.length > DBG_COMMITS.length && battery(main.snap),
      workingFixed: battery(fsGet(SRC) || ""),
      bisectDone: g.bisect ? g.bisect.done : null,
      bisectOk: gradeBisect(fsGet("answers/bisect.txt")),
    };
  };
  var baseReset = shell.reset;
  shell.reset = function () { initGit(); return baseReset.apply(shell, arguments); };
}

function gradeBisect(text) {
  var t = (text || "").toLowerCase();
  var named = DBG_COMMITS.filter(function (c) { return t.indexOf(c.sha) >= 0; }).map(function (c) { return c.sha; });
  return named.length === 1 && named[0] === DBG_BAD_SHA;
}

if (typeof module !== "undefined") module.exports = { installDebugging: installDebugging, findReproducer: findReproducer, battery: battery, gradeBisect: gradeBisect, DBG_COMMITS: DBG_COMMITS, snapshotOf: snapshotOf, lineDiff: lineDiff };
