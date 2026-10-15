/* Incident Report lab pack. An outage already happened; the learner
   reconstructs it from the evidence (per-minute metrics, the change log, the
   pager/alert log, a chat excerpt) and writes a blameless postmortem. The
   grader checks the facts against the data (impact window, triggering change)
   and the report's structure and professionalism — not prose style.
   The obvious suspect (the change closest to the alert) is the wrong one. */

function pad2(n) { return (n < 10 ? "0" : "") + n; }
function hm(min) { return pad2(Math.floor(min / 60)) + ":" + pad2(min % 60); }

// per-minute gateway metrics 13:50 .. 15:00. Impact: error_rate > 5% from 14:02 through 14:47.
var IR_START = 14 * 60 + 2, IR_END = 14 * 60 + 47;
function buildMetrics() {
  var rows = ["time,requests,errors,error_rate_pct,p99_ms"];
  for (var m = 13 * 60 + 50; m <= 15 * 60; m++) {
    var req = 1200 + ((m * 37) % 90), rate;
    if (m < IR_START) rate = 0.3 + ((m * 7) % 5) / 10;
    else if (m <= IR_END) rate = m < IR_START + 4 ? 6 + (m - IR_START) * 4 : 18 + ((m * 13) % 9);
    else rate = 0.4 + ((m * 3) % 4) / 10;
    if (m === IR_END) rate = 7.2;            // tail of recovery after rollback at 14:45
    var errs = Math.round(req * rate / 100);
    var p99 = m >= IR_START && m <= IR_END ? 3000 + ((m * 11) % 40) : 180 + ((m * 17) % 60);
    rows.push([hm(m), req, errs, rate.toFixed(1), p99].join(","));
  }
  return rows.join("\n") + "\n";
}

var CHANGES = [
  "id,time,service,author,summary",
  "CHG-2288,11:15,billing,lchen,Bump invoice PDF library",
  "CHG-2290,13:40,docs,mokafor,Update gateway README",
  "CHG-2291,14:00,api-gateway,dpark,Tune auth upstream timeout 30s -> 3s",
  "CHG-2292,14:20,telemetryd,rjain,Raise log buffer to 8MB",
  "CHG-2293,14:45,api-gateway,dpark,Rollback CHG-2291",
  "",
].join("\n");

var ALERTS = [
  "14:05 FIRING  gateway-5xx-rate      api-gateway  error_rate > 5% for 3m",
  "14:06 ACK     gateway-5xx-rate      oncall=mokafor",
  "14:21 FIRING  telemetryd-buffer     telemetryd   buffer resize event (info)",
  "14:31 FIRING  auth-p99-latency      auth         p99 > 2500ms for 5m",
  "14:50 RESOLVED gateway-5xx-rate     api-gateway",
  "14:52 RESOLVED auth-p99-latency     auth",
  "",
].join("\n");

var CHAT = [
  "14:08 mokafor: gateway 5xx spiking, looking",
  "14:22 rjain: just shipped CHG-2292 to telemetryd, could that be it?",
  "14:26 mokafor: telemetryd doesn't sit in the request path, don't think so",
  "14:34 mokafor: auth p99 is ~3s. gateway is timing out on auth calls?",
  "14:41 dpark: my timeout change was at 14:00, auth p99 is normally ~2.8s at peak... that's it",
  "14:45 dpark: rolling back CHG-2291",
  "14:49 mokafor: error rate back under 1%",
  "",
].join("\n");

var IR_SECTIONS = ["summary", "impact", "timeline", "root cause", "action items"];

function gradeIncident(files) {
  var w = (files.window || "").replace(/\s+/g, "").toLowerCase();
  var windowOk = /start=14:02/.test(w) && /end=14:47/.test(w);
  var cause = (files.cause || "").toUpperCase();
  var ids = cause.match(/CHG-\d+/g) || [];
  var causeOk = ids.length === 1 && ids[0] === "CHG-2291";
  var pm = files.postmortem || "", low = pm.toLowerCase();
  var headings = (pm.match(/^#+\s*(.+)$/gm) || []).map(function (h) { return h.replace(/^#+\s*/, "").trim().toLowerCase(); });
  var missing = IR_SECTIONS.filter(function (s) { return !headings.some(function (h) { return h.indexOf(s) === 0; }); });
  // action items: bullets after the Action items heading
  var ai = low.split(/^#+\s*action items.*$/m)[1] || "";
  ai = ai.split(/^#+\s/m)[0];
  var actions = (ai.match(/^\s*([-*]|\d+\.)\s+\S.{8,}/gm) || []).length;
  var report = {
    sections: missing.length === 0, missing: missing,
    cause: /chg-2291/.test(low),
    window: /14:02/.test(low) && /14:47/.test(low),
    actions: actions >= 2,
    blameless: !/\bdpark\b|\brjain\b|\bmokafor\b|\bblame|\bfault of|\bcareless/.test(low),
  };
  report.ok = report.sections && report.cause && report.window && report.actions && report.blameless;
  return { windowOk: windowOk, causeOk: causeOk, report: report };
}

var PM_TEMPLATE = [
  "# Postmortem: <title>",
  "",
  "## Summary",
  "",
  "## Impact",
  "",
  "## Timeline",
  "",
  "## Root cause",
  "",
  "## Action items",
  "",
].join("\n");

function installIncident(shell) {
  shell._addDirs(["incident", "answers"]);
  shell._addFiles({
    "incident/metrics.csv": { content: buildMetrics(), mode: "644" },
    "incident/changes.csv": { content: CHANGES, mode: "644" },
    "incident/alerts.log": { content: ALERTS, mode: "644" },
    "incident/chat.log": { content: CHAT, mode: "644" },
    "answers/postmortem.md": { content: PM_TEMPLATE, mode: "644" },
    "README.txt": { content: "INC-0412: api-gateway 5xx spike, resolved.\nEvidence in incident/. Write your findings to answers/.\n  postmortem-lint   check your answers/postmortem.md\n", mode: "644" },
  });
  function read(p) { var f = shell._fs()[shell._root(p)]; return f ? f.content : ""; }
  function files() { return { window: read("answers/window.txt"), cause: read("answers/cause.txt"), postmortem: read("answers/postmortem.md") }; }
  shell.incidentGrade = function () { return gradeIncident(files()); };

  // a linter that reports structure/professionalism, never the facts themselves
  shell._addCommand("postmortem-lint", function () {
    var r = gradeIncident(files()).report, out = ["postmortem-lint answers/postmortem.md"];
    out.push("  " + (r.sections ? "ok  " : "WARN") + " required sections" + (r.sections ? "" : " — missing: " + r.missing.join(", ")));
    out.push("  " + (r.actions ? "ok  " : "WARN") + " action items: need at least 2 bullet items under '## Action items'");
    out.push("  " + (r.blameless ? "ok  " : "WARN") + " blameless language: describe systems and decisions, not individuals");
    out.push("  (facts — window, cause — are checked by the reviewer, not the linter)");
    return { out: out.join("\n"), code: r.sections && r.actions && r.blameless ? 0 : 1 };
  });
}

if (typeof module !== "undefined") module.exports = { installIncident: installIncident, gradeIncident: gradeIncident, buildMetrics: buildMetrics };
