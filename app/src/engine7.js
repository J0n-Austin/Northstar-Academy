/* Detection Engineering lab pack (defensive). The learner writes detection
   rules in rules/detections.txt and runs `detect` over a labeled auth-event
   log. The progression is the real one: match a field, aggregate with a
   threshold, then cut a false positive with a correlation condition. Rules
   are graded against the visible log AND a hidden second log, so a rule that
   only overfits the sample fails. Everything here is benign, static data. */

function visibleLog() {
  // id, ts (seconds), event, user, src_ip
  return [
    { id: "e01", ts: 100, event: "login_success", user: "tchen",      src_ip: "10.0.1.5" },
    { id: "e02", ts: 120, event: "login_failed",  user: "amber",      src_ip: "10.0.1.9" },
    { id: "e03", ts: 130, event: "login_success", user: "amber",      src_ip: "10.0.1.9" },
    // guest: 6 failures from one IP, then a success -> a brute force that worked (ATTACK)
    { id: "e04", ts: 200, event: "login_failed",  user: "guest",      src_ip: "203.0.113.7" },
    { id: "e05", ts: 202, event: "login_failed",  user: "guest",      src_ip: "203.0.113.7" },
    { id: "e06", ts: 204, event: "login_failed",  user: "guest",      src_ip: "203.0.113.7" },
    { id: "e07", ts: 206, event: "login_failed",  user: "guest",      src_ip: "203.0.113.7" },
    { id: "e08", ts: 208, event: "login_failed",  user: "guest",      src_ip: "203.0.113.7" },
    { id: "e09", ts: 210, event: "login_failed",  user: "guest",      src_ip: "203.0.113.7" },
    { id: "e10", ts: 215, event: "login_success", user: "guest",      src_ip: "203.0.113.7" },
    // svc-backup: many failures (misconfigured service), but never succeeds -> benign noise
    { id: "e11", ts: 300, event: "login_failed",  user: "svc-backup", src_ip: "10.0.2.4" },
    { id: "e12", ts: 360, event: "login_failed",  user: "svc-backup", src_ip: "10.0.2.4" },
    { id: "e13", ts: 420, event: "login_failed",  user: "svc-backup", src_ip: "10.0.2.4" },
    { id: "e14", ts: 480, event: "login_failed",  user: "svc-backup", src_ip: "10.0.2.4" },
    { id: "e15", ts: 540, event: "login_failed",  user: "svc-backup", src_ip: "10.0.2.4" },
    { id: "e16", ts: 600, event: "login_failed",  user: "svc-backup", src_ip: "10.0.2.4" },
    { id: "e17", ts: 650, event: "logout",        user: "tchen",      src_ip: "10.0.1.5" },
  ];
}
function hiddenLog() {
  // a different attacker (mallory) + different benign service (svc-report)
  return [
    { id: "h01", ts: 100, event: "login_success", user: "dpark",      src_ip: "10.0.1.2" },
    { id: "h02", ts: 200, event: "login_failed",  user: "mallory",    src_ip: "198.51.100.9" },
    { id: "h03", ts: 201, event: "login_failed",  user: "mallory",    src_ip: "198.51.100.9" },
    { id: "h04", ts: 202, event: "login_failed",  user: "mallory",    src_ip: "198.51.100.9" },
    { id: "h05", ts: 203, event: "login_failed",  user: "mallory",    src_ip: "198.51.100.9" },
    { id: "h06", ts: 204, event: "login_failed",  user: "mallory",    src_ip: "198.51.100.9" },
    { id: "h07", ts: 205, event: "login_failed",  user: "mallory",    src_ip: "198.51.100.9" },
    { id: "h08", ts: 206, event: "login_failed",  user: "mallory",    src_ip: "198.51.100.9" },
    { id: "h09", ts: 210, event: "login_success", user: "mallory",    src_ip: "198.51.100.9" },
    { id: "h10", ts: 300, event: "login_failed",  user: "svc-report", src_ip: "10.0.2.8" },
    { id: "h11", ts: 360, event: "login_failed",  user: "svc-report", src_ip: "10.0.2.8" },
    { id: "h12", ts: 420, event: "login_failed",  user: "svc-report", src_ip: "10.0.2.8" },
    { id: "h13", ts: 480, event: "login_failed",  user: "svc-report", src_ip: "10.0.2.8" },
    { id: "h14", ts: 540, event: "login_failed",  user: "svc-report", src_ip: "10.0.2.8" },
  ];
}

function toJsonl(log) { return log.map((e) => JSON.stringify(e)).join("\n") + "\n"; }

var STARTER =
  "# Detection rules. One rule per block; blank line between blocks.\n" +
  "# Keys: rule, when (field == value / field != value), group_by, count (>= N),\n" +
  "#       followed_by (field == value). Run `detect` to evaluate against the log.\n" +
  "#\n" +
  "# Example:\n" +
  "#   rule: my-rule\n" +
  "#   when: event == login_failed\n" +
  "\n";

