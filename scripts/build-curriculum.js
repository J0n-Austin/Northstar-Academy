/* One authoritative JSON catalog -> static Pages-compatible explorer. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const data = JSON.parse(fs.readFileSync(path.join(root,'curriculum/catalog.v2.json'),'utf8'));
const template = fs.readFileSync(path.join(root,'docs/curriculum.template.html'),'utf8');
const packed = JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028|\u2029/g,' ');
if(!template.includes('/*CATALOG_JSON*/'))throw new Error('Missing curriculum injection anchor');
const html=template.replace('/*CATALOG_JSON*/',packed);
fs.writeFileSync(path.join(root,'docs/curriculum.html'),html);
console.log(`Generated browser curriculum explorer from ${data.catalogVersion}`);
