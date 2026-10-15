# Stage 3 — Integrated Student Portal

## Shipped

- Unified **My Work** queue: original 15 browser simulations and two real Commercial Software Security assignments coexist inside the same portal.
- A dedicated **Commercial Software Security** sidebar entry and full assignment views inside the academy. Students no longer have to switch to an unrelated standalone page to study commercial tickets.
- Data-driven **Curriculum & Pathways** view generated from `curriculum/catalog.v2.json`, showing Engineering Core, Commercial Software Security, and clearly marked planned CNO track. Core/native workspaces retain external instruction links.
- Structured public instructional content in `curriculum/commercial.practice.json`, embedded into the generated single-file app by `app/src/build.js`. No runtime API or fetch is required on GitHub Pages.
- Commercial tickets explain reproduction, design decisions, acceptance criteria, local commands, and self-reported workspace evidence. Four **browser-visible** guided reasoning checks are evaluated and saved locally; these are not code grading.
- Local practice and self-reported evidence appear alongside simulated competency activity (but are explicitly marked unverified).
- Homepage deep links into the integrated commercial track and curriculum. Initial onboarding preserves the requested route.
- Mobile header fix, full local progress reset, automated catalog/portal checks, and browser interaction testing.

## Preserved

- All 15 legacy simulator definitions and existing engines, lab tests, and simulator workflows.
- Both real commercial Python/SQLite code labs and their intentionally defective learner starter code.
- Existing versioned course catalog, standalone reference pages, static Pages deployment allowlist, and previous CI gates.

## Technical boundary

The GitHub Pages frontend **does not execute Python or verify student patches**. Guided answers and progress can be inspected or modified in the browser. Real programming and testing must occur inside Codespaces or a Linux workstation, with human review required for reliable learner records. No accounts, credentials, real-money operations, or employer features were added.

## Next recommended stage

Pilot with an unfamiliar student; measure ticket comprehension, setup friction, defect reproduction, time-to-fix, quality of evidence and reviewer time before expanding into additional application/security services.
