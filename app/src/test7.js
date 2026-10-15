const { createShell } = require("./engine.js");
const { installDetection, evalAll, truth, visibleLog, hiddenLog } = require("./engine7.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// truth over the visible data (computed from the log, not from rules)
var T = truth(visibleLog());
ok("truth: 13 failed-login events", T.allFailed.length === 13);
ok("truth: threshold users are guest + svc-backup", same(T.thresholdUsers, ["guest", "svc-backup"]));
ok("truth: only guest is a real attack (failures then success)", same(T.attackUsers, ["guest"]));
var TH = truth(hiddenLog());
ok("hidden truth: only mallory is the attack", same(TH.attackUsers, ["mallory"]));

// D1: a match rule flags every failed login
var d1 = evalAll("rule: auth-failure\nwhen: event == login_failed", visibleLog());
ok("D1 rule parses", d1.ok);
ok("D1 fires on exactly the failed-login events", same(d1.rules[0].set, T.allFailed));

// D2: group_by + threshold catches both high-failure users
var d2 = evalAll("rule: brute\nwhen: event == login_failed\ngroup_by: user\ncount: >= 5", visibleLog());
ok("D2 fires on guest + svc-backup", same(d2.rules[0].set, ["guest", "svc-backup"]));

// D3: add a followed_by success -> only the real attack, no false positive
var good = "rule: brute\nwhen: event == login_failed\ngroup_by: user\ncount: >= 5\nfollowed_by: event == login_success";
var d3 = evalAll(good, visibleLog());
ok("D3 fires only on guest (no svc-backup false positive)", same(d3.rules[0].set, ["guest"]));
ok("D3 generalizes to the hidden log (only mallory)", same(evalAll(good, hiddenLog()).rules[0].set, ["mallory"]));

// an over-tuned rule that names the attacker directly still works on visible but FAILS hidden (cheat-resistance)
var cheat = "rule: brute\nwhen: event == login_failed\nwhen: user == guest\ngroup_by: user\ncount: >= 5";
ok("cheat rule matches on visible", same(evalAll(cheat, visibleLog()).rules[0].set, ["guest"]));
ok("cheat rule FAILS to generalize (empty on hidden)", same(evalAll(cheat, hiddenLog()).rules[0].set, []));

// parse errors are reported
ok("bad condition is a parse error", !evalAll("rule: x\nwhen: event is login_failed", visibleLog()).ok);

// in a shell
var sh = createShell(); installDetection(sh);
ok("starter detect reports no rules", /No rules defined/.test(sh.run("detect").out));
sh.writeFile("rules/detections.txt", "rule: auth-failure\nwhen: event == login_failed");
ok("detect lists the match rule's alerts", /auth-failure/.test(sh.run("detect").out) && /13 alerts/.test(sh.run("detect").out));
ok("detRun hook returns structured results", sh.detRun("visible").rules[0].set.length === 13);
ok("detTruth hook exposes attack users", same(sh.detTruth("visible").attackUsers, ["guest"]));
sh.writeFile("rules/detections.txt", good);
ok("full solution: some rule fires exactly on the attack (visible)", sh.detRun("visible").rules.some(function (r) { return same(r.set, ["guest"]); }));
ok("full solution generalizes (hidden)", sh.detRun("hidden").rules.some(function (r) { return same(r.set, ["mallory"]); }));
sh.reset();
ok("reset restores the starter rules file", /Detection rules/.test(sh.fileContent("rules/detections.txt")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
