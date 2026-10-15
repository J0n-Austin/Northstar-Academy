const { createShell } = require("./engine.js");
const { installModule01 } = require("./engine2.js");
let pass = 0, fail = 0;
const eq = (l, g, w) => { if (g === w) { console.log("PASS", l); pass++; } else { console.log("FAIL", l, "\n  got: ", JSON.stringify(g), "\n  want:", JSON.stringify(w)); fail++; } };

const sh = createShell(); installModule01(sh);
let r = sh.run("edit etc/telemetryd.conf");
eq("edit returns an open request", !!r.open, true);
eq("open carries the root path", r.open.path, "etc/telemetryd.conf");
eq("open carries current content", /interval  = 0/.test(r.open.content), true);
eq("existing file is not new", r.open.isNew, false);

// save an edited version, as the UI would
eq("writeFile succeeds", sh.writeFile(r.open.path, r.open.content.replace("interval  = 0", "interval  = 15")), true);
eq("saved content is what the service reads", /interval  = 15/.test(sh.fileContent("etc/telemetryd.conf")), true);
sh.run("chmod 600 etc/telemetryd.key");
eq("service healthy after an editor fix", sh.run("telemetryd --check").code, 0);

// relative paths from a subdir, and mode preserved on save
sh.run("cd etc");
r = sh.run("nano telemetryd.key");
eq("nano alias opens with a root path from a subdir", r.open && r.open.path, "etc/telemetryd.key");
sh.writeFile(r.open.path, r.open.content + "# rotated\n");
eq("save keeps the file's mode", sh.fileMode("etc/telemetryd.key"), "600");
eq("vim alias works too", !!sh.run("vim telemetryd.conf").open, true);

// new files and errors
r = sh.run("edit notes.md");
eq("new file opens empty", r.open.content, "");
eq("new file flagged", r.open.isNew, true);
sh.writeFile(r.open.path, "hello\n");
eq("new file created on save", sh.fileContent("etc/notes.md"), "hello\n");
eq("edit a directory errors", sh.run("edit telemetryd.d").code, 1);
eq("edit in a missing dir errors", sh.run("edit nope/x.txt").code, 1);
eq("edit with no file errors", sh.run("edit").code, 1);
eq("edit inside a pipe does not open", sh.run("echo hi | edit x").open, undefined);
eq("writeFile into a missing dir refuses", sh.writeFile("nope/x.txt", "x"), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
