# Stage 4.1 — Educational Depth & Foundations

## Release intent

Put instruction **before** the connected banking residency. Students should no longer be forced to discover Python, HTTP, SQL, testing, debugging and key CS principles only through tickets. This is a first substantial teaching release, **not yet a complete CS curriculum**.

## New curriculum

- `curriculum/foundations.v1.json`: 6 units, 24 individually authored lessons (foundation → guided → guided → independent), explicit lesson-level prerequisite DAG, concrete banking sprint links, worked code, misconceptions, formative multiple-choice checks, three escalating hints, and independent applied exercises.
- `docs/foundations/*.md`: 6 longer engineering chapters with concrete problem cases (state corruption, invalid HTTP contracts, partial transfers, false-green test suites, unsafe logs, cyclic prerequisite graphs). The full text is embedded for reading inside the academy. Approx. 5,063 words of guide material plus lesson-specific instructional content and examples.
- `labs/foundations/{python,http,sql,testing,debugging,cs}`: 6 separate standard-library-only Python workshops with 48 learner contract tests in total. Starter defects deliberately make individual student tests fail. No real customer data, credentials, third-party dependencies or public backend are used.

## Portal behavior

- Engineering Foundations navigation section, plus homepage, Commercial pathway, Core curriculum map and My Work entry points.
- Per-lesson prerequisites and locked *practice milestone* marking. All content remains readable, so experienced learners can browse freely; prerequisite gating applies to self-reported milestone completion, not access to information.
- Interactive three-stage concept flows, full reading chapter, worked example, conceptual checks with answer feedback, progressive hints and workspace code commands.
- Local draft reflection and quiz progress, reset functionality, and transparent skills view that distinguishes practice from unverified work.
- Every banking residency ticket lists its recommended foundation lessons, without breaking existing Stage 4 tickets.
- The original 15 simulator labs and original 8-ticket banking residency remain accessible.

## Key boundaries

The public site is static and hosts no executable Python, tests, learner source or private instructor keys. Codespaces/local Linux executes real workshops. Progress is saved in browser `localStorage`; self-reports and formative checks are not credentials or verified proficiency. No actual GitHub PR syncing or secure code grader is implemented.

## Future work

Add deeper discrete math, data structures, algorithms, OS internals, C/C++, Java/Spring, full service architecture and authenticated assessment infrastructure. Test learning outcomes with pilot students and employers before claiming equivalence to employment or an accredited CS degree.
