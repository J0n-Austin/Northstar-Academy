/* Code Review lab. The learner reviews three pull requests against logutil.c
   and records a verdict (approve / request-changes) plus the issue for the
   ones that need work. The truth isn't a hidden answer key: each PR's proposed
   code is actually run through the C interpreter's test battery, so "should
   this be approved?" is decided by whether the change passes the tests. That
   makes the grading honest and keeps it aligned with the C lab. */

var CI = (typeof window !== "undefined" && window.CI) ? window.CI : require("./cinterp.js");

// Each PR: a human diff to read, the full proposed source (for the tests),
// the function under review + its test battery, and accepted issue keywords.
var PRS = [
  {
    id: "pr1", title: "Speed up count_char",
    author: "rjain", desc: "Start the scan at 1 — index 0 is always the length byte anyway.",
    diff: [
      " int count_char(const char *s, char c) {",
      "     int n = 0;",
      "-    for (int i = 0; i < strlen(s); i++) {",
      "+    for (int i = 1; i < strlen(s); i++) {",
      "         if (s[i] == c) n++;",
      "     }",
      "     return n;",
      " }",
    ].join("\n"),
    after: "int count_char(const char *s, char c) { int n = 0; for (int i = 1; i < strlen(s); i++) { if (s[i] == c) n++; } return n; }",
    fn: "count_char",
    tests: [["banana", "b"], ["banana", "a"], ["edge", "e"], ["aaaa", "a"]],
    ref: function (s, c) { var n = 0; for (var i = 0; i < s.length; i++) if (s[i] === c) n++; return n; },
    toArgs: function (a) { return [a[0], a[1].charCodeAt(0)]; },
    issue: ["off-by-one", "off by one", "index 0", "first char", "misses", "bounds", "loop"],
  },
  {
    id: "pr2", title: "Rename vars in to_int for clarity",
    author: "mokafor", desc: "Pure rename: v -> value, i -> idx. No behavior change.",
    diff: [
      " int to_int(const char *s) {",
      "-    int v = 0;",
      "-    for (int i = 0; s[i] != 0; i++) {",
      "-        if (s[i] < '0' || s[i] > '9') return -1;",
      "-        v = v * 10 + (s[i] - '0');",
      "+    int value = 0;",
      "+    for (int idx = 0; s[idx] != 0; idx++) {",
      "+        if (s[idx] < '0' || s[idx] > '9') return -1;",
      "+        value = value * 10 + (s[idx] - '0');",
      "     }",
      "-    return v;",
      "+    return value;",
      " }",
    ].join("\n"),
    after: "int to_int(const char *s) { int value = 0; for (int idx = 0; s[idx] != 0; idx++) { if (s[idx] < '0' || s[idx] > '9') return -1; value = value * 10 + (s[idx] - '0'); } return value; }",
    fn: "to_int",
    tests: [["0"], ["2048"], [""], ["20x8"], ["99a"]],
    ref: function (s) { if (!/^[0-9]*$/.test(s)) return -1; return s === "" ? 0 : parseInt(s, 10); },
    toArgs: function (a) { return [a[0]]; },
    issue: [],
  },
  {
    id: "pr3", title: "Add parse_port helper",
    author: "rjain", desc: "New helper to turn a port string into an int for the config loader.",
    diff: [
      "+int parse_port(const char *s) {",
      "+    int p = 0;",
      "+    for (int i = 0; s[i] != 0; i++) {",
      "+        p = p * 10 + (s[i] - '0');",
      "+    }",
      "+    return p;",
      "+}",
    ].join("\n"),
    after: "int parse_port(const char *s) { int p = 0; for (int i = 0; s[i] != 0; i++) { p = p * 10 + (s[i] - '0'); } return p; }",
    fn: "parse_port",
    tests: [["80"], ["8443"], ["80x"], [""], ["9a9"]],
    ref: function (s) { if (!/^[0-9]*$/.test(s)) return -1; return s === "" ? 0 : parseInt(s, 10); },
    toArgs: function (a) { return [a[0]]; },
    issue: ["validation", "validate", "input", "non-digit", "digit", "unchecked", "reject", "length"],
  },
];

