# Stage 3 — Acceptance Checklist (GitHub Pages and Codespaces)

## Automatic release checks

Run `npm run check` on Ubuntu or Codespaces (Node 20+, Python 3, GCC).

The CI pipeline must pass **all 18 original simulator suites**, both native and both commercial real-lab smoke tests, curriculum prerequisite/DAG validation, the integrated portal test, the Pages asset allowlist and local HTTP checks.

`npm run test:labs` intentionally checks that shipped starter defects are reproducible; it does not claim the learner completed these exercises.

## Browser: integrated navigation

1. Open your GitHub Pages homepage. Click **Commercial security · inside the portal**. After first-time onboarding, the **Commercial residency work queue** should open within the academy (without going to the old standalone briefing page).
2. Open the account security ticket. Verify its requirements, two guided practice questions, local run commands, evidence checklist, prerequisites, and Codespaces guide link.
3. Pick an incorrect answer then the correct answer. Confirm explanatory feedback and updated practice counter.
4. Mark one workspace evidence item; confirm its counter updates. These are self-reports, not verified grades.
5. Refresh the page and reopen the module. Previously passed questions and checked evidence should persist on that browser.
6. Open **My Work**. Verify the same queue contains two commercial assignments and all 15 original simulator tickets.
7. Open **Labs**. Verify both commercial assignments and the 15 browser simulations are accessible.
8. Open **Curriculum**, select **Commercial** to see two available modules. Select **Core** for 19 available modules, including 15 browser simulations and 4 real Linux workspace modules. Select **CNO** to confirm it is correctly labeled planned/empty.
9. Complete a task in an original simulation to confirm legacy interactivity still works. The Skills view should distinguish simulator progress from commercial local practice records.
10. Check on a phone/mobile viewport for horizontal overflow, unreadable controls or broken cards; use keyboard navigation where possible.
11. Press reset progress; confirm it asks for confirmation and clears both simulator and commercial practice state.

**Notes:** Existing learners' Stage 1/2 simulator progress uses the same localStorage key (`ns-academy-v1`). It is retained unless the user explicitly resets it. No cross-device sync.

## Real workspace

In Codespaces or Ubuntu:

```bash
cd labs/commercial-api-security
bash run-checks.sh  # expected failures until the learner repairs the starter
cd ../commercial-transaction-integrity
bash run-checks.sh  # expected failures until repairs
```

Do not expose the intentionally insecure training API to external networks; it is designed to bind to localhost.

## GitHub deployment

Copy Stage 3 files over your existing clone **without overwriting `.git`**; do not copy private mentor packets. Execute:

```bash
npm run check
git status
git add -A
git commit -m "Stage 3: integrate commercial security into student portal"
git push origin main
```

Verify **Actions → Test and deploy Northstar Academy** succeeds and Pages is configured to **GitHub Actions**. Test `https://j0n-austin.github.io/Northstar-Academy/` and `https://j0n-austin.github.io/Northstar-Academy/app/northstar-academy.html#commercial`. If changes appear cached, hard-refresh once.
