const { createShell } = require("./engine.js");
const { installWindows } = require("./engine6.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };
const eq = (l, g, w) => { if (g === w) { console.log("PASS", l); pass++; } else { console.log("FAIL", l, "\n  got: ", JSON.stringify(g), "\n  want:", JSON.stringify(w)); fail++; } };

const sh = createShell(); installWindows(sh);

// tools produce consistent, inspectable data
ok("tasklist lists telemetryd", /telemetryd\.exe/.test(sh.run("tasklist").out));
ok("tasklist shows the odd cmd.exe under spoolsv (ppid 980)", /4820\s+980\s+.*cmd\.exe/.test(sh.run("tasklist").out));
ok("handle 1120 shows the agent key", /agent\.key/.test(sh.run("handle 1120").out));
ok("handle 4820 also holds telemetry.db", /telemetry\.db/.test(sh.run("handle 4820").out));
ok("pe telemetryd.exe reports CUI subsystem", /Windows CUI/.test(sh.run("pe telemetryd.exe").out));
ok("pe reports WS2_32 import", /WS2_32\.dll/.test(sh.run("pe telemetryd.exe").out));
ok("token 4820 has SeDebugPrivilege", /SeDebugPrivilege/.test(sh.run("token 4820").out));
eq("handle on unknown pid errors", sh.run("handle 9999").code, 1);
eq("pe on unknown file errors", sh.run("pe nope.exe").code, 1);

// the three lab answers can be derived from the tools and written to files
// W1: the suspicious process is cmd.exe (4820), parented by a service (spoolsv 980), not explorer
sh.run("echo pid=4820 > answers/w1.txt");
ok("W1 answer written", /4820/.test(sh.fileContent("answers/w1.txt")));
// W2: telemetryd.exe subsystem + a count of sections
ok("W2 can read section count (5)", sh.run("pe telemetryd.exe").out.match(/sections:\s+(.*)/)[1].trim().split(/\s+/).length === 5);
// W3: which other process shares a handle to telemetry.db -> 4820
ok("W3: telemetry.db held by both 1120 and 4820",
   /telemetry\.db/.test(sh.run("handle 1120").out) && /telemetry\.db/.test(sh.run("handle 4820").out));

// reset keeps the range intact (static data)
sh.reset();
ok("reset keeps tasklist working", /telemetryd\.exe/.test(sh.run("tasklist").out));
ok("reset clears learner answers", sh.fileContent("answers/w1.txt") === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
