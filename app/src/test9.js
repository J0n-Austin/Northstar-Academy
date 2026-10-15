const { createShell } = require("./engine.js");
const { installLinux } = require("./engine9.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };

const sh = createShell(); installLinux(sh);
ok("ps lists telemetryd", /telemetryd/.test(sh.run("ps").out));
ok("ps shows the suspicious /tmp/.cache/httpd", /\/tmp\/\.cache\/httpd/.test(sh.run("ps").out) && /3177/.test(sh.run("ps").out));
ok("lsof 3177 reveals a deleted binary", /\(deleted\)/.test(sh.run("lsof 3177").out));
ok("lsof 3177 shows an outbound connection", /ESTABLISHED/.test(sh.run("lsof 3177").out));
ok("lsof 902 shows the telemetry key", /agent\.key/.test(sh.run("lsof 902").out));
ok("lsof 902 shows its listening socket", /0\.0\.0\.0:9443/.test(sh.run("lsof 902").out));
ok("mounts shows /tmp as nosuid,nodev", /\/tmp.*nosuid,nodev/.test(sh.run("mounts").out));
ok("lsof on unknown pid errors", sh.run("lsof 9999").code === 1);

// the lab answers derive from the tools
sh.run("echo pid=3177 > answers/l1.txt");
ok("answer: suspicious pid is 3177", /3177/.test(sh.fileContent("answers/l1.txt")));
ok("model exposes the deleted-binary fd", sh.linuxModel().fds[3177].some(function (f) { return /deleted/.test(f.target); }));

ok("ps shows zombie STAT Z", /2240\s+2201\s+Z/.test(sh.run("ps").out));
ok("procstat 2241 reports zombie with PPid 2201", /zombie/.test(sh.run("procstat 2241").out) && /PPid:\t2201/.test(sh.run("procstat 2241").out));
ok("df shows /var at 97%", /97%\s+\/var/.test(sh.run("df").out));
ok("du /var/log doesn't account for the space", !/17\.9G/.test(sh.run("du /var/log").out));
ok("lsof 902 reveals the deleted 17.9G log", /telemetryd\.log\.1 \(deleted\)\s+\[17\.9G\]/.test(sh.run("lsof 902").out));
sh.reset();
ok("reset keeps ps working", /init/.test(sh.run("ps").out));
ok("reset clears answers", sh.fileContent("answers/l1.txt") === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
