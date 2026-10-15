const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const site = path.join(root, '_site');
const allowed = new Set([
  '.nojekyll','index.html','mockups/portal.html','mockups/competency-record.html',
  'app/northstar-academy.html','app/northstar-interactive-lab.html','docs/real-labs.html'
]);
function walk(dir, prefix='') {
  const out = [];
  for (const item of fs.readdirSync(dir,{withFileTypes:true})) {
    const rel = path.posix.join(prefix,item.name);
    out.push(...(item.isDirectory() ? walk(path.join(dir,item.name),rel) : [rel]));
  }
  return out;
}
assert.ok(fs.existsSync(site), 'Run npm run build first');
const actual = walk(site);
assert.deepEqual(new Set(actual), allowed, 'Site output differs from deployment allowlist');
for (const rel of actual.filter(n => n.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(site,rel),'utf8');
  // Require HTML's relative local links to resolve within the deploy directory.
  for (const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    const link = m[1];
    if (!link || /^(?:https?:|mailto:|tel:|data:|#|javascript:)/i.test(link)) continue;
    const local = link.split(/[?#]/)[0];
    if (!local || local.startsWith('/')) continue; // an absolute link belongs to hostname root
    const target = path.resolve(site,path.dirname(rel),decodeURI(local));
    assert.ok(target.startsWith(site+path.sep), `Unsafe local link: ${rel} -> ${link}`);
    assert.ok(fs.existsSync(target), `Broken local link: ${rel} -> ${link}`);
  }
}
assert.ok(!actual.some(n => /src\/|instructor|solutions|secret|\.md$/.test(n)));
console.log(`PASS site manifest + local links (${actual.length} staged assets)`);
