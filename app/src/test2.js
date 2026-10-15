const { createShell } = require("./engine.js");
const { installModule01 } = require("./engine2.js");
let pass = 0, fail = 0;
function eq(label, got, want) {
  if (got === want) { console.log("PASS", label); pass++; }
  else { console.log("FAIL", label, "\n  got:  " + JSON.stringify(got) + "\n  want: " + JSON.stringify(want)); fail++; }
}
function truthy(label, got) { if (got) { console.log("PASS", label); pass++; } else { console.log("FAIL", label, "-> got", JSON.stringify(got)); fail++; } }

const sh = createShell();
installModule01(sh);

// base lab still works after extension
eq("base lab T1 still works", sh.run("grep -h -w ERROR scenario/logs/*.log | grep -i -c timeout").out, "8");

// Unit 1: read the system
eq("U1 failed_starts count", sh.run("grep -c 'start failed' var/log/telemetryd.log").out, "4");
eq("U1 latest error code", sh.run("grep ERROR var/log/telemetryd.log | tail -1 | grep -oE 'E_[A-Z_]+'").out, "E_PERM");

// starting state: --check fails on interval
truthy("U2 check fails at start", sh.run("telemetryd --check").code === 1 && /E_CONF_INTERVAL/.test(sh.run("telemetryd --check").err));

// Unit 2: fix interval + perms
sh.run("sed 's/interval  = 0/interval  = 15/' etc/telemetryd.conf > etc/telemetryd.conf.tmp");
// simpler: learners edit via a helper; emulate the edit directly through chmod + a conf rewrite path.
// We emulate editing by writing a corrected conf.
sh.run("echo 'endpoint  = https://telemetry.northstar.internal/v1/ingest' > etc/telemetryd.conf");
sh.run("echo 'interval  = 15' >> etc/telemetryd.conf");
sh.run("echo 'key_file  = etc/telemetryd.key' >> etc/telemetryd.conf");
sh.run("echo 'max_batch = 250' >> etc/telemetryd.conf");
sh.run("chmod 600 etc/telemetryd.key");
truthy("U2 check healthy after fixes", sh.run("telemetryd --check").code === 0 && /healthy/.test(sh.run("telemetryd --check").out));

// Unit 3: stress still fails due to override
truthy("U3 stress fails on override", sh.run("telemetryd --stress").code === 1 && /E_LOAD/.test(sh.run("telemetryd --stress").err));
eq("U3 find the override", sh.run("grep -r max_batch etc | grep 100000").out.includes("90-local.conf"), true);
sh.run("rm etc/telemetryd.d/90-local.conf");
truthy("U3 stress healthy after removing override", sh.run("telemetryd --stress").code === 0 && /healthy/.test(sh.run("telemetryd --stress").out));

// reset restores broken state
sh.run("reset" === "reset" ? "echo noop" : "");
sh.reset();
truthy("reset: check fails again", sh.run("telemetryd --check").code === 1);
truthy("reset: key back to 644", sh.fileMode("etc/telemetryd.key") === "644");
truthy("reset: override restored", sh.fileContent("etc/telemetryd.d/90-local.conf") !== null);
eq("reset: base lab intact", sh.fileMode("scenario/secrets/service.key"), "644");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
