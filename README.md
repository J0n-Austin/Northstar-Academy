# Northstar Engineering Academy — Stage 1 Testing Release

**Status:** interactive prototype + real-Linux engineering labs. **Hosted front end:** GitHub Pages (static). **Real toolchains:** local Linux or GitHub Codespaces. **Accounts/verified assessments:** not implemented.

The project is an apprenticeship-style engineering learning environment. It uses a simulated Northstar company, realistic tickets and assessments, and now includes actual C and socket-programming exercises. The site is **not** a real Linux terminal, a credential issuer, or a deployed backend.

## What currently works

- **15 browser practice labs** (Linux, C intro, sockets, systems, debugging, review, and incident/capstone) inside [`app/northstar-academy.html`](app/northstar-academy.html). Browser state is saved only on that device in localStorage. Compiler, shell, and code-review interactions in this UI are simulations.
- **2 original real-shell labs:** `labs/linux-fundamentals` and `modules/01-linux-service-triage`.
- **2 additional real-tool starter labs:** `labs/native-c-engineering` (C binary-frame parser) and `labs/posix-protocol` (actual loopback TCP client/server and socket stream handling). These exercises deliberately ship with bugs to fix.
- Static mockups, pilot kit, learning metadata and the proposed [product roadmap](docs/product-roadmap.md).
- **GitHub Pages publishing** behind automated tests and an explicit, narrowly scoped site artifact. Instructor notes, graded source fixtures and other repo materials are not copied into the Pages website.

## Local development and release gate

Requirements: **Node.js 20+**, **bash**, **gcc**, **make**, **python3**. GitHub Actions uses Node 22 and installs Ubuntu build tools.

```bash
npm run check          # catalog + all 18 emulator suites + native lab smoke + site build + validation
npm run build          # rebuild the single-file academy and _site/
npm run verify:site    # confirm allowed files and local URLs in _site/
```

Open `_site/index.html` to preview the published site locally. To test with a local server instead:

```bash
python3 -m http.server 8000 --directory _site
# visit http://localhost:8000/
```

The existing optional `app/src/ui_test.js` headless UI test uses `playwright-core` and a machine-specific Chromium path; it is **not** included in the dependency-free CI gate yet. Browser interactions must still be tested manually for this release.

## Real engineering labs (Linux/Codespaces)

Once Codespaces is ready:

```bash
cd labs/native-c-engineering
bash run-checks.sh              # fails on the deliberately buggy starter parser
SANITIZE=1 bash run-checks.sh   # optional real ASan/UBSan check

cd ../posix-protocol
bash run-demo.sh                 # localhost TCP ping/pong: works as a baseline
bash run-checks.sh              # fails on deliberate partial-read defect
```

**Why CI stays green while those tests fail:** CI executes separate happy-path smoke tests to verify the labs can build and run in the provided environment. Full learner exercise tests should become green only after the learner fixes the code. Both labs include their own README, contracts, rubrics and evidence templates.

## Create your new GitHub repository

1. On GitHub choose **New repository**. Pick a name, e.g. `northstar-engineering-academy`. **Do not initialize** with a GitHub README, license or `.gitignore`; this handoff already includes project files. Select public visibility if you want publicly accessible Pages on a plan that requires it. Do not upload private instructor solutions or real secrets.
2. Download/unzip this Stage 1 package into a directory, and open a terminal **inside the extracted `northstar-engineering-academy/` folder** (the one containing `package.json`).
3. Run `npm run check`. This should pass without installing npm dependencies if Node and the native toolchain are available.
4. Initialize and push:

   ```bash
   git init
   git add .
   git commit -m "Stage 1: Pages foundation and native labs"
   git branch -M main
   git remote add origin https://github.com/YOUR-USER/northstar-engineering-academy.git
   git push -u origin main
   ```

   Replace the owner and repository name with **your actual values**. If you already initialized an empty local Git repo, omit `git init`. GitHub may prompt for browser/Git Credential Manager authentication; HTTPS password-based account login is not supported.

5. In the new GitHub repository go to **Settings → Pages → Build and deployment → Source → GitHub Actions**. Depending on the repo's policy, GitHub Actions may need enabling first.
6. Go to **Actions → Test and deploy Northstar Academy**. The workflow runs the release checks and publishes `_site`. Wait for the deploy job to finish successfully.
7. Visit `https://YOUR-USER.github.io/northstar-engineering-academy/` (the final address is shown on the Pages settings screen and the deployment job). Click **Northstar Academy**, check the interactive tutorial, then open **Native C + POSIX socket labs** for actual Linux/Codespaces instructions.
8. To test the real labs, choose **Code → Codespaces → Create codespace on main**; the `.devcontainer` installs the native tools and seeds the original shell labs.

See the detailed manual test checklist in [`docs/TESTING.md`](docs/TESTING.md).

## Deploy boundaries and critical constraints

- The Pages workflow intentionally copies only `index.html`, the 2 concept mockups, the generated academy + standalone lab HTML, and `docs/real-labs.html` into `_site`. **Publishing a repo publicly makes everything committed to that repo available in the GitHub source browser**, even when the files are excluded from Pages! The bundle intentionally excludes the original private instructor solution file, which is handed off separately.
- Training hint content and source-visible tests are **not secret assessments**. Do not use results as verified job credentials. Do not put employer-owned material, real malware, passwords, or grading keys in a public repo.
- Browser simulated progress **does not sync** with a Codespace, and Codespace changes must be committed/pushed if you want them to survive workspaces.
- No real authentication, hosted sandbox provisioning, payment, employer portal or validated assessment backend has been implemented yet. Those require infrastructure beyond GitHub Pages.

## Documentation

- [`docs/STAGE1_CHANGELOG.md`](docs/STAGE1_CHANGELOG.md) — delivered scope, limitations and what is next.
- [`docs/TESTING.md`](docs/TESTING.md) — exact GitHub Pages and Codespaces manual tests.
- [`curriculum/catalog.v1.json`](curriculum/catalog.v1.json) — initial versioned inventory (not yet wired into app UI).
- [`docs/competency-evidence.md`](docs/competency-evidence.md) — first evidence and review standard, without claims of secure verification.
- [`docs/product-roadmap.md`](docs/product-roadmap.md) — the proposed multi-stage vision.

**Stage 1 release gate:** `npm run check` passes; _site is allowlisted; the 15 browser labs remain intact; students can run two native starter labs in a real Linux environment. Additional roadmap Phase 1 requirements—authenticated learner state, protected grading, replayable employer assessments and access revocation—remain for later work.
