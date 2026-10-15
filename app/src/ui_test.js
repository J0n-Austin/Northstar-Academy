// Headless browser tests for the built app. Usage: node ui_test.js [htmlPath]
const { chromium } = require("playwright-core");
const file = "file://" + (process.argv[2] || require("path").join(__dirname, "..", "northstar-academy.html"));
let pass = 0, fail = 0;
const ok = (label, cond, detail) => { if (cond) { console.log("PASS", label); pass++; } else { console.log("FAIL", label, detail !== undefined ? "-> " + JSON.stringify(detail) : ""); fail++; } };

(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--headless=new", "--no-sandbox"] });
  const pg = await b.newPage({ viewport: { width: 1200, height: 860 } });
  const errs = [];
  pg.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  pg.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  const type = async (cmd) => { await pg.fill("#cmd", cmd); await pg.press("#cmd", "Enter"); await pg.waitForTimeout(40); };
  const lastLines = async (n) => (await pg.locator("#term > div").allTextContents()).slice(-n);

  await pg.goto(file); await pg.waitForTimeout(300);
  await pg.click("#start"); await pg.waitForTimeout(150);

  // ---- navigation in the fundamentals lab ----
  await pg.click("[data-open=fundamentals]"); await pg.waitForTimeout(200);
  ok("editor is not visible until opened", !(await pg.isVisible("#editor")));
  ok("prompt starts at ~/lab", (await pg.textContent("#promptPath")) === "~/lab");
  await type("ls");
  ok("ls at root lists answers + scenario", (await lastLines(1))[0] === "answers  scenario", await lastLines(1));
  ok("directories are coloured", (await pg.locator("#term .dir").count()) >= 2);
  await type("cd scenario");
  ok("prompt updates after cd", (await pg.textContent("#promptPath")) === "~/lab/scenario", await pg.textContent("#promptPath"));
  ok("title bar follows the prompt", /~\/lab\/scenario$/.test(await pg.textContent("#termTitle")));
  await type("ls");
  ok("ls after cd lists the new directory", (await lastLines(1))[0] === "logs  secrets  service", await lastLines(1));
  ok("echoed prompt shows where the command ran", /~\/lab\/scenario\$ ls/.test((await lastLines(2))[0]), await lastLines(2));
  await type("cd logs"); await type("ls");
  ok("nested ls", (await lastLines(1))[0] === "app.log  auth.log  worker.log", await lastLines(1));
  await type("cd /home/sam/lab/scenario/secrets");
  ok("cd to the pwd-style path works", (await pg.textContent("#promptPath")) === "~/lab/scenario/secrets");
  await type("cd ~");
  ok("cd ~ goes home", (await pg.textContent("#promptPath")) === "~/lab");

  // ---- tab completion ----
  await pg.fill("#cmd", "cat sce"); await pg.press("#cmd", "Tab");
  ok("tab completes a directory", (await pg.inputValue("#cmd")) === "cat scenario/", await pg.inputValue("#cmd"));
  await pg.fill("#cmd", "cat scenario/logs/"); await pg.press("#cmd", "Tab");
  ok("ambiguous tab lists the options", /app\.log\s+auth\.log\s+worker\.log/.test((await lastLines(1))[0]), await lastLines(1));
  await pg.fill("#cmd", "gre"); await pg.press("#cmd", "Tab");
  ok("tab completes a command", (await pg.inputValue("#cmd")) === "grep ");
  ok("Tab keeps focus in the terminal", await pg.evaluate(() => document.activeElement && document.activeElement.id === "cmd"));

  // ---- a task finished from a subdirectory still ticks ----
  await type("cd answers");
  await type("grep -h -w ERROR ../scenario/logs/*.log | grep -i -c timeout > 01.txt");
  ok("task 1 ticks when solved from inside answers/", (await pg.textContent("#score")).startsWith("1 /"), await pg.textContent("#score"));

  // ---- reset swaps the shell and the terminal follows it ----
  await pg.click("#reset-lab"); await pg.waitForTimeout(150);
  ok("reset clears progress", (await pg.textContent("#score")).startsWith("0 /"));
  ok("reset returns the prompt home", (await pg.textContent("#promptPath")) === "~/lab");
  await type("chmod 600 scenario/secrets/service.key");
  ok("commands after reset reach the NEW shell (task ticks)", (await pg.textContent("#score")).startsWith("1 /"), await pg.textContent("#score"));

  // ---- triage lab from inside etc/ ----
  await pg.click("#back"); await pg.waitForTimeout(100);
  await pg.click("[data-open=triage]"); await pg.waitForTimeout(150);
  await type("cd etc");
  await type("sed -i 's/interval  = 0/interval  = 15/' telemetryd.conf");
  await type("chmod 600 telemetryd.key");
  ok("triage 'make it start' ticks when fixed from etc/", (await pg.locator("#task-t2.done").count()) === 1);

  if (process.env.SHOTS) await pg.screenshot({ path: process.env.SHOTS + "/nav.png" });

  // ---- editor: fix the key perms task via a real edit flow in the networking lab ----
  await pg.click("#back"); await pg.waitForTimeout(100);
  await pg.click("[data-open=networking]"); await pg.waitForTimeout(150);
  await type("edit etc/hosts");
  ok("edit opens the editor", await pg.isVisible("#editor"));
  ok("editor shows the file name", (await pg.textContent("#edName")) === "etc/hosts");
  ok("editor has focus", await pg.evaluate(() => document.activeElement.id === "edText"));
  const orig = await pg.inputValue("#edText");
  ok("editor loads the file content", /10\.0\.3\.99\s+auth/.test(orig));
  await pg.fill("#edText", orig.replace("10.0.3.99", "10.0.3.12"));
  ok("modified marker appears", await pg.isVisible("#edMod"));
  await pg.press("#edText", "Control+s"); await pg.waitForTimeout(80);
  ok("Ctrl+S saves (marker clears)", !(await pg.isVisible("#edMod")));
  ok("save is echoed in the terminal", /\[saved etc\/hosts\]/.test((await lastLines(1))[0]));
  ok("DNS task ticks from an editor save", (await pg.locator("#task-n2.done").count()) === 1);
  // unsaved-changes guard
  await pg.fill("#edText", "garbage");
  await pg.press("#edText", "Escape"); await pg.waitForTimeout(50);
  ok("first Esc on unsaved changes warns, stays open", (await pg.isVisible("#editor")) && (await pg.isVisible("#edWarn")));
  await pg.press("#edText", "Escape"); await pg.waitForTimeout(50);
  ok("second Esc discards and closes", !(await pg.isVisible("#editor")));
  ok("discarded edit did not reach the file", (await pg.locator("#task-n2.done").count()) === 1);
  ok("focus returns to the prompt", await pg.evaluate(() => document.activeElement.id === "cmd"));
  // relative path from a subdir + new file
  await type("cd etc"); await type("nano gateway.conf");
  ok("nano from a subdir opens the right file", /upstream_port = 8080/.test(await pg.inputValue("#edText")));
  const g = await pg.inputValue("#edText");
  await pg.fill("#edText", g.replace("upstream_port = 8080", "upstream_port = 8443"));
  await pg.click("#edSave"); await pg.click("#edClose"); await pg.waitForTimeout(60);
  ok("gateway task ticks after editing from etc/", (await pg.locator("#task-n3.done").count()) === 1);
  await type("edit ~/answers/scratch.txt");
  ok("new file is labelled", (await pg.textContent("#edTag")) === "new file");
  await pg.fill("#edText", "notes\n"); await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape");
  await type("cat ~/answers/scratch.txt");
  ok("new file exists after save", (await lastLines(1))[0] === "notes");
  // opening via real keystrokes must not leak the Enter into the file
  await pg.fill("#cmd", ""); await pg.type("#cmd", "edit gateway.conf"); await pg.keyboard.press("Enter"); await pg.waitForTimeout(80);
  const opened = await pg.inputValue("#edText");
  ok("Enter that opens the editor is not inserted into the file", opened.startsWith("# api-gateway"), opened.slice(0, 30));
  ok("freshly opened file is not marked modified", !(await pg.isVisible("#edMod")));
  ok("caret starts at Ln 1", (await pg.textContent("#edPos")) === "Ln 1, Col 1", await pg.textContent("#edPos"));
  if (process.env.SHOTS) await pg.screenshot({ path: process.env.SHOTS + "/editor.png" });
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(40);
  ok("unmodified file closes on the first Esc", !(await pg.isVisible("#editor")));

  // the left rail is styled, not browser-default buttons
  const railBg = await pg.evaluate(() => getComputedStyle(document.querySelector(".rail button:not(.active)")).backgroundColor);
  ok("rail buttons have no default button background", railBg === "rgba(0, 0, 0, 0)", railBg);
  ok("rail labels are tooltips, not inline text", await pg.evaluate(() => getComputedStyle(document.querySelector(".rail .lab")).position === "absolute"));

  // ---- scripting & automation module, written in the editor ----
  await pg.click("#back"); await pg.waitForTimeout(80);
  await pg.click("[data-open=automation]"); await pg.waitForTimeout(150);
  ok("four tickets now on the board", true); // presence checked below via tasks
  await type("edit bin/summary.sh");
  await pg.fill("#edText", "#!/bin/bash\nf=$1\necho lines=$(wc -l < $f)\necho errors=$(grep -c ERROR $f)\n");
  await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape"); await pg.waitForTimeout(60);
  await type("bash bin/summary.sh logs/service.log");
  ok("script runs and prints a summary", /lines=\d+\s+errors=\d+/.test((await lastLines(2)).join(" ")), await lastLines(2));
  ok("write-the-script task ticks (generalizes to the audit log)", (await pg.locator("#task-a1.done").count()) === 1);
  await type("./bin/summary.sh logs/service.log");
  ok("not-yet-executable still fails before chmod", /Permission denied/.test((await lastLines(1))[0]));
  await type("chmod +x bin/summary.sh");
  await type("./bin/summary.sh logs/service.log");
  ok("executable task ticks after chmod +x", (await pg.locator("#task-a2.done").count()) === 1);
  await type("crontab -e");
  ok("crontab -e opens the editor", await pg.isVisible("#editor"));
  await pg.fill("#edText", "0 2 * * * /home/sam/lab/bin/summary.sh logs/service.log\n");
  await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape"); await pg.waitForTimeout(60);
  ok("schedule task ticks after a crontab entry", (await pg.locator("#task-a3.done").count()) === 1);
  await type("crontab -l");
  ok("crontab -l shows the scheduled job", /summary\.sh/.test((await lastLines(1))[0]));
  // the PR flow is now reachable on this lab
  ok("open-PR CTA appears when all tasks pass", (await pg.locator("#openPR").count()) === 1);
  await pg.click("#openPR"); await pg.waitForTimeout(150);
  await pg.fill("#pr-reply", "I'd log to a file and alert on non-zero exit.");
  await pg.click("#pr-merge"); await pg.waitForTimeout(150);

  // ---- portal: activity feed reflects real events ----
  await pg.click(".rail button[data-view=portal]"); await pg.waitForTimeout(150);
  const feed = (await pg.locator(".feed .ev-bd").allTextContents()).join(" | ");
  ok("activity feed shows a merge event", /Merged/.test(feed), feed);
  ok("activity feed shows a passed-task event", /Passed/.test(feed));
  ok("portal shows automation ticket as Merged", (await pg.locator(".tick").allTextContents()).some((t) => /NS-168/.test(t) && /Merged/.test(t)));

  // ---- curriculum map ----
  await pg.click(".rail button[data-view=map]"); await pg.waitForTimeout(150);
  ok("map renders six stages", (await pg.locator(".stage").count()) === 6);
  ok("stage 1 shows a completed lab chip", (await pg.locator(".map-lab.done").count()) >= 1);
  ok("only specialization still marked coming", (await pg.locator(".stage.coming").count()) === 1);
  await pg.click(".map-lab"); await pg.waitForTimeout(120);
  ok("clicking a map lab opens it", (await pg.locator(".term-wrap").count()) === 1);

  // ---- wiki ----
  await pg.click(".rail button[data-view=wiki]"); await pg.waitForTimeout(150);
  ok("wiki renders runbook cards", (await pg.locator(".wiki-card").count()) >= 4);
  ok("wiki mentions telemetryd", /telemetryd/.test(await pg.textContent(".wiki")));

  // ---- transcript with evidence + reflections ----
  await pg.click(".rail button[data-view=skills]"); await pg.waitForTimeout(150);
  ok("transcript lists competencies", (await pg.locator(".tr-skill").count()) >= 6);
  ok("a competency shows linked evidence", (await pg.locator(".ev-list li").count()) >= 1);
  ok("transcript shows the PR reply reflection", /log to a file/.test(await pg.textContent("#view")));

  // ---- C programming lab: edit the source, run make test ----
  await pg.click(".rail button[data-view=labs]"); await pg.waitForTimeout(120);
  await pg.click("[data-open=cprog]"); await pg.waitForTimeout(150);
  await type("gcc -Wall src/logutil.c");
  ok("C: clean compile ticks c1", (await pg.locator("#task-c1.done").count()) === 1);
  await type("make test");
  ok("C: make test fails on the buggy source", /Some tests failed/.test((await lastLines(1)).concat(await lastLines(5)).join(" ")) || /FAIL/.test((await pg.locator("#term").textContent())));
  // fix all three bugs via the editor
  await type("edit src/logutil.c");
  let csrc = await pg.inputValue("#edText");
  csrc = csrc.replace("i < strlen(s) - 1", "i < strlen(s)")
             .replace("v = v * 10 + (s[i] - '0');", "if (s[i] < '0' || s[i] > '9') return -1;\n        v = v * 10 + (s[i] - '0');")
             .replace("if (s[i] == c) cur++;", "if (s[i] == c) cur++; else cur = 0;");
  await pg.fill("#edText", csrc);
  await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape"); await pg.waitForTimeout(80);
  await type("make test");
  ok("C: make test passes after real fixes", /All tests passed/.test((await pg.locator("#term").textContent())));
  ok("C: fix-both task ticks", (await pg.locator("#task-c2.done").count()) === 1);
  ok("C: longest_run task ticks", (await pg.locator("#task-c3.done").count()) === 1);

  // ---- Windows internals lab: inspect + report ----
  await pg.click("#back"); await pg.waitForTimeout(80);
  await pg.click("[data-open=wininternals]"); await pg.waitForTimeout(150);
  await type("tasklist");
  ok("Win: tasklist renders the process tree", /telemetryd\.exe/.test((await pg.locator("#term").textContent())));
  await type("echo pid=4820 > answers/w1.txt");
  ok("Win: odd-process task ticks", (await pg.locator("#task-w1.done").count()) === 1);
  await type("pe telemetryd.exe");
  await type("echo subsystem=CUI sections=5 > answers/w2.txt");
  ok("Win: PE-header task ticks", (await pg.locator("#task-w2.done").count()) === 1);
  await type("handle 4820");
  await type("echo telemetry.db > answers/w3.txt");
  ok("Win: shared-handle task ticks", (await pg.locator("#task-w3.done").count()) === 1);
  ok("Win: all three done -> PR CTA", (await pg.locator("#openPR").count()) === 1);

  if (process.env.SHOTS) { await pg.screenshot({ path: process.env.SHOTS + "/win.png" }); }

  // ---- Detection Engineering lab: write + tune rules ----
  await pg.click("#back"); await pg.waitForTimeout(80);
  await pg.click("[data-open=detection]"); await pg.waitForTimeout(150);
  await type("detect");
  ok("Det: starter detect says no rules", /No rules defined/.test((await lastLines(1))[0]));
  // D1: match rule
  await type("edit rules/detections.txt");
  await pg.fill("#edText", "rule: auth-failure\nwhen: event == login_failed\n");
  await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape"); await pg.waitForTimeout(60);
  await type("detect");
  ok("Det: match rule ticks de1", (await pg.locator("#task-de1.done").count()) === 1);
  // D2: add a threshold rule (keep the first)
  await type("edit rules/detections.txt");
  await pg.fill("#edText", "rule: auth-failure\nwhen: event == login_failed\n\nrule: high-failures\nwhen: event == login_failed\ngroup_by: user\ncount: >= 5\n");
  await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape"); await pg.waitForTimeout(60);
  await type("detect");
  ok("Det: threshold rule ticks de2", (await pg.locator("#task-de2.done").count()) === 1);
  ok("Det: de1 still satisfied", (await pg.locator("#task-de1.done").count()) === 1);
  ok("Det: detect shows two flagged accounts", /guest/.test(await pg.locator("#term").textContent()) && /svc-backup/.test(await pg.locator("#term").textContent()));
  // D3: add a correlated rule alongside the others
  await type("edit rules/detections.txt");
  await pg.fill("#edText", "rule: auth-failure\nwhen: event == login_failed\n\nrule: high-failures\nwhen: event == login_failed\ngroup_by: user\ncount: >= 5\n\nrule: brute-force-confirmed\nwhen: event == login_failed\ngroup_by: user\ncount: >= 5\nfollowed_by: event == login_success\n");
  await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape"); await pg.waitForTimeout(60);
  await type("detect");
  ok("Det: correlated rule ticks de3 (precision + generalization)", (await pg.locator("#task-de3.done").count()) === 1);
  ok("Det: all three detection tasks done at once", (await pg.locator(".task.done").count()) === 3);
  ok("Det: all three done -> PR CTA", (await pg.locator("#openPR").count()) === 1);
  if (process.env.SHOTS) { await pg.screenshot({ path: process.env.SHOTS + "/detection.png" }); }

  const edit = async (file, fn) => { await type("edit " + file); const v = await pg.inputValue("#edText"); await pg.fill("#edText", fn(v)); await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape"); await pg.waitForTimeout(60); };
  const termText = async () => await pg.locator("#term").textContent();
  const openLab = async (id) => { await pg.click("#back"); await pg.waitForTimeout(80); await pg.click("[data-open=" + id + "]"); await pg.waitForTimeout(150); };

  // ---- Linux internals ----
  await openLab("linuxint");
  await type("df"); ok("LX: df shows /var 97%", /97%\s+\/var/.test(await termText()));
  await type("lsof 902"); ok("LX: lsof reveals deleted log", /telemetryd\.log\.1 \(deleted\)/.test(await termText()));
  await type("echo pid=902 > answers/l1.txt"); ok("LX: disk task ticks", (await pg.locator("#task-li1.done").count()) === 1);
  await type("procstat 2240"); await type("echo parent=2201 > answers/l2.txt"); ok("LX: zombie task ticks", (await pg.locator("#task-li2.done").count()) === 1);
  await type("echo pid=3177 > answers/l3.txt"); await type("echo remote=198.51.100.23 >> answers/l3.txt");
  ok("LX: listener task ticks", (await pg.locator("#task-li3.done").count()) === 1);
  ok("LX: PR CTA", (await pg.locator("#openPR").count()) === 1);

  // ---- Secure coding ----
  await openLab("secure");
  await type("make test"); ok("SC: sanitizer finding shown", /SANITIZER: out-of-bounds read/.test(await termText()));
  ok("SC: nothing ticked at start", (await pg.locator(".task.done").count()) === 0);
  await edit("src/netparse.c", (v) => v.replace("    int sum = 0;\n", "    int sum = 0;\n    if (len < 0 || len > strlen(s)) return -1;\n"));
  await type("make test"); ok("SC: checksum task ticks", (await pg.locator("#task-sc1.done").count()) === 1);
  await edit("src/netparse.c", (v) => v.replace("        p = p * 10 + (s[i] - '0');\n    }\n    return p;", "        p = p * 10 + (s[i] - '0');\n        if (p > 65535) return -1;\n    }\n    if (p < 1) return -1;\n    return p;")
                                        .replace("    return strlen(s);", "    if (max < 0) return 0;\n    int n = strlen(s);\n    if (n > max) return max;\n    return n;"));
  await type("make test"); ok("SC: all tests pass", /All tests passed/.test(await termText()));
  ok("SC: all three tasks done", (await pg.locator(".task.done").count()) === 3);

  // ---- Code review ----
  await openLab("codereview");
  await type("pr show pr1"); ok("CR: diff rendered", /\+\+\+ b\/src\/logutil\.c/.test(await termText()));
  await edit("answers/review.txt", (v) => v + "pr1: request-changes off-by-one skips index 0\npr2: approve\n");
  ok("CR: pr1 + pr2 tick", (await pg.locator("#task-cr1.done").count()) === 1 && (await pg.locator("#task-cr2.done").count()) === 1);
  ok("CR: pr3 not yet", (await pg.locator("#task-cr3.done").count()) === 0);
  await type("echo 'pr3: request-changes needs input validation' >> answers/review.txt");
  ok("CR: pr3 ticks", (await pg.locator("#task-cr3.done").count()) === 1);

  // ---- Incident ----
  await openLab("incident");
  await type("awk -F, 'NR > 1 && $4 > 5 {print $1}' incident/metrics.csv | head -1");
  ok("IR: awk finds 14:02", (await lastLines(1))[0] === "14:02", await lastLines(1));
  await type("echo start=14:02 > answers/window.txt"); await type("echo end=14:47 >> answers/window.txt");
  ok("IR: window ticks", (await pg.locator("#task-ir1.done").count()) === 1);
  await type("echo CHG-2292 > answers/cause.txt"); ok("IR: red herring does not tick", (await pg.locator("#task-ir2.done").count()) === 0);
  await type("echo CHG-2291 > answers/cause.txt"); ok("IR: real cause ticks", (await pg.locator("#task-ir2.done").count()) === 1);
  await edit("answers/postmortem.md", () => "# Postmortem\n## Summary\nGateway timeout too low for auth.\n## Impact\n14:02 to 14:47, ~20% 5xx.\n## Timeline\n- 14:00 CHG-2291\n- 14:45 rollback\n## Root cause\nCHG-2291 set auth timeout to 3s, below auth p99.\n## Action items\n- Validate timeouts against upstream p99 before deploy\n- Canary gateway config changes with error-rate gate\n");
  await type("postmortem-lint"); ok("IR: lint ok", /ok\s+blameless/.test(await termText()));
  ok("IR: postmortem ticks", (await pg.locator("#task-ir3.done").count()) === 1);

  // ---- Capstone ----
  await openLab("capstone");
  await type("cat README.txt"); ok("CAP: handoff shown", /ON-CALL HANDOFF/.test(await termText()));
  await type("sed -i 's/10.0.3.99/10.0.3.12/' etc/hosts"); await type("sed -i 's/upstream_port = 8080/upstream_port = 8443/' etc/gateway.conf");
  await type("gateway --check"); ok("CAP: logins restored", (await pg.locator("#task-cp1.done").count()) === 1);
  await edit("src/logutil.c", (v) => v.replace("i < strlen(s) - 1", "i < strlen(s)").replace("v = v * 10 + (s[i] - '0');", "if (s[i] < '0' || s[i] > '9') return -1;\n        v = v * 10 + (s[i] - '0');").replace("if (s[i] == c) cur++;", "if (s[i] == c) cur++; else cur = 0;"));
  await type("make test"); ok("CAP: tool fixed", (await pg.locator("#task-cp2.done").count()) === 1);
  await edit("rules/detections.txt", () => "rule: brute-force-confirmed\nwhen: event == login_failed\ngroup_by: user\ncount: >= 5\nfollowed_by: event == login_success\n");
  await type("detect"); ok("CAP: detection ticks", (await pg.locator("#task-cp3.done").count()) === 1);
  await edit("answers/report.md", () => "# Report\n## Summary\nLogins down; guest brute-forced.\n## Impact\nLogins failed overnight.\n## Timeline\n- 02:10 paged\n## Root cause\nStale hosts entry (10.0.3.99 instead of 10.0.3.12) and gateway port 8080 instead of 8443.\n## Security findings\nguest: failures from 203.0.113.7 then success. logutil count_char undercounted.\n## Action items\n- Generate hosts from service discovery\n- Deploy brute-force-confirmed rule\n- Rotate guest credentials and review sessions\n");
  ok("CAP: report ticks", (await pg.locator("#task-cp4.done").count()) === 1);
  ok("CAP: all four done -> PR CTA", (await pg.locator("#openPR").count()) === 1);
  if (process.env.SHOTS) { await pg.screenshot({ path: process.env.SHOTS + "/capstone.png" }); }

  // ---- Sockets & protocols ----
  await openLab("sockets");
  await type("printf '0004:PING' | nc status.northstar.internal 7070");
  ok("SO: PING round trip", (await lastLines(1))[0] === "0004:PONG", await lastLines(1));
  await type("printf '0006:STATUS' | nc status.northstar.internal 7070");
  ok("SO: STATUS reply", /build=7f3a2c/.test((await lastLines(1))[0]));
  await type("echo build=7f3a2c > answers/build.txt");
  ok("SO: by-hand task ticks", (await pg.locator("#task-so1.done").count()) === 1);
  await type("nsp-client"); ok("SO: client fails as shipped", /did not receive/.test(await termText()));
  await edit("src/nspframe.c", (v) => v.replace("    int len = 0;\n    for (int i = 0; i < 4; i++) {", "    int len = 0;\n    if (n - start < 5) return 0;\n    for (int i = 0; i < 4; i++) {")
    .replace("    if (buf[start + 4] != ':') return -1;\n    return 5 + len;", "    if (buf[start + 4] != ':') return -1;\n    if (len > 1024) return -1;\n    return 5 + len;"));
  await type("make test");
  ok("SO: header task ticks", (await pg.locator("#task-so2.done").count()) === 1);
  ok("SO: stream task not yet", (await pg.locator("#task-so3.done").count()) === 0);
  await edit("src/nspframe.c", (v) => v.replace("    int len = frame_len(buf, 0, n);\n    if (len < 0) return -1;\n    if (len > 0 && len <= n) return 1;\n    return 0;",
    "    int off = 0;\n    int count = 0;\n    while (off < n) {\n        int len = frame_len(buf, off, n);\n        if (len < 0) return -1;\n        if (len == 0 || off + len > n) return count;\n        count++;\n        off += len;\n    }\n    return count;"));
  await type("nsp-client"); ok("SO: client succeeds", /2 replies received/.test(await termText()));
  ok("SO: stream task ticks", (await pg.locator("#task-so3.done").count()) === 1);
  if (process.env.SHOTS) { await pg.screenshot({ path: process.env.SHOTS + "/sockets.png" }); }

  // ---- Debugging ----
  await openLab("debugging");
  await type('trace word_count "  deploy failed "'); ok("DB: trace shows returns 5", /=> returns 5/.test(await termText()));
  await type("echo 'word_count \"  deploy failed \" 2' >> tests/cases.txt");
  ok("DB: reproducer ticks", (await pg.locator("#task-db1.done").count()) === 1);
  await type("git bisect start"); await type("git bisect bad"); await type("git bisect good a1c09e2");
  await type("git bisect run make test");
  ok("DB: bisect run finds the commit", /f13b9d2 is the first bad commit/.test(await termText()));
  await type("echo f13b9d2 > answers/bisect.txt");
  ok("DB: bisect task ticks", (await pg.locator("#task-db2.done").count()) === 1);
  await type("git bisect reset");
  await edit("src/textstats.c", (v) => v.replace(/int word_count[\s\S]*?\n}\n/, "int word_count(const char *s) {\n    int n = 0;\n    int inside = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] == ' ') inside = 0;\n        else if (inside == 0) { inside = 1; n++; }\n    }\n    return n;\n}\n"));
  await type("make test"); ok("DB: tests green", /All tests passed/.test((await lastLines(1))[0]));
  ok("DB: not done until committed", (await pg.locator("#task-db3.done").count()) === 0);
  await type('git commit -am "Fix word_count for repeated spaces (BUG-311)"');
  ok("DB: fix task ticks after commit", (await pg.locator("#task-db3.done").count()) === 1);
  if (process.env.SHOTS) { await pg.screenshot({ path: process.env.SHOTS + "/debugging.png" }); }

  // ---- Ambiguous ticket ----
  await openLab("ticket");
  await type("dashboard"); ok("TK: dashboard slow at start", /page load 7\.0s/.test(await termText()));
  await type("echo 'slow = bug' > answers/triage.txt"); await type("echo 'counts = bug' >> answers/triage.txt"); await type("echo 'tuesday = not-a-bug' >> answers/triage.txt");
  ok("TK: triage ticks", (await pg.locator("#task-tk1.done").count()) === 1);
  await edit("etc/ingest.conf", (v) => v.replace(/^source = logs\/auth\/\*\.log\s+# added by migration.*\n/m, ""));
  ok("TK: dedupe alone isn't enough", (await pg.locator("#task-tk2.done").count()) === 0);
  await type("crontab -e");
  ok("TK: crontab opens editor", await pg.isVisible("#editor"));
  await pg.fill("#edText", "# m h dom mon dow   command\n*/5 * * * * /opt/dash/rebuild.sh\n");
  await pg.press("#edText", "Control+s"); await pg.press("#edText", "Escape"); await pg.waitForTimeout(60);
  await type("dashboard"); ok("TK: page load fixed", /page load 0\.7s/.test((await lastLines(1))[0]), await lastLines(1));
  ok("TK: fix task ticks", (await pg.locator("#task-tk2.done").count()) === 1);
  await edit("answers/reply.md", () => "Hi Priya, thanks for flagging this. The login numbers were double counted: a migration on Oct 7 added the auth log as a source twice, so I removed the duplicate. The slowness came from the same change: the rebuild was scheduled every minute but takes longer than that, so rebuilds piled up; it now runs every 5 minutes. Tuesday's data is all there; the default range is the last 2 days, so use --range 7d. I didn't delete any old data, since it wasn't the cause.");
  ok("TK: reply ticks", (await pg.locator("#task-tk3.done").count()) === 1);
  ok("TK: PR CTA", (await pg.locator("#openPR").count()) === 1);
  if (process.env.SHOTS) { await pg.screenshot({ path: process.env.SHOTS + "/ticket.png" }); }

  // ---- transcript shows new competencies ----
  await pg.click("#back"); await pg.waitForTimeout(60);
  await pg.click(".rail button[data-view=skills]"); await pg.waitForTimeout(120);
  const sk = await pg.locator("#view").textContent();
  ok("Skills: new competencies listed", /Linux internals/.test(sk) && /Secure coding/.test(sk) && /Integrated on-call/.test(sk) && /Network protocols & sockets/.test(sk) && /Debugging & testing/.test(sk) && /Handling ambiguous work/.test(sk));
  if (process.env.SHOTS) { await pg.screenshot({ path: process.env.SHOTS + "/skills.png", fullPage: true }); }
  await pg.click(".rail button[data-view=portal]"); await pg.waitForTimeout(80);

  // ---- curriculum map now shows the new labs ----
  await pg.click(".rail button[data-view=map]"); await pg.waitForTimeout(120);
  ok("map lists all fifteen labs across stages", (await pg.locator(".map-lab").count()) === 15, await pg.locator(".map-lab").count());
  ok("capstone stage is available", /Capstone — First On-Call Night/.test(await pg.locator("#view").textContent()));
  if (process.env.SHOTS) { await pg.screenshot({ path: process.env.SHOTS + "/map.png", fullPage: true }); }
  ok("no page errors", errs.length === 0, errs);
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("RUN ERROR", e.message); process.exit(2); });