// ---- rule parsing ----
function parseRules(text) {
  var blocks = text.replace(/\r/g, "").split(/\n\s*\n/), rules = [], errors = [];
  for (var b = 0; b < blocks.length; b++) {
    var lines = blocks[b].split("\n").map(function (l) { return l.replace(/#.*/, "").trim(); }).filter(Boolean);
    if (!lines.length) continue;
    var r = { name: null, when: [], group_by: null, countOp: null, countN: null, followed_by: [] };
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^(\w+)\s*:\s*(.+)$/);
      if (!m) { errors.push("cannot parse: " + lines[i]); continue; }
      var key = m[1].toLowerCase(), val = m[2].trim();
      if (key === "rule") r.name = val;
      else if (key === "when") r.when.push(parseCond(val, errors));
      else if (key === "followed_by") r.followed_by.push(parseCond(val, errors));
      else if (key === "group_by") r.group_by = val;
      else if (key === "count") { var cm = val.match(/^(>=|<=|>|<|==)\s*(\d+)$/); if (cm) { r.countOp = cm[1]; r.countN = parseInt(cm[2], 10); } else errors.push("bad count: " + val); }
      else errors.push("unknown key: " + key);
    }
    if (r.name) rules.push(r);
  }
  return { rules: rules, errors: errors };
}
function parseCond(val, errors) {
  var m = val.match(/^(\w+)\s*(==|!=)\s*(.+)$/);
  if (!m) { errors.push("bad condition: " + val); return null; }
  return { field: m[1], op: m[2], value: m[3].replace(/^["']|["']$/g, "") };
}
function condMatch(c, ev) { if (!c) return false; var v = ev[c.field]; return c.op === "==" ? String(v) === c.value : String(v) !== c.value; }

// ---- evaluate a rule over a log -> fired set ----
function evalRule(rule, log) {
  var matching = log.filter(function (ev) { return rule.when.every(function (c) { return condMatch(c, ev); }); });
  if (!rule.group_by) return { kind: "event", set: matching.map(function (e) { return e.id; }).sort() };
  // threshold / correlation rule
  var groups = {};
  matching.forEach(function (ev) { var k = String(ev[rule.group_by]); (groups[k] = groups[k] || []).push(ev); });
  var fired = [];
  Object.keys(groups).forEach(function (k) {
    var evs = groups[k], n = evs.length, ok = true;
    if (rule.countOp) { ok = rule.countOp === ">=" ? n >= rule.countN : rule.countOp === ">" ? n > rule.countN : rule.countOp === "<=" ? n <= rule.countN : rule.countOp === "<" ? n < rule.countN : n === rule.countN; }
    if (ok && rule.followed_by.length) {
      var lastWhen = Math.max.apply(null, evs.map(function (e) { return e.ts; }));
      var hit = log.some(function (ev) { return String(ev[rule.group_by]) === k && ev.ts > lastWhen && rule.followed_by.every(function (c) { return condMatch(c, ev); }); });
      if (!hit) ok = false;
    }
    if (ok) fired.push(k);
  });
  return { kind: "group", set: fired.sort() };
}

function evalAll(text, log) {
  var p = parseRules(text);
  if (p.errors.length) return { ok: false, errors: p.errors };
  return { ok: true, rules: p.rules.map(function (r) { var res = evalRule(r, log); return { name: r.name, kind: res.kind, set: res.set }; }) };
}

// reference truth, computed directly from the data (no rules involved)
function truth(log) {
  var failed = log.filter(function (e) { return e.event === "login_failed"; });
  var byUser = {}; failed.forEach(function (e) { (byUser[e.user] = byUser[e.user] || []).push(e); });
  var thresholdUsers = Object.keys(byUser).filter(function (u) { return byUser[u].length >= 5; }).sort();
  var attackUsers = thresholdUsers.filter(function (u) {
    var last = Math.max.apply(null, byUser[u].map(function (e) { return e.ts; }));
    return log.some(function (e) { return e.user === u && e.event === "login_success" && e.ts > last; });
  }).sort();
  return { allFailed: failed.map(function (e) { return e.id; }).sort(), thresholdUsers: thresholdUsers, attackUsers: attackUsers };
}

function installDetection(shell) {
  shell._addDirs(["rules", "logs", "answers"]);
  shell._addFiles({
    "logs/auth.jsonl": { content: toJsonl(visibleLog()), mode: "644" },
    "rules/detections.txt": { content: STARTER, mode: "644" },
    "README.txt": { content: "Detection engineering range.\nWrite rules in rules/detections.txt; run `detect`.\nGoal: catch the real brute force without alerting on the noisy service account.\n", mode: "644" },
  });
  function rulesText() { var f = shell._fs()[shell._root("rules/detections.txt")]; return f ? f.content : ""; }

  shell._addCommand("detect", function () {
    var res = evalAll(rulesText(), visibleLog());
    if (!res.ok) return { out: "", err: "rule parse error:\n  " + res.errors.join("\n  "), code: 1 };
    if (!res.rules.length) return { out: "No rules defined yet. Edit rules/detections.txt (see the template) and run detect again.", code: 0 };
    var lines = [];
    res.rules.forEach(function (r) {
      if (!r.set.length) { lines.push("[" + r.name + "] no alerts"); return; }
      if (r.kind === "event") lines.push("[" + r.name + "] " + r.set.length + " alert" + (r.set.length === 1 ? "" : "s") + " (events: " + r.set.join(", ") + ")");
      else lines.push("[" + r.name + "] " + r.set.length + " alert" + (r.set.length === 1 ? "" : "s") + " -> " + r.set.join(", "));
    });
    return { out: lines.join("\n"), code: 0 };
  });

  // grading hooks
  shell.detRun = function (which) { return evalAll(rulesText(), which === "hidden" ? hiddenLog() : visibleLog()); };
  shell.detTruth = function (which) { return truth(which === "hidden" ? hiddenLog() : visibleLog()); };
}

if (typeof module !== "undefined") module.exports = { installDetection: installDetection, evalAll: evalAll, truth: truth, visibleLog: visibleLog, hiddenLog: hiddenLog };
