const { createShell } = require("./engine.js");
const { installCapstone, gradeCapstoneReport } = require("./engine12.js");
const { visibleLog, truth } = require("./engine7.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };
const allPass = (r) => r && r.compiled && Object.keys(r.results).every((k) => r.results[k].passed === r.results[k].total);

const sh = createShell(); installCapstone(sh);
// every subsystem is present in ONE shell
ok("README is the on-call handoff", /ON-CALL HANDOFF/.test(sh.fileContent("README.txt")));
ok("gateway starts broken", sh.run("gateway --check").code === 1);
ok("make test starts red", sh.run("make test").code === 1);
ok("detect is available", sh.run("detect").code === 0);
ok("report-lint warns on template", sh.run("report-lint").code === 1);

// stage 1: restore service
sh.run("sed -i 's/10.0.3.99/10.0.3.12/' etc/hosts");
sh.run("sed -i 's/upstream_port = 8080/upstream_port = 8443/' etc/gateway.conf");
ok("stage 1: gateway healthy", sh.run("gateway --check").code === 0);

// stage 2: fix the tool
const src = sh.fileContent("src/logutil.c")
  .replace("i < strlen(s) - 1", "i < strlen(s)")
  .replace("v = v * 10 + (s[i] - '0');          /* bug: no digit validation */", "if (s[i] < '0' || s[i] > '9') return -1;\n        v = v * 10 + (s[i] - '0');")
  .replace("if (s[i] == c) cur++;               /* bug: cur never resets on a miss */", "if (s[i] == c) cur++; else cur = 0;");
sh.writeFile("src/logutil.c", src);
ok("stage 2: make test green", sh.run("make test").code === 0 && allPass(sh.cTestResults()));

// stage 3: detection that generalizes
sh.writeFile("rules/detections.txt", "rule: brute-force-confirmed\nwhen: event == login_failed\ngroup_by: user\ncount: >= 5\nfollowed_by: event == login_success\n");
const rv = sh.detRun("visible"), rh = sh.detRun("hidden");
ok("stage 3: rule catches only the attack (visible)", JSON.stringify(rv.rules[0].set) === JSON.stringify(sh.detTruth("visible").attackUsers));
ok("stage 3: rule generalizes (hidden)", JSON.stringify(rh.rules[0].set) === JSON.stringify(sh.detTruth("hidden").attackUsers));
ok("the attacker IP is findable with grep", /203\.0\.113\.7/.test(sh.run("grep guest logs/auth.jsonl").out));

// stage 4: report
const GOOD = [
  "# Incident report: night of on-call",
  "## Summary", "Gateway could not reach auth; during the outage the guest account was brute-forced.",
  "## Impact", "Logins failed from 01:52 to 02:40.",
  "## Timeline", "- 02:10 paged", "- 02:25 hosts fixed", "- 02:31 port fixed",
  "## Root cause", "A stale /etc/hosts entry sent auth.northstar.internal to 10.0.3.99 instead of 10.0.3.12, and the gateway used port 8080 instead of 8443.",
  "## Security findings", "Account guest: 6 failures from 203.0.113.7 then a success. Our logutil count_char bug undercounted failures.",
  "## Action items", "- Manage hosts entries from service discovery, not by hand", "- Deploy the brute-force-confirmed detection", "- Disable or rotate the guest account and review its session",
].join("\n");
const g = gradeCapstoneReport(GOOD);
ok("good report passes", g.ok);
ok("report without the attacker IP fails account", !gradeCapstoneReport(GOOD.replace(/203\.0\.113\.7/g, "an IP")).account);
ok("report naming only one network fault fails network", !gradeCapstoneReport(GOOD.replace(/, and the gateway used port 8080 instead of 8443/, "")).network);
ok("report missing Security findings section fails", gradeCapstoneReport(GOOD.replace("## Security findings", "Security:")).missing.indexOf("security findings") >= 0);
ok("blaming language fails", !gradeCapstoneReport(GOOD + "\nThis was the fault of the night shift.").blameless);
sh.writeFile("answers/report.md", GOOD);
ok("report-lint passes", sh.run("report-lint").code === 0);
ok("capReport hook ok", sh.capReport().ok);

sh.reset();
ok("reset: gateway broken again", sh.run("gateway --check").code === 1);
ok("reset: report template back", /## Security findings\n\n## Action/.test(sh.fileContent("answers/report.md")));
ok("reset: README is still the handoff", /ON-CALL HANDOFF/.test(sh.fileContent("README.txt")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
