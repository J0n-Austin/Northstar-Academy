const { createShell } = require("./engine.js");
const { installIncident, gradeIncident } = require("./engine11.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };

const sh = createShell(); installIncident(sh);
// derive the window with the shell tools the learner would use
var hot = sh.run("awk -F, 'NR > 1 && $4 > 5 {print $1}' incident/metrics.csv").out.trim().split("\n");
ok("awk finds impact minutes", hot.length > 30);
ok("first impacted minute is 14:02", hot[0] === "14:02");
ok("last impacted minute is 14:47", hot[hot.length - 1] === "14:47");
ok("no minute before 14:02 is > 5%", !/^1[34]:[0-5]\d$/.test(hot[0]) || hot[0] >= "14:02");
ok("change log greppable for api-gateway", /CHG-2291/.test(sh.run("grep api-gateway incident/changes.csv").out));
ok("chat log has the red herring", /CHG-2292/.test(sh.run("cat incident/chat.log").out));

var GOOD_PM = [
  "# Postmortem: api-gateway 5xx spike (INC-0412)",
  "## Summary",
  "A gateway timeout change made auth calls fail under peak latency.",
  "## Impact",
  "From 14:02 to 14:47, roughly 20% of gateway requests returned 5xx.",
  "## Timeline",
  "- 14:00 CHG-2291 deployed (auth upstream timeout 30s -> 3s)",
  "- 14:05 gateway-5xx-rate alert fired",
  "- 14:45 CHG-2291 rolled back; 14:47 last impacted minute",
  "## Root cause",
  "CHG-2291 set the auth timeout to 3s, below auth's normal peak p99 (~2.8-3s), so calls timed out.",
  "## Action items",
  "- Add a pre-deploy check that timeouts exceed the upstream's p99 with margin",
  "- Canary gateway config changes and alert on error rate before full rollout",
].join("\n");

var g = gradeIncident({ window: "start=14:02\nend=14:47\n", cause: "CHG-2291\n", postmortem: GOOD_PM });
ok("good answers: window ok", g.windowOk);
ok("good answers: cause ok", g.causeOk);
ok("good postmortem passes", g.report.ok);

ok("blaming the latest change (CHG-2292) fails", !gradeIncident({ cause: "CHG-2292" }).causeOk);
ok("listing several changes doesn't pass", !gradeIncident({ cause: "CHG-2291 or CHG-2292" }).causeOk);
ok("alert time instead of impact start fails", !gradeIncident({ window: "start=14:05 end=14:50" }).windowOk);
ok("naming an engineer fails blameless", !gradeIncident({ postmortem: GOOD_PM.replace("CHG-2291 set", "dpark's CHG-2291 set") }).report.blameless);
ok("one action item isn't enough", !gradeIncident({ postmortem: GOOD_PM.replace(/- Canary.*$/m, "") }).report.actions);
ok("missing a section is reported", gradeIncident({ postmortem: GOOD_PM.replace("## Timeline", "Timeline:") }).report.missing.indexOf("timeline") >= 0);

ok("lint warns on the empty template", sh.run("postmortem-lint").code === 1);
sh.writeFile("answers/postmortem.md", GOOD_PM);
sh.run("echo start=14:02 > answers/window.txt"); sh.run("echo end=14:47 >> answers/window.txt");
sh.run("echo CHG-2291 > answers/cause.txt");
ok("lint passes on a good postmortem", sh.run("postmortem-lint").code === 0);
var sg = sh.incidentGrade();
ok("shell grade: all three pass", sg.windowOk && sg.causeOk && sg.report.ok);
sh.reset();
ok("reset restores the template", /<title>/.test(sh.fileContent("answers/postmortem.md")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
