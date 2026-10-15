/* Ambiguous Ticket lab pack (L4). A product manager files a vague ticket with
   three claims ("slow", "numbers look off", "Tuesday's data is gone") and a
   bad suggestion ("just delete the old data"). Nothing says which claims are
   real. The learner triages each claim against evidence, fixes the root causes
   of the real ones without destroying anything, and replies to the requester
   explaining what they found and declining the harmful suggestion.
     slow      real: the rebuild job runs every minute but takes ~4 min, so
               rebuilds pile up (since a 2026-10-07 change)
     counts    real: a migration added the auth log source a second time,
               so every login is counted twice
     tuesday   not a bug: the data is there; the dashboard's default range is
               the last 2 days, and today is Thursday
   The dashboard numbers, process list and page-load time are all computed
   from the live config, so fixes show up immediately. */

var TK_DAYS = ["2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"];
var TK_LOGINS = [48, 21, 17, 52, 46, 50, 23], TK_FAILS = [3, 1, 0, 4, 2, 5, 1], TK_REQS = [31, 12, 9, 34, 30, 33, 14];
var TK_USERS = ["achen", "bkim", "cdiaz", "dpark", "eli", "fatima", "gwen", "hiro", "ines", "jo"];
var TK_CRON = "var/spool/cron/sam";

function tkPad(n) { return (n < 10 ? "0" : "") + n; }
function tkAuthLog(d, k) {
  var lines = [], total = TK_LOGINS[k] + TK_FAILS[k];
  for (var i = 0; i < total; i++) {
    var mins = 7 * 60 + Math.floor(i * (11 * 60) / total), ev = (i % 9 === 4 && lines.filter(function (l) { return /failed/.test(l); }).length < TK_FAILS[k]) ? "login_failed" : "login_success";
    lines.push(d + "T" + tkPad(Math.floor(mins / 60)) + ":" + tkPad(mins % 60) + ":" + tkPad((i * 17) % 60) + "Z " + ev + " user=" + TK_USERS[(i * 3 + k) % TK_USERS.length]);
  }
  // make the failed/success split exact
  var fails = lines.filter(function (l) { return /login_failed/.test(l); }).length;
  for (var j = lines.length - 1; fails < TK_FAILS[k] && j >= 0; j--) if (/login_success/.test(lines[j])) { lines[j] = lines[j].replace("login_success", "login_failed"); fails++; }
  return lines.join("\n") + "\n";
}
function tkAppLog(d, k) {
  var lines = [];
  for (var i = 0; i < TK_REQS[k]; i++) { var m = 8 * 60 + i * 17; lines.push(d + "T" + tkPad(Math.floor(m / 60) % 24) + ":" + tkPad(m % 60) + ":00Z GET /api/" + ["status", "summary", "alerts"][i % 3] + " 200"); }
  return lines.join("\n") + "\n";
}

var TK_TICKET = [
  "NS-250  dashboard is broken??",
  "From: Priya Natarajan (Product)",
  "Priority: high   Due: before Thursday's ops review",
  "",
  "The ops dashboard has been really slow since sometime last week, and the",
  "numbers look off - yesterday's login count seems way too high for a",
  "Wednesday. Also Tuesday's data is just gone??",
  "",
  "Can you take a look? Honestly if it's easier, just delete the old data so",
  "it's fast again, we don't really need anything older than a few days.",
  "",
  "Thanks!! - Priya",
  "",
].join("\n");

var TK_INGEST = [
  "# Sources ingested into the dashboard store by /opt/dash/rebuild.sh",
  "source = logs/auth/*.log",
  "source = logs/app/*.log",
  "source = logs/auth/*.log     # added by migration 2026-10-07 (NS-233)",
  "",
].join("\n");

var TK_DASHCONF = "# ops dashboard\ndefault_range = 2d\ntimezone = UTC\n";
var TK_CRONTAB = "# m h dom mon dow   command\n* * * * * /opt/dash/rebuild.sh\n";

var TK_REBUILD_LOG = (function () {
  var L = [];
  ["00", "15", "30", "45"].forEach(function (m) { L.push("2026-10-06T14:" + m + ":00Z rebuild start pid=" + (3100 + +m)); L.push("2026-10-06T14:" + tkPad(+m + 2) + ":31Z rebuild ok in 2m31s (2 sources)"); });
  L.push("2026-10-07T09:12:44Z deploy-bot: applied NS-233 (ingest migration, rebuild schedule) ");
  for (var i = 0; i < 6; i++) {
    var t = "2026-10-15T09:" + tkPad(20 + i) + ":00Z";
    L.push(t + " rebuild start pid=" + (8810 + i));
    if (i >= 1) L.push(t + " WARN previous rebuild still running (pids: " + [8810, 8811, 8812, 8813, 8814].slice(Math.max(0, i - 3), i).join(",") + ")");
    if (i >= 4) L.push("2026-10-15T09:" + tkPad(20 + i) + ":48Z rebuild ok in 3m48s (3 sources) pid=" + (8810 + i - 4));
  }
  return L.join("\n") + "\n";
})();

