/* Curriculum registry validation + backward compatibility for existing emulator */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const v1 = JSON.parse(fs.readFileSync(path.join(root,'curriculum/catalog.v1.json'),'utf8'));
const v2 = JSON.parse(fs.readFileSync(path.join(root,'curriculum/catalog.v2.json'),'utf8'));
assert.equal(v1.schemaVersion,'1.0');
assert.equal(v2.schemaVersion,'2.0');
assert.ok(v2.modules.length>=21,'Expected previous modules + two real commercial labs');
assert.deepEqual(new Set(v2.tracks.map(t=>t.id)),new Set(['core','commercial','cno']));
const idMap = new Map();
for(const m of v2.modules){
  assert.match(m.id,/^[a-z][a-z0-9-]*$/);
  assert.ok(!idMap.has(m.id), `Duplicate module ${m.id}`);
  idMap.set(m.id,m);
  assert.ok(['browser-simulation','linux-workspace'].includes(m.environment), m.id);
  assert.ok(['core','commercial','cno'].includes(m.track), m.id);
  assert.ok(['guided-practice','practice-tests','draft'].includes(m.assessment),m.id);
  assert.ok(['available','planned'].includes(m.status),m.id);
  assert.ok(Array.isArray(m.competencies)&&m.competencies.length>0,m.id);
  assert.ok(Array.isArray(m.prerequisites),m.id);
  assert.ok(m.estimatedHours>0,m.id);
  assert.equal(m.evidence,'self-reported-practice',m.id);
  assert.ok(m.publicRoute && !m.publicRoute.startsWith('/'),m.id);
  assert.ok(fs.existsSync(path.resolve(root,m.publicRoute.split('#')[0])),`Bad public route ${m.id}`);
  if(m.path) {
    assert.ok(!m.path.startsWith('/')&&!m.path.includes('..'),`Unsafe path ${m.path}`);
    assert.ok(fs.existsSync(path.join(root,m.path,'README.md')),`Missing lab ${m.path}`);
  }
}
for(const m of v2.modules){
  for(const prerequisite of m.prerequisites){
    assert.ok(idMap.has(prerequisite),`Missing prerequisite ${prerequisite} for ${m.id}`);
    assert.notEqual(prerequisite,m.id,`Self prerequisite ${m.id}`);
  }
}
const visiting=new Set(),visited=new Set();
function walk(id){
  if(visited.has(id))return;
  assert.ok(!visiting.has(id),`Prerequisite cycle ${id}`);
  visiting.add(id);
  for(const other of idMap.get(id).prerequisites)walk(other);
  visiting.delete(id);visited.add(id);
}
for(const id of idMap.keys())walk(id);
for(const legacy of v1.modules){
  const present=idMap.get(legacy.id);
  assert.ok(present,`Stage 1 module removed: ${legacy.id}`);
  assert.equal(legacy.environment,present.environment,`Stage 1 environment modified: ${legacy.id}`);
  assert.equal(legacy.path,present.path,`Stage 1 path moved: ${legacy.id}`);
}
const source=fs.readFileSync(path.join(root,'app/src/app.template.html'),'utf8');
const simIds=[...source.matchAll(/\{\s*id:"([a-z0-9-]+)",\s*name:/g)].map(m=>m[1]);
assert.equal(simIds.length,15);
assert.deepEqual(new Set(v2.modules.filter(m=>m.environment==='browser-simulation').map(m=>m.id)),new Set(simIds));
assert.equal(v2.modules.filter(m=>m.track==='commercial'&&m.status==='available').length,3);
assert.equal(v2.modules.filter(m=>m.track==='cno').length,0,'Do not pretend advanced CNO labs exist');
console.log(`PASS schema v2: ${v2.tracks.length} tracks, ${v2.modules.length} modules, 15 retained browser simulations, 3 commercial modules (2 original labs + residency), DAG valid`);