// Run a PR's proposed code through its tests. Returns whether it should be approved.
function prTruth(pr) {
  var funcs;
  try { funcs = CI.parseProgram(pr.after); } catch (e) { return { approve: false, pass: 0, total: pr.tests.length }; }
  var pass = 0;
  for (var i = 0; i < pr.tests.length; i++) {
    var args = pr.tests[i], want = pr.ref.apply(null, args), got;
    try { got = CI.runFunc(funcs, pr.fn, pr.toArgs(args)); } catch (e) { got = "__trap__"; }
    if (got === want) pass++;
  }
  return { approve: pass === pr.tests.length, pass: pass, total: pr.tests.length };
}

// Parse the learner's review file: lines like "pr1: request-changes off-by-one"
function parseReview(text) {
  var verdicts = {};
  (text || "").split("\n").forEach(function (line) {
    var m = line.match(/^\s*(pr\d+)\s*:\s*(.+)$/i);
    if (!m) return;
    var id = m[1].toLowerCase(), rest = m[2].toLowerCase().trim();
    var verdict = /request|changes|reject|no\b|decline/.test(rest) ? "request-changes" : /approve|lgtm|ship|ok\b|yes/.test(rest) ? "approve" : null;
    verdicts[id] = { verdict: verdict, text: rest };
  });
  return verdicts;
}

function gradeReview(text, ids) {
  var v = parseReview(text), out = {};
  ids.forEach(function (id) {
    var pr = PRS.find(function (p) { return p.id === id; });
    var truth = prTruth(pr);
    var want = truth.approve ? "approve" : "request-changes";
    var learner = v[id];
    var verdictOk = learner && learner.verdict === want;
    var issueOk = true;
    if (!truth.approve && pr.issue.length) issueOk = learner && pr.issue.some(function (k) { return learner.text.indexOf(k) >= 0; });
    out[id] = { ok: verdictOk && issueOk, want: want, verdictOk: verdictOk, issueOk: issueOk };
  });
  return out;
}

function installCodeReview(shell) {
  shell._addDirs(["answers"]);
  shell._addFiles({ "answers/review.txt": { content: "# Record one verdict per PR, e.g.:\n#   pr1: request-changes <one-word issue>\n#   pr2: approve\n", mode: "644" }, "README.txt": { content: "Code review queue. `pr list`, `pr show <id>`, `pr test <id>`.\nRecord verdicts in answers/review.txt.\n", mode: "644" } });

  shell._addCommand("pr", function (a) {
    var rest = shell._parseFlags(a).rest, sub = rest[0], id = (rest[1] || "").toLowerCase();
    if (sub === "list" || !sub) {
      return { out: PRS.map(function (p) { return "  " + p.id + "  " + p.title + "  (@" + p.author + ")"; }).join("\n"), code: 0 };
    }
    var pr = PRS.find(function (p) { return p.id === id; });
    if (!pr) return { out: "", err: "pr: no such PR '" + (id || "") + "' (try: pr list)", code: 1 };
    if (sub === "show") {
      return { out: "PR " + pr.id + ": " + pr.title + "  (@" + pr.author + ")\n" + pr.desc + "\n\n--- a/src/logutil.c\n+++ b/src/logutil.c\n" + pr.diff, code: 0 };
    }
    if (sub === "test") {
      var t = prTruth(pr);
      return { out: "Running tests for " + pr.id + " (" + pr.fn + ")...\n  " + t.pass + "/" + t.total + " passing" + (t.approve ? "\n  all green" : "\n  some cases fail — read the diff and decide"), code: 0 };
    }
    return { out: "", err: "pr: unknown subcommand '" + sub + "' (list | show <id> | test <id>)", code: 2 };
  });

  shell.reviewGrade = function (ids) { var f = shell._fs()[shell._root("answers/review.txt")]; return gradeReview(f ? f.content : "", ids); };
}

if (typeof module !== "undefined") module.exports = { installCodeReview: installCodeReview, prTruth: prTruth, gradeReview: gradeReview, PRS: PRS };