// ---- model computed from live config ----
function tkSources(ingest) {
  var auth = 0, app = 0;
  (ingest || "").split("\n").forEach(function (l) {
    l = l.replace(/#.*/, "").trim();
    var m = l.match(/^source\s*=\s*(\S+)/); if (!m) return;
    if (/^(\.\/)?logs\/auth\//.test(m[1])) auth++;
    else if (/^(\.\/)?logs\/app\//.test(m[1])) app++;
  });
  return { auth: auth, app: app, total: auth + app };
}
function tkCronInterval(crontab) {
  var line = (crontab || "").split("\n").filter(function (l) { return !/^\s*#/.test(l) && /rebuild\.sh/.test(l); })[0];
  if (!line) return { scheduled: false };
  var f = line.trim().split(/\s+/), min = f[0], hr = f[1], flock = /\bflock\b/.test(line), iv;
  if (hr !== "*") iv = 3600 * 24;
  else if (min === "*") iv = 60;
  else if (/^\*\/\d+$/.test(min)) iv = 60 * parseInt(min.slice(2), 10);
  else if (/^\d+(,\d+)*$/.test(min)) {
    var ms = min.split(",").map(Number).sort(function (a, b) { return a - b; });
    if (ms.length === 1) iv = 3600; else { var gap = 60; for (var i = 1; i < ms.length; i++) gap = Math.min(gap, ms[i] - ms[i - 1]); gap = Math.min(gap, 60 - ms[ms.length - 1] + ms[0]); iv = gap * 60; }
  } else iv = 60;
  return { scheduled: true, interval: iv, flock: flock, line: line.trim() };
}
function tkModel(files) {
  var src = tkSources(files.ingest), cron = tkCronInterval(files.crontab);
  var duration = 76 * Math.max(1, src.total);
  var conc = !cron.scheduled ? 0 : cron.flock ? 1 : Math.max(1, Math.ceil(duration / cron.interval));
  var days = TK_DAYS.map(function (d, k) {
    var a = files.auth[d], p = files.app[d];
    var rawLogins = a ? (a.match(/login_success/g) || []).length : 0, rawReqs = p ? p.split("\n").filter(Boolean).length : 0;
    return { date: d, logins: rawLogins * src.auth, requests: rawReqs * src.app, rawLogins: rawLogins, rawReqs: rawReqs };
  });
  return { sources: src, cron: cron, duration: duration, concurrency: conc, pageLoad: conc ? +(0.7 + 2.1 * (conc - 1)).toFixed(1) : 0.7, days: days };
}
function fmtDur(s) { return Math.floor(s / 60) + "m" + tkPad(s % 60) + "s"; }

function gradeTriage(text) {
  var t = (text || "").toLowerCase(), v = {};
  t.split("\n").forEach(function (l) { var m = l.match(/^\s*([a-z-]+)\s*[=:]\s*([a-z- ]+?)\s*$/); if (m) v[m[1]] = m[2].replace(/\s+/g, "-"); });
  var isBug = function (x) { return x === "bug" || x === "real" || x === "confirmed"; };
  var notBug = function (x) { return /^(not-a-bug|not-bug|no-bug|expected|working-as-configured|user-error|config)$/.test(x || ""); };
  return { slow: isBug(v.slow), counts: isBug(v.counts), tuesday: notBug(v.tuesday), ok: isBug(v.slow) && isBug(v.counts) && notBug(v.tuesday) };
}
function gradeReply(text) {
  var t = (text || "").toLowerCase();
  var r = {
    counts: /duplicat|twice|double|counted 2|two times|2x/.test(t),
    slow: /cron|schedul|every minute|overlap|concurren|pil(e|ing) up/.test(t),
    tuesday: /range|filter|default|7d|last 2 days|two days/.test(t),
    declines: /(n't|not|no need to|without|instead of|rather than|recommend against|advise against)\W+(\w+\W+){0,5}(delet|remov|purg|drop)/.test(t),
    words: t.split(/\s+/).filter(Boolean).length,
  };
  r.ok = r.counts && r.slow && r.tuesday && r.declines && r.words >= 40;
  return r;
}

function installTicket(shell) {
  shell._addDirs(["tickets", "etc", "logs", "logs/auth", "logs/app", "answers", "opt", "opt/dash", "var", "var/spool", "var/spool/cron"]);
  var files = {
    "tickets/NS-250.txt": { content: TK_TICKET, mode: "644" },
    "etc/ingest.conf": { content: TK_INGEST, mode: "644" },
    "etc/dashboard.conf": { content: TK_DASHCONF, mode: "644" },
    "logs/rebuild.log": { content: TK_REBUILD_LOG, mode: "644" },
    "opt/dash/rebuild.sh": { content: "#!/bin/bash\n# Rebuilds the dashboard store from every source in etc/ingest.conf.\n# Takes ~76s per source.\n", mode: "755" },
    "answers/reply.md": { content: "To: Priya\nRe: NS-250\n\n", mode: "644" },
    "README.txt": { content: "Ticket: tickets/NS-250.txt  (no runbook for this one)\n  dashboard [--range Nd]   what Priya sees\n  ps                       running processes\n  crontab -l / -e          scheduled jobs\nRecord your triage in answers/triage.txt and your reply in answers/reply.md.\n", mode: "644" },
  };
  files[TK_CRON] = { content: TK_CRONTAB, mode: "600" };
  var originals = {};
  TK_DAYS.forEach(function (d, k) {
    files["logs/auth/" + d + ".log"] = { content: tkAuthLog(d, k), mode: "644" };
    files["logs/app/" + d + ".log"] = { content: tkAppLog(d, k), mode: "644" };
    originals["logs/auth/" + d + ".log"] = files["logs/auth/" + d + ".log"].content;
    originals["logs/app/" + d + ".log"] = files["logs/app/" + d + ".log"].content;
  });
  shell._addFiles(files);

  function get(p) { var f = shell._fs()[shell._root(p)]; return f ? f.content : null; }
  function snapshot() {
    var auth = {}, app = {};
    TK_DAYS.forEach(function (d) { auth[d] = get("logs/auth/" + d + ".log"); app[d] = get("logs/app/" + d + ".log"); });
    return { ingest: get("etc/ingest.conf"), crontab: get(TK_CRON), dashconf: get("etc/dashboard.conf"), auth: auth, app: app };
  }
  function model() { return tkModel(snapshot()); }

  shell._addCommand("dashboard", function (a) {
    var p = shell._parseFlags(a, ["r"]), ri = a.indexOf("--range"), range = ri >= 0 ? a[ri + 1] : null;
    var conf = (get("etc/dashboard.conf") || "").match(/^\s*default_range\s*=\s*(\d+)d/m);
    var nd = parseInt((range || "").replace(/d$/, ""), 10) || (conf ? parseInt(conf[1], 10) : 2);
    nd = Math.max(1, Math.min(nd, 30));
    var m = model(), shown = m.days.slice(-nd), out = [];
    out.push("ops dashboard · last " + nd + "d" + (range ? "" : " (default, etc/dashboard.conf)") + " · today 2026-10-15");
    out.push("  date          logins   requests");
    if (nd > m.days.length) out.push("  (no data before 2026-10-09 — log retention is 7 days)");
    shown.forEach(function (d) { out.push("  " + d.date + "   " + String(d.logins).padStart(6) + "   " + String(d.requests).padStart(8)); });
    out.push(!m.cron.scheduled ? "store: NOT rebuilding (no rebuild job scheduled) — data is going stale" :
      "store: rebuild takes " + fmtDur(m.duration) + " · page load " + m.pageLoad.toFixed(1) + "s");
    return { out: out.join("\n"), code: 0 };
  });

  shell._addCommand("ps", function () {
    var m = model(), out = ["  PID  ELAPSED  CMD", "    1  9d       /sbin/init", "  412  9d       /usr/sbin/cron", "  530  9d       /opt/dash/dashboard-web --port 8080"];
    for (var i = 0; i < m.concurrency; i++) out.push(" " + String(8814 - i) + "  " + fmtDur(Math.min(m.duration - 5, 60 * (i + 1) - 13)).padEnd(8) + " /bin/bash /opt/dash/rebuild.sh");
    return { out: out.join("\n"), code: 0 };
  });

  shell._addCommand("crontab", function (a) {
    var pf = shell._parseFlags(a), cur = shell._fs()[TK_CRON];
    if (pf.flags.l) { if (!cur || !cur.content.trim()) return { out: "", err: "no crontab for sam", code: 1 }; return { out: cur.content.replace(/\n$/, ""), code: 0 }; }
    if (pf.flags.e) return { out: "", code: 0, open: { path: TK_CRON, name: "crontab (sam)", content: cur ? cur.content : "# m h dom mon dow   command\n", isNew: !cur } };
    if (pf.flags.r) { delete shell._fs()[TK_CRON]; return { out: "", code: 0 }; }
    if (pf.rest[0]) { var f = shell._fs()[shell._norm(pf.rest[0])]; if (!f) return { out: "", err: "crontab: " + pf.rest[0] + ": No such file or directory", code: 1 }; shell._fs()[TK_CRON] = { content: f.content, mode: "600" }; return { out: "", code: 0 }; }
    return { out: "", err: "usage: crontab -l | -e | <file>", code: 2 };
  });

  shell.ticketState = function () {
    var s = snapshot(), m = tkModel(s);
    var intact = Object.keys(originals).every(function (p) { return get(p) === originals[p]; });
    var countsOk = m.sources.auth === 1 && m.sources.app === 1 && m.days.every(function (d) { return d.logins === d.rawLogins && d.requests === d.rawReqs; });
    var slowOk = m.cron.scheduled && m.concurrency === 1 && m.cron.interval <= 3600;
    return { model: m, intact: intact, countsOk: countsOk, slowOk: slowOk, fixed: intact && countsOk && slowOk,
      triage: gradeTriage(get("answers/triage.txt")), reply: gradeReply(get("answers/reply.md")) };
  };
}

if (typeof module !== "undefined") module.exports = { installTicket: installTicket, tkModel: tkModel, gradeTriage: gradeTriage, gradeReply: gradeReply, tkCronInterval: tkCronInterval, TK_LOGINS: TK_LOGINS };
