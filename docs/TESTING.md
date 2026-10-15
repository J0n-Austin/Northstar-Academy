# Stage 1 — Build and deployment acceptance checklist

Use this checklist after each push to `main` before approving Stage 2. The automated checks do not replace real browser and Codespaces acceptance testing.

## Automated baseline (run locally and in Actions)

- [ ] `npm run check` exits with code **0**.
- [ ] The log reports **18/18 simulator regression suites** successful.
- [ ] The catalog validator finds **15 browser** and **4 real-workspace** entries.
- [ ] Both native-lab smoke tests pass, including a real `127.0.0.1` TCP PING/PONG exchange.
- [ ] The local HTTP smoke passes (7 public URL routes and 2 excluded paths return 404).
- [ ] The site verifier reports an exact allowlist of **7 staged assets** (6 HTML + `.nojekyll`).
- [ ] No instructor solution, `app/src`, source fixture, or `.env` is present inside `_site`.

## Live Pages test

After creating and pushing your repo:

- [ ] Under **Settings → Pages**, the source is **GitHub Actions**.
- [ ] **Actions → Test and deploy Northstar Academy**: `verify` and `deploy` succeed.
- [ ] Home page loads without a 404 at `https://YOUR-USER.github.io/REPO/`.
- [ ] Click **Northstar Academy**: onboarding appears; start and open the Linux Fundamentals ticket.
- [ ] Run `ls` and `pwd` inside the **simulated** terminal; complete one guided task and verify visible progress updates.
- [ ] Reload the page in the same browser and confirm progress is retained (browser localStorage only).
- [ ] Navigate the curriculum map and another lab; confirm no blank pages or JavaScript errors.
- [ ] Click both concept screens from the home page.
- [ ] Click the **Native C + POSIX socket labs** link; verify the public run instructions load.
- [ ] Visit `.../app/src/engine.js` and `.../modules/01-linux-service-triage/instructor/solutions.md` through the **Pages URL**: both should return 404 (not published). This does NOT mean source in a public GitHub repo is private.
- [ ] Test narrow screen layout (mobile width) and keyboard navigation.

## Real Linux/Codespaces acceptance

- [ ] From GitHub repo page: **Code → Codespaces → Create codespace on main** succeeds, with `gcc`, `python3`, `gdb` installed.
- [ ] `cd labs/native-c-engineering && bash run-checks.sh` reports known failing parser logic cases on the initial starter. Fixing the parser makes all tests pass.
- [ ] `SANITIZE=1 bash run-checks.sh` runs the sanitizer-enabled binary after the fix.
- [ ] `cd ../posix-protocol && bash run-demo.sh` prints `PASS localhost TCP server + client: PONG`.
- [ ] `bash run-checks.sh` initially reproduces the fragmented read failure. Fixing `read_exact` makes tests pass.
- [ ] Copy and complete an `evidence-template.md`; commit changes in a student branch and create a PR.
- [ ] Original Linux labs `bash setup.sh && bash run-checks.sh` can be started; expected to include unsolved learner tasks.

## Suggested feedback to record after testing

| Field | Value |
|---|---|
| Deployment URL | |
| Git commit SHA | |
| Browser / OS | |
| GitHub Actions run URL | |
| Native compiler version | |
| Working flows | |
| Broken flows / screenshots | |
| Time to enter and complete first ticket | |
| Reviewer time / feedback | |
| Stage 2 decision | Proceed / Blocked |

**Release decision:** Stage 2 should start only after the deploy succeeds, learner UX works, and at least one learner independently completes the real-tool exercises in a clean environment.
