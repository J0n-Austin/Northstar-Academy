# Northstar Stage 4.1 — Release acceptance checklist

## Deployment

Copy the **contents** of the new ZIP's `northstar-engineering-academy` folder into your existing local Git checkout, preserving `.git`. Do **not** copy the separately delivered mentor packet into the public repo. In Codespaces/Ubuntu/WSL:

```bash
npm run check

git status
git add -A
git commit -m "Stage 4.1: engineering foundations and teaching labs"
git push origin main
```

Open GitHub → Actions. `verify` and then `deploy` should pass. Existing Pages settings should remain **GitHub Actions**. Site URL: `https://j0n-austin.github.io/Northstar-Academy/`.

## Website: check the new experience

1. From the homepage select **Engineering Foundations**, or visit `/app/northstar-academy.html#foundations`.
2. Finish onboarding (for a fresh browser). See six units and 24 lesson tiles.
3. Click SQL lesson 1 before completing Python prerequisites: the content should remain visible, but practice completion locked.
4. Start Python lesson 1; expand **Read the full Python & program structure chapter** and inspect the case study and code snippets.
5. Click **Stage 3** in the three-step concept diagram; the selection should update.
6. Click a wrong formative answer and review feedback. Reveal hints one at a time. Click the correct answer.
7. Click completion with an empty reflection: it must refuse to mark completion. Enter at least 30 characters describing a concrete experiment or observed result, then mark the milestone.
8. Refresh, return to Foundations: progress should display **1 / 24** in the same browser. Python lesson 2 should now have its prerequisite met.
9. Open **Skills**. Confirm learning milestones are *locally marked*, **0 code-verified competencies**. Never present quiz progress as a credential.
10. Open **Banking residency → NS-C401**. The recommended foundation lesson links should appear; clicking one should take you to its lesson.
11. Confirm all 15 original simulator labs still open, accept commands and are unaffected.
12. At 390px mobile width check foundations list, full lesson, coding example and original simulator for no horizontal overflow.

## Real coding workshops

```bash
cd labs/foundations/python
bash smoke-test.sh       # PASS, unchanged starter
bash run-checks.sh        # FAIL until student repairs starter.py
```

Repeat for `http`, `sql`, `testing`, `debugging`, `cs`. These contain 48 behavioral test cases in total. The *release* smoke script in `scripts/smoke-foundations.sh` deliberately confirms both that smoke tests pass **and** starter contract tests fail in the expected way. The complete repository `npm run check` therefore **must pass even before students solve their workshops**.

Students should create a branch, run the test for one contract, fix the starter code, add their own edge test, rerun all tests and submit a real pull request with reproduction/verification evidence. Private reviewer solutions were separately tested with 48/48 passing tests and are not included in the public ZIP.

## Boundaries

Do not expose the intentionally flawed banking demo server to the Internet. It uses `X-Demo-User` as an untrusted simulation identity and binds localhost. Public GitHub Pages is static; it does not run learner Python, validate commits, check independent work, sync PRs, securely persist student progress or issue verified credentials.
