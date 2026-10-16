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
const advanced = JSON.parse(fs.readFileSync(path.join(dir, '..', '..', 'curriculum', 'banking.v2.json'), 'utf8'));
const advancedUI = fs.readFileSync(path.join(dir, 'advanced-ui.js'), 'utf8');
const residency = JSON.parse(fs.readFileSync(path.join(dir, "..", "..", "curriculum", "banking.residency.json"), "utf8"));
const lessons = ["01-service-foundations.md","02-apis-and-appsec.md","03-transaction-design.md","04-testing-and-release.md"].map(f=>fs.readFileSync(path.join(dir, "..", "..", "labs", "banking-residency", "guides", f), "utf8"));
const foundations = JSON.parse(fs.readFileSync(path.join(dir, "..", "..", "curriculum", "foundations.v1.json"), "utf8"));
const foundationGuides = foundations.units.map(u => fs.readFileSync(path.join(dir, "..", "..", u.guide), "utf8"));
const foundationUI = fs.readFileSync(path.join(dir, "foundations-ui.js"), "utf8");
const foundationCSS = fs.readFileSync(path.join(dir, "foundations.css"), "utf8");
const residencyUI = fs.readFileSync(path.join(dir, "residency-ui.js"), "utf8");
const practice = JSON.parse(fs.readFileSync(path.join(dir, "..", "..", "curriculum", "commercial.practice.json"), "utf8"));
const packed = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, " ");
if (!tpl.includes("/* __CURRICULUM__ */") || !tpl.includes("/* __COMMERCIAL_PRACTICE__ */") || !tpl.includes("/* __RESIDENCY_DATA__ */") || !tpl.includes("/* __RESIDENCY_UI__ */") || !tpl.includes("/* __RESIDENCY_LESSONS__ */")) throw new Error("Missing catalog injection markers");
const html = tpl.replace("/* __FOUNDATIONS_CSS__ */", () => foundationCSS).replace("// __ENGINE__", () => packs.map(strip).join("\n"))
  .replace("/* __CURRICULUM__ */", packed(curriculum))
  .replace("/* __COMMERCIAL_PRACTICE__ */", packed(practice))
  .replace("/* __RESIDENCY_DATA__ */", packed(residency))
  .replace("/* __RESIDENCY_LESSONS__ */", packed(lessons))
  .replace("/* __RESIDENCY_UI__ */", () => residencyUI)
  .replace("/* __FOUNDATIONS_UI__ */", () => foundationUI)
  .replace("/* __ADVANCED_UI__ */", () => advancedUI).replace("/* __ADVANCED_DATA__ */", packed(advanced))
  .replace("/* __FOUNDATIONS_DATA__ */", packed(foundations))
  .replace("/* __FOUNDATION_GUIDES__ */", packed(foundationGuides));
fs.writeFileSync(out, html);
let bad = 0;
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
  try { new vm.Script(m[1]); } catch (e) { console.error(`script block ${i}: ${e.message}`); bad++; }
});
console.log(`built ${out} (${html.length} bytes) from ${packs.join(", ")}${bad ? "" : " — all scripts parse"}`);
process.exit(bad ? 1 : 0);
