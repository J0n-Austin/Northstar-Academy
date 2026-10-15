/* Capstone: "First on-call night". One environment that combines the network,
   C, and detection packs with an incident write-up. Nothing new to learn here;
   the point is working across systems without a step-by-step brief, and
   connecting evidence from different places into one account. Each stage is
   graded by the same live checks the individual labs use, plus a report
   grader that requires facts only the learner's own investigation reveals. */

function capInstallers() {
  if (typeof window === "undefined") {
    return { net: require("./engine3.js").installNetworking, c: require("./engine5.js").installC, det: require("./engine7.js").installDetection };
  }
  return { net: installNetworking, c: installC, det: installDetection };
}

var CAP_REPORT = [
  "# Incident report: night of on-call",
  "",
  "## Summary",
  "",
  "## Impact",
  "",
  "## Timeline",
  "",
  "## Root cause",
  "",
  "## Security findings",
  "",
  "## Action items",
  "",
].join("\n");

var CAP_SECTIONS = ["summary", "impact", "timeline", "root cause", "security findings", "action items"];

function gradeCapstoneReport(text) {
  var low = (text || "").toLowerCase();
  var headings = ((text || "").match(/^#+\s*(.+)$/gm) || []).map(function (h) { return h.replace(/^#+\s*/, "").trim().toLowerCase(); });
  var missing = CAP_SECTIONS.filter(function (s) { return !headings.some(function (h) { return h.indexOf(s) === 0; }); });
  var ai = (low.split(/^#+\s*action items.*$/m)[1] || "").split(/^#+\s/m)[0];
  var actions = (ai.match(/^\s*([-*]|\d+\.)\s+\S.{8,}/gm) || []).length;
  var r = {
    sections: missing.length === 0, missing: missing,
    network: /(hosts|dns)/.test(low) && /10\.0\.3\.12/.test(low) && /8443/.test(low),   // both faults: stale hosts entry + wrong port
    account: /\bguest\b/.test(low) && /203\.0\.113\.7/.test(low),           // which account, from where
    code: /count_char|to_int|longest_run|logutil/.test(low),                 // the tooling bug fixed
    actions: actions >= 3,
    blameless: !/\bblame|\bfault of|\bcareless|\bincompetent/.test(low),
  };
  r.ok = r.sections && r.network && r.account && r.code && r.actions && r.blameless;
  return r;
}

function installCapstone(shell) {
  var I = capInstallers();
  I.net(shell); I.c(shell); I.det(shell);
  shell._addDirs(["answers"]);
  shell._addFiles({
    "answers/report.md": { content: CAP_REPORT, mode: "644" },
    "README.txt": { content: [
      "ON-CALL HANDOFF (02:10)",
      "",
      "1. Pager: api-gateway can't reach auth. Customers can't log in.",
      "2. Security asked whether anyone got in during the outage. Auth log: logs/auth.jsonl.",
      "   We need a detection that would have caught it, that won't page on svc accounts.",
      "3. The log-summary tool we use to count events (src/logutil.c) has been giving",
      "   wrong numbers. `make test` is red.",
      "4. Morning: write it up in answers/report.md (report-lint checks structure only).",
      "",
      "You have the tools from earlier tickets: dig, ss, curl, gateway --check, gcc, make test,",
      "detect, grep/awk/jq, edit. No step-by-step this time.",
      "",
    ].join("\n"), mode: "644" },
  });
  shell._addCommand("report-lint", function () {
    var f = shell._fs()[shell._root("answers/report.md")], r = gradeCapstoneReport(f ? f.content : "");
    var out = ["report-lint answers/report.md",
      "  " + (r.sections ? "ok  " : "WARN") + " sections" + (r.sections ? "" : " — missing: " + r.missing.join(", ")),
      "  " + (r.actions ? "ok  " : "WARN") + " at least 3 action items under '## Action items'",
      "  " + (r.blameless ? "ok  " : "WARN") + " blameless language",
      "  (whether the facts are right is the reviewer's call)"];
    return { out: out.join("\n"), code: r.sections && r.actions && r.blameless ? 0 : 1 };
  });
  shell.capReport = function () { var f = shell._fs()[shell._root("answers/report.md")]; return gradeCapstoneReport(f ? f.content : ""); };
}

if (typeof module !== "undefined") module.exports = { installCapstone: installCapstone, gradeCapstoneReport: gradeCapstoneReport };
