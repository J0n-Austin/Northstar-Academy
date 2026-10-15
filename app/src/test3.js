const { createShell } = require("./engine.js");
const { installNetworking } = require("./engine3.js");
let pass = 0, fail = 0;
function eq(l, g, w){ if(g===w){console.log("PASS",l);pass++;}else{console.log("FAIL",l,"\n  got:",JSON.stringify(g),"\n  want:",JSON.stringify(w));fail++;} }
function ok(l, g){ if(g){console.log("PASS",l);pass++;}else{console.log("FAIL",l,"-> ",JSON.stringify(g));fail++;} }

const sh = createShell(); installNetworking(sh);

// discovery
ok("dig shows wrong IP at start", sh.run("dig auth.northstar.internal").out.includes("10.0.3.99"));
ok("ss shows real auth addr", sh.run("ss -ltn").out.includes("10.0.3.12:8443"));
eq("grep upstream_port", sh.run("grep upstream_port etc/gateway.conf").out.trim(), "upstream_port = 8080");
ok("curl fails at start (bad dns+port)", sh.run("curl -s https://auth.northstar.internal:8443/health").code !== 0);
ok("gateway --check fails at start", sh.run("gateway --check").code === 1);

// N2: fix DNS
sh.run("sed -i 's/10.0.3.99/10.0.3.12/' etc/hosts");
eq("dig resolves correctly after fix", sh.run("dig +short auth.northstar.internal").out.trim(), "10.0.3.12");
ok("curl still fails (port still wrong)", sh.run("curl -s https://auth.northstar.internal:8443/health").code === 0);
// ^ note: curl to :8443 now works because DNS fixed AND we hit 8443 directly; gateway still uses 8080
ok("gateway still fails (uses wrong port)", sh.run("gateway --check").code === 1);
ok("gateway error names the port", /E_PORT/.test(sh.run("gateway --check").err));

// N3: fix the port
sh.run("sed -i 's/upstream_port = 8080/upstream_port = 8443/' etc/gateway.conf");
ok("gateway healthy after port fix", sh.run("gateway --check").code === 0);
ok("gateway healthy message", /upstream healthy/.test(sh.run("gateway --check").out));

// reset restores both bugs
sh.reset();
ok("reset: dig wrong again", sh.run("dig auth.northstar.internal").out.includes("10.0.3.99"));
ok("reset: gateway fails again", sh.run("gateway --check").code === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
