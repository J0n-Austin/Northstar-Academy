/** Stage 3 portal integration release gate: one catalog, two real commercial assignments, legacy pack safety. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const get=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const catalog=JSON.parse(get('curriculum/catalog.v2.json'));
const practice=JSON.parse(get('curriculum/commercial.practice.json'));
const residency=JSON.parse(get('curriculum/banking.residency.json'));
const app=get('app/northstar-academy.html');
const template=get('app/src/app.template.html');
const home=get('index.html');
assert.equal(practice.schemaVersion,'1.0');
assert.equal(practice.modules.length,2);
const commercial=catalog.modules.filter(m=>m.track==='commercial'&&m.status==='available');
assert.equal(commercial.length,4);
assert.deepEqual(new Set(practice.modules.map(m=>m.id)),new Set(commercial.filter(m=>m.id!=='banking-residency'&&m.id!=='banking-platform-v2').map(m=>m.id)));
for(const d of practice.modules){
 const m=commercial.find(x=>x.id===d.id);
 assert.ok(m.path && fs.existsSync(path.join(root,m.path,'README.md')),`Missing real lab ${d.id}`);
 assert.ok(d.sprint && d.role && d.context && d.acceptance && d.environmentNote);
 assert.ok(d.terminal.length>=2 && d.tasks.length>=4);
 assert.ok(d.evidence.length>=3 && d.checks.length>=2);
 for(const q of d.checks){
  assert.ok(q.choices.some(c=>c.value===q.answer),`Unanswerable check ${q.id}`);
  assert.ok(q.explanation);
 }
}
assert.equal([...template.matchAll(/\{\s*id:"[a-z0-9-]+",\s*name:/g)].length,15,'Old browser labs modified or removed');
assert.ok(!app.includes('/* __CURRICULUM__ */')&&!app.includes('/* __COMMERCIAL_PRACTICE__ */'),'Unresolved bundle placeholders');
assert.ok(app.includes(JSON.stringify(catalog).slice(0,60)),'Portal not built from canonical curriculum data');
assert.ok(app.includes(JSON.stringify(residency).slice(0,60)),'Portal not built from residency data');
assert.ok(app.includes(JSON.stringify(practice).slice(0,60)),'Portal not built from commercial assignments');
for(const marker of ['Earlier commercial practice labs','Architecture & security reasoning','id="practice-count"','id="workspace-count"','data-view="commercial"','Curriculum & pathways','Practice & competency evidence','Banking Engineering Residency','Run practice review','Independently verified'])
 assert.ok(app.includes(marker),`Missing unified portal feature: ${marker}`);
assert.ok(home.includes('app/northstar-academy.html#commercial'),'Homepage does not route to unified commercial portal');
assert.ok(home.includes('app/northstar-academy.html#curriculum'),'Homepage does not route to unified course map');
const scripts=[...app.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.ok(scripts.length>=2);
for(const [i,src] of scripts.entries())new vm.Script(src,{filename:`academy-script-${i}`});
assert.ok(get('app/src/build.js').includes('commercial.practice.json'));
assert.ok(!get('scripts/build-site.js').includes('curriculum/commercial.practice.json'),'Public raw question registry should be embedded in app, not separately served');
console.log(`PASS integrated learner portal: 15 legacy browser labs + ${commercial.length} commercial modules + ${practice.modules.reduce((n,m)=>n+m.checks.length,0)} browser reasoning checks; canonical registry embedded`);
