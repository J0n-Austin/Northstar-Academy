/* Explicit allowlist: NEVER upload repository instructor/answers, fixtures or source. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const site = path.join(root, '_site');
const files = [
  'index.html',
  'mockups/portal.html',
  'mockups/competency-record.html',
  'app/northstar-academy.html',
  'app/northstar-interactive-lab.html',
  'docs/real-labs.html'
];
fs.rmSync(site, {recursive: true, force: true});
for (const rel of files) {
  const source = path.join(root, rel);
  const dest = path.join(site, rel);
  if (!fs.existsSync(source)) throw new Error(`Site asset missing: ${rel}`);
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  fs.copyFileSync(source, dest);
}
fs.writeFileSync(path.join(site, '.nojekyll'), '');
console.log(`Pages site staged in _site (${files.length} public HTML files, allowlisted)`);
