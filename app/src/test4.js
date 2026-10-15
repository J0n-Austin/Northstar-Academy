const { createShell } = require("./engine.js");
const { installAutomation } = require("./engine4.js");
let pass = 0, fail = 0;
const eq = (l, g, w) => { if (g === w) { console.log("PASS", l); pass++; } else { console.log("FAIL", l, "\n  got: ", JSON.stringify(g), "\n  want:", JSON.stringify(w)); fail++; } };
const ok = (l, g) => eq(l, !!g, true);

const sh = createShell(); installAutomation(sh);

// expected summary, computed independently
function expected(path) {
  const c = sh.fileContent(path) || "";
  const lines = c.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
  const errors = lines.filter((l) => /ERROR/.test(l)).length;
  return "lines=" + lines.length + "\nerrors=" + errors;
}

// the intended summary script, written via the editor/redirect
const script = "#!/bin/bash\nf=$1\necho lines=$(wc -l < $f)\necho errors=$(grep -c ERROR $f)\n";
ok("write script with a heredoc-free approach", sh.writeFile("bin/summary.sh", script));

// S1: runs correctly on the dev log AND the audit log (generalizes)
eq("bash summary on service.log", sh.run("bash bin/summary.sh logs/service.log").out, expected("logs/service.log"));
eq("bash summary on audit.log", sh.run("bash bin/summary.sh logs/audit.log").out, expected("logs/audit.log"));

// a hardcoded script passes service.log but FAILS audit.log (cheat-resistance)
sh.writeFile("bin/cheat.sh", "echo lines=10\necho errors=3\n");
eq("hardcoded matches service.log", sh.run("bash bin/cheat.sh logs/service.log").out, expected("logs/service.log"));
ok("hardcoded FAILS on audit.log", sh.run("bash bin/cheat.sh logs/audit.log").out !== expected("logs/audit.log"));

// S2: executable + ./ invocation
eq("not executable yet -> permission denied", sh.run("./bin/summary.sh logs/service.log").code, 126);
sh.run("chmod +x bin/summary.sh");
ok("chmod +x sets an execute bit", (parseInt(sh.fileMode("bin/summary.sh")[0], 10) & 1) === 1);
eq("./ runs the script", sh.run("./bin/summary.sh logs/service.log").out, expected("logs/service.log"));
eq("missing script path errors", sh.run("./bin/nope.sh").code, 127);

// for-loop + command substitution
sh.writeFile("bin/count.sh", "for f in logs/service.log logs/audit.log\ndo\necho $f $(grep -c ERROR $f)\ndone\n");
eq("for-loop over files", sh.run("bash bin/count.sh").out, "logs/service.log 3\nlogs/audit.log 3");

// positional + ${} + $#
sh.writeFile("bin/args.sh", "echo count=$#\necho first=${1}\n");
eq("positional params", sh.run("bash bin/args.sh a b c").out, "count=3\nfirst=a");

// S3: crontab
eq("empty crontab", sh.run("crontab -l").code, 1);
const cronReq = sh.run("crontab -e");
ok("crontab -e opens an editor", !!cronReq.open);
sh.writeFile(cronReq.open.path, "0 2 * * * /home/sam/lab/bin/summary.sh logs/service.log\n");
ok("crontab -l now lists the job", /summary\.sh/.test(sh.run("crontab -l").out));
// a valid 5-field schedule invoking the script
ok("crontab entry has 5 schedule fields + the script", /^\s*\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+.*summary\.sh/m.test(sh.run("crontab -l").out));

// chmod +x via symbolic mode works on the base engine
sh.run("chmod 644 bin/summary.sh");
sh.run("chmod +x bin/summary.sh");
ok("symbolic +x keeps read bits", sh.fileMode("bin/summary.sh") === "755");

// reset clears learner scripts and crontab
sh.reset();
eq("reset removes written scripts", sh.fileContent("bin/summary.sh"), null);
eq("reset clears crontab", sh.run("crontab -l").code, 1);
ok("reset keeps the seeded logs", sh.fileContent("logs/service.log") !== null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
