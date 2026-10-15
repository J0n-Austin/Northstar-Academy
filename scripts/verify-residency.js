/** Regression gate: curriculum data, native training fixtures and Pages integration. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=(x)=>fs.readFileSync(path.join(root,x),'utf8');
const data=JSON.parse(read('curriculum/banking.residency.json'));
assert.equal(data.schemaVersion,'1.0');
assert.equal(data.sprints.length,4);
assert.equal(data.tickets.length,8);
const ids=new Set(data.tickets.map(t=>t.id));
assert.equal(ids.size,8);
for(const t of data.tickets){
 assert.match(t.id,/^NS-C40[1-8]$/);
 assert.ok(data.sprints.some(x=>x.id===t.sprint));
 assert.ok(t.acceptance.length>=3 && t.files.length>=2 && t.commands.length);
 assert.ok(t.learning.length>100 && t.context.length>60);
 assert.ok(t.reviewPrompt && t.hint && t.topics.length>=3);
 assert.ok(t.depends.every(d=>ids.has(d)));
 for(const f of t.files)assert.ok(fs.existsSync(path.join(root,'labs/banking-residency',f)),f);
}
const byId=new Map(data.tickets.map(t=>[t.id,t]));
for(const t of data.tickets)for(const d of t.depends)assert.ok(byId.get(d).sprint<=t.sprint);
for(let n=1;n<=4;n++){
 assert.equal(data.tickets.filter(t=>t.sprint===n).length,2);
 assert.ok(fs.existsSync(path.join(root,`labs/banking-residency/tests/test_sprint${n}.py`)));
}
const html=read('app/northstar-academy.html');
const tpl=read('app/src/app.template.html');
assert.ok(!html.includes('/* __RESIDENCY_DATA__ */')&&!html.includes('/* __RESIDENCY_UI__ */'));
assert.ok(html.includes(JSON.stringify(data).slice(0,45)));
assert.ok(html.includes('Read the sprint guide') && html.includes('RESIDENCY_LESSONS'));
assert.ok(html.includes('Parameterization alone is not sufficient') || html.includes('parameterization alone is not sufficient'));
for(const k of ['data-view="residency"','data-view-jump="residency"','Banking Engineering Residency', 'Export practice record','Run practice review','rCompetencyHTML','rStatus'])assert.ok(html.includes(k),k);
assert.equal([...tpl.matchAll(/\{\s*id:"[a-z0-9-]+",\s*name:/g)].length,15,'Original simulations modified');
const bank=read('labs/banking-residency/app/bank.py');
assert.ok(bank.includes('class Bank:') && bank.includes('NS-C401') && bank.includes('NS-C408'));
assert.ok(read('labs/banking-residency/app/server.py').includes("127.0.0.1"));
console.log('PASS connected residency: 4 sprints, 8 tickets, real source/tests, portal workflow, competency distinctions, 15 legacy simulations');
