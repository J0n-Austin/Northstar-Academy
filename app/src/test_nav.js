const { createShell } = require("./engine.js");
const { installModule01 } = require("./engine2.js");
let pass = 0, fail = 0;
const eq = (l, g, w) => { if (g === w) { console.log("PASS", l); pass++; } else { console.log("FAIL", l, "\n  got: ", JSON.stringify(g), "\n  want:", JSON.stringify(w)); fail++; } };

const sh = createShell();
eq("root ls shows answers and scenario", sh.run("ls").out, "answers  scenario");
eq("root ls marks answers+scenario as dirs", JSON.stringify(sh.run("ls").dirs), '["answers","scenario"]');
eq("prompt at root", sh.promptPath(), "~/lab");

sh.run("cd scenario");
eq("prompt follows cd", sh.promptPath(), "~/lab/scenario");
eq("ls after cd lists the new directory", sh.run("ls").out, "logs  secrets  service");
sh.run("cd logs");
eq("nested prompt", sh.promptPath(), "~/lab/scenario/logs");
eq("ls in nested dir", sh.run("ls").out, "app.log  auth.log  worker.log");
eq("relative file read after cd", sh.run("head -1 auth.log").out, "2026-10-02T08:14:04Z INFO  auth service ready provider=local");
sh.run("cd ../..");
eq("cd ../.. back to root", sh.promptPath(), "~/lab");

eq("cd ~/scenario", sh.run("cd ~/scenario").code, 0);
eq("  -> prompt", sh.promptPath(), "~/lab/scenario");
eq("cd ~ returns home", (sh.run("cd ~"), sh.promptPath()), "~/lab");
eq("cd to the pwd-style absolute path", sh.run("cd /home/sam/lab/scenario/secrets").code, 0);
eq("  -> pwd agrees", sh.run("pwd").out, "/home/sam/lab/scenario/secrets");
eq("cd with no args goes home", (sh.run("cd"), sh.promptPath()), "~/lab");
eq("cd into answers/ before writing anything", sh.run("cd answers").code, 0);
eq("  empty dir lists nothing", sh.run("ls").out, "");
sh.run("cd ~");
eq("cd into a file fails", sh.run("cd scenario/logs/app.log").code, 1);
eq("cd to missing dir fails", sh.run("cd nope").err, "cd: nope: No such file or directory");

eq("mkdir creates a listable dir", (sh.run("mkdir notes"), sh.run("ls").out), "answers  notes  scenario");
eq("mkdir nested without -p fails", sh.run("mkdir a/b").code, 1);
eq("mkdir -p nested works", (sh.run("mkdir -p a/b"), sh.run("ls a").out), "b");
eq("touch makes a file", (sh.run("touch notes/todo.txt"), sh.run("ls notes").out), "todo.txt");
eq("cp into a dir", (sh.run("cp scenario/service/status.json notes"), sh.run("ls notes").out), "status.json  todo.txt");
eq("mv renames", (sh.run("mv notes/todo.txt notes/plan.txt"), sh.run("ls notes").out), "plan.txt  status.json");
eq("rm a file", (sh.run("rm notes/plan.txt"), sh.run("ls notes").out), "status.json");
eq("rm a dir without -r fails", sh.run("rm notes").code, 1);
eq("rm -r removes the dir", (sh.run("rm -r notes"), sh.run("ls").out), "a  answers  scenario");

eq("ls -F marks dirs with /", sh.run("ls -F").out, "a/  answers/  scenario/");
eq("ls missing path errors", sh.run("ls nope").code, 2);
eq("ls -l on dir entries shows d bit", sh.run("ls -l scenario").out.split("\n")[0].slice(0, 1), "d");

eq("redirect into missing dir fails", sh.run("echo hi > missing/x.txt").code, 1);
eq("redirect from a subdirectory lands relative to cwd", (sh.run("cd answers"), sh.run("echo 8 > 01.txt"), sh.fileContent("answers/01.txt")), "8\n");
sh.run("cd ~");
eq("redirect keeps file mode", (sh.run("chmod 600 scenario/secrets/service.key"), sh.run("echo x >> scenario/secrets/service.key"), sh.fileMode("scenario/secrets/service.key")), "600");

