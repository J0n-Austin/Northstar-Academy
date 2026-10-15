# Northstar Stage 1 evidence protocol (draft, non-verified)

**Status:** a human-reviewable local practice format, not a validated credential or production skill passport.

Each independent lab asks for an `evidence.md` created from the lab's template and committed alongside the code. For a PR review, attach:

| Evidence | Example | Why reviewers need it |
|---|---|---|
| Source reference | Git commit SHA / reviewed PR | Identify what was actually changed |
| Environment | Ubuntu 24.04, GCC version, command | Reproducible execution |
| Reproduction | Failing test output before fix | Show independent problem identification |
| Verification | Passing tests and sanitizer output | Demonstrate functional fix and robustness |
| Explanation | Root cause, tradeoffs, residual risk | Technical reasoning |
| Assistance disclosure | Tools, mentor hints and AI use | Clarify independence without assuming cheating |

## Proposed future assessor data shape

`module_id`, `version`, `commit_sha`, `toolchain`, `test_commands`, `test_results`, `reviewer`, `rubric_version`, `assistance_level`, `reviewed_at`, `sharing_consent`.

**No such verified central record exists in Stage 1.** Learner-controlled local evidence and source-visible tests must not be represented as independent certification. The eventual employer pipeline will require protected grading, trustworthy provenance, learner consent, and a human review process.
