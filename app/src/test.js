const { createShell } = require("./engine.js");
let pass = 0, fail = 0;
function eq(label, got, want) {
  if (got === want) { console.log("PASS", label); pass++; }
  else { console.log("FAIL", label, "\n  got:  " + JSON.stringify(got) + "\n  want: " + JSON.stringify(want)); fail++; }
}

let sh = createShell();
// Task 1
eq("T1 intended", sh.run("grep -h -w ERROR scenario/logs/*.log | grep -i -c timeout").out, "8");
eq("T1 variant single-file count", sh.run("grep ERROR scenario/logs/app.log | grep -c timeout").out, "6");
// Task 2
eq("T2 intended", sh.run("grep -w ERROR scenario/logs/app.log | grep -oE 'code=E[0-9]+' | sed 's/code=//' | sort | uniq -c | sort -rn | head -3 | awk '{print $2, $1}'").out, "E500 6\nE408 5\nE404 4");
eq("T2 cut variant", sh.run("grep -oE 'code=E[0-9]+' scenario/logs/app.log | cut -d= -f2 | sort | uniq -c | sort -rn | head -3 | awk '{print $2, $1}'").out, "E500 6\nE408 5\nE404 4");
// Task 3
eq("T3 intended", sh.run("jq -r '.services[] | select(.state == \"degraded\") | .name' scenario/service/status.json | sort").out, "auth\ncache\nmetrics\nstorage");
eq("T3 via cat pipe", sh.run("cat scenario/service/status.json | jq -r '.services[] | select(.state==\"degraded\") | .name' | sort").out, "auth\ncache\nmetrics\nstorage");
// Task 4
sh.run("chmod 600 scenario/secrets/service.key");
eq("T4 mode", sh.fileMode("scenario/secrets/service.key"), "600");
eq("T4 ls -l shows rw-------", sh.run("ls -l scenario/secrets/service.key").out.startsWith("-rw-------"), true);
// redirection round-trip
sh.run("grep -h -w ERROR scenario/logs/*.log | grep -i -c timeout > answers/01.txt");
eq("redirect writes file", sh.fileContent("answers/01.txt"), "8\n");
// basic nav
eq("pwd", sh.run("pwd").out, "/home/sam/lab");
eq("ls scenario", sh.run("ls scenario").out.split("  ").sort().join(","), "logs,secrets,service");
eq("cat head", sh.run("cat scenario/logs/app.log | head -1").out, "2026-10-02T08:14:03Z INFO  app started pid=4120 version=1.8.2");
eq("unknown cmd", sh.run("frobnicate x").err, "frobnicate: command not found");
// reset works
sh.reset();
eq("reset restores key mode", sh.fileMode("scenario/secrets/service.key"), "644");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
