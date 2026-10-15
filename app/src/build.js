// Build the single-file app: inject every engine pack into the template,
// then syntax-check each <script> block. Usage: node build.js [outPath]
const fs = require("fs"), path = require("path"), vm = require("vm");
const dir = __dirname;
const out = process.argv[2] || path.join(dir, "..", "northstar-academy.html");
// cinterp.js (the C interpreter) must load before engine5.js, which uses it.
const packs = ["engine.js", "engine2.js", "engine3.js", "engine4.js", "cinterp.js", "engine5.js", "engine6.js", "engine7.js", "engine8.js", "engine9.js", "engine10.js", "engine11.js", "engine12.js", "engine13.js", "engine14.js", "engine15.js"]
  .filter((f) => fs.existsSync(path.join(dir, f)));
const strip = (f) => fs.readFileSync(path.join(dir, f), "utf8").replace(/if \(typeof module[^\n]*\n/, "");
const tpl = fs.readFileSync(path.join(dir, "app.template.html"), "utf8");
if (!tpl.includes("// __ENGINE__")) { console.error("template is missing the // __ENGINE__ marker"); process.exit(1); }
const curriculum = JSON.parse(fs.readFileSync(path.join(dir, "..", "..", "curriculum", "catalog.v2.json"), "utf8"));
const practice = JSON.parse(fs.readFileSync(path.join(dir, "..", "..", "curriculum", "commercial.practice.json"), "utf8"));
const packed = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, " ");
if (!tpl.includes("/* __CURRICULUM__ */") || !tpl.includes("/* __COMMERCIAL_PRACTICE__ */")) throw new Error("Missing catalog injection markers");
const html = tpl.replace("// __ENGINE__", () => packs.map(strip).join("\n"))
  .replace("/* __CURRICULUM__ */", packed(curriculum))
  .replace("/* __COMMERCIAL_PRACTICE__ */", packed(practice));
fs.writeFileSync(out, html);
let bad = 0;
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
  try { new vm.Script(m[1]); } catch (e) { console.error(`script block ${i}: ${e.message}`); bad++; }
});
console.log(`built ${out} (${html.length} bytes) from ${packs.join(", ")}${bad ? "" : " — all scripts parse"}`);
process.exit(bad ? 1 : 0);
