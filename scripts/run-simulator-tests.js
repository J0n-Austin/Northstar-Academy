/* All original emulator regressions run without third-party npm packages. */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const suites = [
  ...Array.from({length: 15}, (_, i) => `test${i ? i+1 : ''}.js`),
  'test_cinterp.js', 'test_edit.js', 'test_nav.js'
];
let passed = 0;
for (const suite of suites) {
  const result = spawnSync(process.execPath, [path.join(root, 'app/src', suite)], {
    cwd: root, encoding: 'utf8', maxBuffer: 4*1024*1024
  });
  if (result.status !== 0) {
    console.error(`FAIL ${suite}\n${result.stdout || ''}\n${result.stderr || ''}`);
    process.exitCode = 1;
  } else {
    passed++;
    const summary = (result.stdout || '').match(/\d+ passed, \d+ failed/g)?.at(-1) || 'PASS';
    console.log(`${suite}: ${summary}`);
  }
}
console.log(`Simulator suites passed: ${passed}/${suites.length}`);
