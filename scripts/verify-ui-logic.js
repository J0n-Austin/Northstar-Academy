/* Dependency-free JavaScript / DOM contract checks for Pages pages.
 * Does NOT replace real Chromium manual accessibility and interaction testing.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root=path.resolve(__dirname,'..');
function scriptFor(rel){
  const html=fs.readFileSync(path.join(root,'_site',rel),'utf8');
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]);
  assert.ok(scripts.length>0,rel+' missing inline logic');
  const source=scripts.join('\n');new vm.Script(source,{filename:rel});return source;
}
class Node {
  constructor(tag='div'){this.tag=tag;this.children=[];this.value='';this.textContent='';this.className='';this.dataset={};this.handlers={};this.href='';}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=[...items];}
  addEventListener(name,handler){this.handlers[name]=handler;}
}
const ids=new Map();
for(const id of ['track','env','search','summary','tracks','cards','version'])ids.set(id,new Node());
ids.get('track').value='all';ids.get('env').value='all';ids.get('search').value='';
const doc={getElementById(id){return ids.get(id);},createElement(name){return new Node(name);}};
const ctx=vm.createContext({document:doc,location:{search:'?track=commercial'},URLSearchParams});
vm.runInContext(scriptFor('docs/curriculum.html'),ctx,{timeout:1500});
assert.equal(ids.get('cards').children.length,4,'Commercial query param should show four available modules');
assert.ok(ids.get('cards').children.some(n=>n.children.some(x=>x.textContent==='Account Authorization & SQL Query Security')));
ids.get('search').value='idempotency';vm.runInContext('render()',ctx,{timeout:1000});
assert.equal(ids.get('cards').children.length,2,'Search filter should match the initial transaction lab and advanced service');
ids.get('search').value='nomatch-northstar';vm.runInContext('render()',ctx,{timeout:1000});
assert.equal(ids.get('cards').children.length,1,'No-match explanatory node');
assert.equal(ids.get('cards').children[0].className,'empty');
ids.get('search').value='';ids.get('track').value='cno';vm.runInContext('render()',ctx,{timeout:1000});
assert.equal(ids.get('cards').children[0].className,'empty','Planned CNO modules must not be advertised as shipped');

const buttons=['bola','sql','retry','atomic'].map(id=>{const b=new Node('button');b.dataset.check=id;return b;});
const results=new Map();for(const id of ['bola','sql','retry','atomic'])results.set('result-'+id,new Node());
results.set('progress',new Node());
const checked=new Map();
const doc2={querySelectorAll(q){assert.equal(q,'button[data-check]');return buttons;},
 querySelector(q){const m=q.match(/^input\[name="([a-z]+)"\]:checked$/);assert.ok(m,q);return checked.has(m[1])?{value:checked.get(m[1])}:null;},
 getElementById(id){return results.get(id);}};
vm.runInNewContext(scriptFor('docs/commercial-track.html'),{document:doc2,Set},{timeout:1500});
const choices={bola:'deny',sql:'bound',retry:'once',atomic:'atomic'};
for(const button of buttons){
  checked.set(button.dataset.check,'invalid');button.handlers.click();
  assert.match(results.get('result-'+button.dataset.check).textContent,/Try again/);
  checked.set(button.dataset.check,choices[button.dataset.check]);button.handlers.click();
  assert.match(results.get('result-'+button.dataset.check).textContent,/Correct/);
}
assert.match(results.get('progress').textContent,/4 \/ 4/);
console.log('PASS static UI logic: curriculum filters, CNO planned state, four commercial practice decisions');
