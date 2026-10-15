const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'curriculum/catalog.v1.json'),'utf8'));
assert.equal(manifest.schemaVersion,'1.0');
assert.ok(Array.isArray(manifest.modules) && manifest.modules.length >= 19);
const ids = new Set();
const paths = new Set();
for (const m of manifest.modules) {
  assert.ok(/^[a-z][a-z0-9-]*$/.test(m.id),`Bad module ID ${m.id}`);
  assert.ok(!ids.has(m.id),`Duplicate module ${m.id}`);
  ids.add(m.id);
  assert.ok(['browser-simulation','linux-workspace'].includes(m.environment),m.id);
  assert.ok(['core','commercial','cno'].includes(m.track),m.id);
  assert.ok(['guided-practice','practice-tests','draft'].includes(m.assessment),m.id);
  assert.ok(Array.isArray(m.competencies) && m.competencies.length > 0,m.id);
  if (m.path) {
    assert.ok(!paths.has(m.path),`Duplicate path ${m.path}`);
    paths.add(m.path);
    assert.ok(fs.existsSync(path.resolve(root,m.path)),`Missing module path ${m.path}`);
  }
}
const html = fs.readFileSync(path.join(root,'app/src/app.template.html'),'utf8');
const simIds = [...html.matchAll(/\{\s*id:"([a-z0-9-]+)",\s*name:/g)].map(m=>m[1]);
const manifestSim = manifest.modules.filter(m=>m.environment==='browser-simulation').map(m=>m.id);
assert.equal(simIds.length,15,'Expected original fifteen browser labs');
assert.deepEqual(new Set(manifestSim),new Set(simIds),'Catalog must describe all currently-playable simulator labs');
console.log(`PASS curriculum metadata: ${manifestSim.length} simulated, ${manifest.modules.length-manifestSim.length} real workspace labs`);
