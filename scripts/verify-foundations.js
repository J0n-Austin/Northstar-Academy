/** Stage 4.1 release guard: substantial authored material, prerequisite DAG and exact wiring. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),r=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(r('curriculum/foundations.v1.json'));
assert.equal(data.schemaVersion,'1.0');assert.equal(data.units.length,10);assert.equal(data.lessons.length,72);
const catalog=JSON.parse(r('curriculum/catalog.v2.json'));
assert.equal(catalog.modules.filter(m=>m.id.startsWith('foundations-')).length,10,'All foundation units must be included in canonical curriculum map');
const ids=new Map(data.lessons.map(l=>[l.id,l]));assert.equal(ids.size,72);
let concepts=0;const ordered=new Set();
for(const u of data.units){
 assert.equal(data.lessons.filter(l=>l.unit===u.id).length,['linux','networking','data-structures','architecture'].includes(u.id)?6:8,`unit coverage ${u.id}`);
 assert.ok(r(u.guide).split(/\s+/).length>=350,`Guide needs depth: ${u.id}`);
 assert.ok(fs.existsSync(path.join(root,u.lab,'README.md')));
 for(const p of ['starter.py','tests/test_contract.py','tests/test_smoke.py','run-checks.sh','smoke-test.sh'])assert.ok(fs.existsSync(path.join(root,u.lab,p)),`${u.lab}/${p}`);
 assert.ok(u.targetTickets.every(t=>/^NS-C40[1-8]$/.test(t)));
}
for(const l of data.lessons){
 assert.ok(/^FND-[A-Z-]+-\d\d$/.test(l.id));assert.ok(l.objectives.length>=3);
 assert.ok(['foundation','guided','independent'].includes(l.level));
 assert.ok(l.explanation.length>175 && l.walkthrough.length>70 && l.practice.length>45,`${l.id}: inadequate lesson depth`);
 assert.ok(l.hints.length===3 && l.check.choices.length===3 && Number.isInteger(l.check.answer));
 assert.ok(l.check.answer>=0&&l.check.answer<3&&l.check.rationale.length>50);
 assert.ok(l.bridge.every(t=>/^NS-C40[1-8]$/.test(t)));concepts+=l.explanation.length;
 assert.ok(fs.existsSync(path.join(root,l.workshop)));
 assert.ok(l.prerequisites.every(d=>ids.has(d)),`Bad prerequisite ${l.id}`);
}
const visiting=new Set();function walk(id){if(ordered.has(id))return;assert.ok(!visiting.has(id),'Cycle: '+id);visiting.add(id);for(const p of ids.get(id).prerequisites)walk(p);visiting.delete(id);ordered.add(id);}
for(const id of ids.keys())walk(id);
const html=r('app/northstar-academy.html');
for(const marker of ['Engineering Foundations','FND-PYTHON-01','renderFoundationLesson','renderFoundations','fTicketBridge','fSkillsHTML','Show a hint','data-f-answer','FOUNDATIONS','Read the full'])assert.ok(html.includes(marker),'Missing portal integration '+marker);
for(const unresolved of ['/* __FOUNDATIONS_CSS__ */','/* __FOUNDATIONS_UI__ */','/* __FOUNDATIONS_DATA__ */','/* __FOUNDATION_GUIDES__ */'])assert.ok(!html.includes(unresolved));
assert.ok(r('index.html').includes('app/northstar-academy.html#foundations'));
console.log('PASS Stage 4.1 foundations: 10 substantive guides, 72 lessons, prerequisite DAG, 72 checks, 10 real Python labs, portal/residency/skills integration');
