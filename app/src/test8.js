const { createShell } = require("./engine.js");
const { installCodeReview, prTruth, gradeReview, PRS } = require("./engine8.js");
let pass = 0, fail = 0;
const ok = (l, g) => { if (g) { console.log("PASS", l); pass++; } else { console.log("FAIL", l); fail++; } };

// truth is derived by running each PR's code, not hardcoded
ok("pr1 (off-by-one) should NOT be approved", prTruth(PRS[0]).approve === false);
ok("pr2 (clean rename) SHOULD be approved", prTruth(PRS[1]).approve === true);
ok("pr3 (missing validation) should NOT be approved", prTruth(PRS[2]).approve === false);

// grading the learner's verdicts
var good = "pr1: request-changes off-by-one\npr2: approve\npr3: request-changes validation\n";
var g = gradeReview(good, ["pr1", "pr2", "pr3"]);
ok("correct verdicts all grade ok", g.pr1.ok && g.pr2.ok && g.pr3.ok);

ok("approving the buggy pr1 is wrong", !gradeReview("pr1: approve", ["pr1"]).pr1.ok);
ok("rejecting the clean pr2 is wrong", !gradeReview("pr2: request-changes nah", ["pr2"]).pr2.ok);
ok("request-changes on pr3 without naming the issue fails", !gradeReview("pr3: request-changes looks off", ["pr3"]).pr3.ok);
ok("request-changes on pr3 naming validation passes", gradeReview("pr3: request-changes needs input validation", ["pr3"]).pr3.ok);
ok("verdict synonyms work (lgtm == approve)", gradeReview("pr2: lgtm", ["pr2"]).pr2.ok);

// in a shell
var sh = createShell(); installCodeReview(sh);
ok("pr list shows three PRs", /pr1/.test(sh.run("pr list").out) && /pr3/.test(sh.run("pr list").out));
ok("pr show renders a diff", /\+\+\+ b\/src\/logutil.c/.test(sh.run("pr show pr1").out));
ok("pr test pr2 is all green", /all green/.test(sh.run("pr test pr2").out));
ok("pr test pr1 shows failures", /some cases fail/.test(sh.run("pr test pr1").out));
ok("pr on unknown id errors", sh.run("pr show pr9").code === 1);

sh.writeFile("answers/review.txt", good);
var sg = sh.reviewGrade(["pr1", "pr2", "pr3"]);
ok("shell grade: all correct", sg.pr1.ok && sg.pr2.ok && sg.pr3.ok);
sh.reset();
ok("reset restores the review template", /one verdict per PR/.test(sh.fileContent("answers/review.txt")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
