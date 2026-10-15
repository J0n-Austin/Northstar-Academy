# Stage 4 — Release acceptance test

## Deploy

Copy the **contents** of the Stage 4 ZIP's inner repository directory over the existing local Git clone. Keep `.git`; keep the private reference implementation out of the public repo. Check `git status`. From Ubuntu, WSL or Codespaces:

```bash
npm run check
# expected: PASS. Note that learner acceptance suites intentionally fail before students fix the code.
git add -A
git commit -m "Stage 4: connected banking residency and sprint workflow"
git push origin main
```

GitHub → Actions: `verify` then `deploy` must pass. Settings → Pages must use GitHub Actions. Open `https://j0n-austin.github.io/Northstar-Academy/` and click **Banking Engineering Residency**.

## Portal walkthrough (GitHub Pages)

1. New learner: complete onboarding and click **Banking residency** on the sidebar.
2. Confirm **four sprint columns/cards** with two NS-C40x tickets apiece.
3. Open **NS-C401**; verify the ticket, commands, learning content, hint, PR fields and reviewer prompt.
4. Click **Start work**; enter a short summary and click **Save draft**, then refresh and reopen; text and status must persist.
5. Submit with incomplete fields; **Run practice review** must request changes (never falsely mark a verified skill).
6. Enter a meaningful reproduction/design summary, a concrete test command **and observed result**, a test commit hash or GitHub PR URL, and a risk/rollback note. Submit again and run practice review; status should read **Practice reviewed**, not independently verified.
7. Open **Skills** and verify local practice-reviewed and pending items are separate from the zero **independently verified** count.
8. Export practice record JSON and inspect its disclaimers. Confirm reset clears Stage 4 records *and* original demo practice; do not reset if you want to retain progress.
9. Open an original Linux Fundamentals simulation and exercise its terminal. Switch back to residency and verify the original simulator was not broken.
10. Test at 390 px mobile and in light theme, including the PR form. Avoid any horizontal page overflow.

## Real learner service (Codespaces or local Ubuntu)

```bash
cd labs/banking-residency
bash smoke-test.sh          # expected PASS
bash run-checks.sh           # expected FAIL (intentional learner defects)
python3 -m unittest tests.test_sprint1 -v
python3 -m app.server --port 8765
# second terminal:
curl -i http://127.0.0.1:8765/health
curl -i -H 'X-Demo-User: alice' http://127.0.0.1:8765/accounts/2
```

Work one ticket at a time and rerun each sprint's tests. The instructor reference copy was separately validated with **17 passing tests** before defects were introduced. Never deploy this insecure training API publicly. `X-Demo-User` is not real authentication.

## Boundaries

- Browser progress, evidence fields, and simulated reviews live in localStorage. They are editable, untrusted and not shared across devices.
- PR drafts are not pushed to GitHub by the web app; learners must commit/push/open actual PRs.
- No student accounts, code execution, automatic code grading, independent assessment, employer access, Java specialization, or full CNO specialization is claimed as complete.
- GitHub Pages hosts only static allowlisted HTML and no lab source or tests.
