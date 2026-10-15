const { createShell } = require("./engine.js");
const { installDebugging, findReproducer, battery, gradeBisect, DBG_COMMITS, snapshotOf } = require("./engine14.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };

// history sanity: commits before f13b9d2 pass the battery, from it onward fail
const idx = DBG_COMMITS.findIndex((c) => c.sha === "f13b9d2");
ok("every commit compiles + good ones pass, bad ones fail", DBG_COMMITS.every((c, i) => battery(snapshotOf(c)) === (i < idx)));

const sh = createShell(); installDebugging(sh);
ok("visible tests pass on HEAD (that's why it shipped)", sh.run("make test").code === 0);
ok("bug report readable", /deploy failed/.test(sh.run("cat tickets/BUG-311.txt").out));
const tr = sh.run('trace word_count "  deploy failed "');
ok("trace steps lines with variables", /L\d+\s+n\+\+;\s+n=\d i=\d/.test(tr.out));
ok("trace shows the wrong return", /=> returns 5/.test(tr.out));

// step 1: reproducer
ok("no reproducer at start", sh.dbgState().reproducers === 0);
sh.run("echo 'word_count \"  deploy failed \" 5' >> tests/cases.txt");
ok("a test that asserts the WRONG value is not a reproducer", sh.dbgState().reproducers === 0);
sh.writeFile("tests/cases.txt", sh.fileContent("tests/cases.txt").replace('word_count "  deploy failed " 5', 'word_count "  deploy failed " 2'));
ok("correct failing test counts as reproducer", sh.dbgState().reproducers === 1);
ok("make test now fails", sh.run("make test").code === 1);
ok("malformed case line is reported", (() => { sh.run("echo 'word_count deploy 1' >> tests/cases.txt"); const r = /can't parse/.test(sh.run("make test").out); sh.writeFile("tests/cases.txt", sh.fileContent("tests/cases.txt").replace("word_count deploy 1\n", "")); return r; })());

// step 2: git + bisect
ok("git log --oneline lists 10 commits with HEAD -> main", sh.run("git log --oneline").out.split("\n").length === 10 && /HEAD -> main/.test(sh.run("git log --oneline").out));
ok("git show renders a diff", /^\+    int n = 1;/m.test(sh.run("git show f13b9d2").out));
ok("checkout old commit detaches", /detached HEAD/.test(sh.run("git checkout a1c09e2").out));
ok("old commit passes the reproducer", sh.run("make test").code === 0);
ok("checkout main", /Switched to branch 'main'/.test(sh.run("git checkout main").out));
sh.run("git bisect start");
sh.run("git bisect bad");
const b1 = sh.run("git bisect good a1c09e2").out;
ok("bisect checks out a midpoint", /Bisecting: .*\n\[[0-9a-f]{7}\]/.test(b1));
const run = sh.run("git bisect run make test").out;
ok("bisect run finds f13b9d2", /f13b9d2 is the first bad commit/.test(run));
ok("dbgState sees bisect done", sh.dbgState().bisectDone === "f13b9d2");
ok("manual bisect (good/bad) also converges", (() => {
  const s2 = createShell(); installDebugging(s2);
  s2.run("echo 'word_count \"  deploy failed \" 2' >> tests/cases.txt");
  s2.run("git bisect start"); s2.run("git bisect bad HEAD"); let out = s2.run("git bisect good a1c09e2").out;
  for (let k = 0; k < 6 && !/first bad commit/.test(out); k++) out = s2.run("git bisect " + (s2.run("make test").code === 0 ? "good" : "bad")).out;
  return /f13b9d2 is the first bad commit/.test(out);
})());
ok("answer grading: exact sha", gradeBisect("f13b9d2\n"));
ok("answer grading: listing many shas fails", !gradeBisect("f13b9d2 0a8e5c1 19d4f7a"));
ok("answer grading: wrong sha fails", !gradeBisect("19d4f7a"));

// step 3: fix on main + commit
ok("commit refused while bisecting", sh.run("git commit -am fix").code === 1);
ok("bisect reset returns to main", /Switched to branch 'main'/.test(sh.run("git bisect reset").out));
const fixed = sh.fileContent("src/textstats.c").replace(/int word_count[\s\S]*?\n}\n/, "int word_count(const char *s) {\n    int n = 0;\n    int inside = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] == ' ') inside = 0;\n        else if (inside == 0) { inside = 1; n++; }\n    }\n    return n;\n}\n");
sh.writeFile("src/textstats.c", fixed);
ok("working copy fixed, not yet committed", sh.dbgState().workingFixed && !sh.dbgState().mainFixed);
ok("git diff shows the change", /^\+\s+int inside = 0;/m.test(sh.run("git diff").out));
ok("checkout refuses to clobber local changes", /would be overwritten/.test(sh.run("git checkout a1c09e2").err));
ok("make test passes with fix", sh.run("make test").code === 0);
ok("git commit works on main", /\[main [0-9a-f]{7}\] Fix word_count/.test(sh.run('git commit -am "Fix word_count for repeated spaces (BUG-311)"').out));
const st = sh.dbgState();
ok("dbgState: committed fix on main", st.onMain && st.mainFixed);
ok("reproducer still present", st.reproducers >= 1);
ok("git status clean after commit", /working tree clean/.test(sh.run("git status").out));

// a fix that special-cases the reported input fails the hidden battery
const s3 = createShell(); installDebugging(s3);
s3.writeFile("src/textstats.c", s3.fileContent("src/textstats.c").replace("    int n = 1;\n", "    int n = 1;\n    if (s[0] == ' ' && s[1] == ' ') return 2;\n"));
ok("special-cased fix fails the hidden battery", !s3.dbgState().workingFixed);

sh.reset();
ok("reset restores git state + source", /HEAD -> main/.test(sh.run("git log --oneline").out) && sh.run("git log --oneline").out.split("\n").length === 10 && sh.dbgState().reproducers === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