// globs and recursive grep from a subdirectory
sh.reset(); sh.run("cd answers");
eq("glob with ../ prefix from a subdir", sh.run("grep -h -w ERROR ../scenario/logs/*.log | grep -i -c timeout").out, "8");
eq("glob keeps the typed prefix in grep output", sh.run("grep -c ERROR ../scenario/logs/*.log").out.split("\n")[0], "../scenario/logs/app.log:20");
eq("cat with a glob from a subdir", sh.run("cat ../scenario/logs/*.log | grep -c INFO").out, "24");
sh.run("cd ~");
eq("grep -r shows paths relative to what was typed", sh.run("grep -r version scenario").out.split(":")[0], "scenario/logs/app.log");
sh.run("cd scenario");
eq("grep -r . from a subdir", sh.run("grep -r -c degraded .").out.split("\n").find((l) => l.startsWith("service/")), "service/status.json:4");
eq("grep on a missing file reports it", sh.run("grep x nope.txt").err, "grep: nope.txt: No such file or directory");
sh.run("cd ~");

// tab completion
sh.reset();
eq("complete command", sh.complete("gre").line, "grep ");
eq("complete path segment", sh.complete("cat sce").line, "cat scenario/");
eq("complete nested", sh.complete("cat scenario/logs/ap").line, "cat scenario/logs/app.log ");
eq("ambiguous lists matches", JSON.stringify(sh.complete("cat scenario/logs/").matches), '["app.log","auth.log","worker.log"]');
eq("common prefix on ambiguity", sh.complete("cat scenario/logs/a").line, "cat scenario/logs/a");
eq("complete after a pipe", sh.complete("cat x | so").line, "cat x | sort ");
sh.run("cd scenario");
eq("complete relative to cwd", sh.complete("ls se").line, "ls se");
eq("  matches secrets and service", JSON.stringify(sh.complete("ls se").matches), '["secrets/","service/"]');

// reset restores dirs and cwd
sh.run("mkdir ~/scratch");
sh.reset();
eq("reset returns to root", sh.promptPath(), "~/lab");
eq("reset removes learner dirs but keeps answers", sh.run("ls").out, "answers  scenario");

// module packs keep working with directories
const tri = createShell(); installModule01(tri);
eq("triage root listing", tri.run("ls").out, "answers  etc  scenario  var");
tri.run("cd etc");
eq("triage ls etc", tri.run("ls").out, "telemetryd.conf  telemetryd.d  telemetryd.key");
eq("telemetryd from a subdir reads the real config (interval error, not missing endpoint)",
   /E_CONF_INTERVAL/.test(tri.run("telemetryd --check").err), true);
tri.run("sed -i 's/interval  = 0/interval  = 15/' telemetryd.conf");
tri.run("chmod 600 telemetryd.key");
eq("fixing from inside etc/ makes it healthy", tri.run("telemetryd --check").code, 0);
eq("learner edits made relative to cwd land in the right file", /interval  = 15/.test(tri.fileContent("etc/telemetryd.conf")), true);
tri.run("rm telemetryd.d/90-local.conf");
eq("stress healthy after removing override from etc/", tri.run("telemetryd --stress").code, 0);

const { installNetworking } = require("./engine3.js");
const net = createShell(); installNetworking(net);
net.run("cd etc");
eq("gateway from a subdir sees the DNS bug", /E_DNS/.test(net.run("gateway --check").err), true);
net.run("sed -i 's/10.0.3.99/10.0.3.12/' hosts");
net.run("sed -i 's/upstream_port = 8080/upstream_port = 8443/' gateway.conf");
eq("gateway healthy after fixes made from etc/", net.run("gateway --check").code, 0);
eq("checker sees answer written from a subdir", (net.run("cd ~/answers"), net.run("echo resolved_ip = 10.0.3.99 > net1.txt"), /10\.0\.3\.99/.test(net.fileContent("answers/net1.txt"))), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
