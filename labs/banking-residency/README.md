# Northstar Banking Engineering Residency · 4 sprints

**Localhost training only. All customer records are synthetic.** Do not deploy this
service to GitHub Pages, a public server, or use actual financial data. The
`X-Demo-User` header is a caller-controlled training stand-in, **not auth**.

## Start

Use GitHub Codespaces, WSL, or Linux with Python 3.10+ (only standard library).

```bash
cd labs/banking-residency
python3 -m app.server --port 8765
# other terminal:
curl -i http://127.0.0.1:8765/health
curl -H 'X-Demo-User: alice' http://127.0.0.1:8765/accounts
bash run-checks.sh
```

The initial `run-checks.sh` will **fail intentionally** on the learner starter
code. Fix one ticket at a time, rerun its suite, then rerun all four sprints.
Smoke-only CI uses `smoke-test.sh` and is expected to pass with defects present.

| Sprint | Tickets | Tests | Learning guide |
|---|---|---|---|
| 1 | NS-C401 / C402 | `python3 -m unittest tests.test_sprint1 -v` | `guides/01-service-foundations.md` |
| 2 | NS-C403 / C404 | `python3 -m unittest tests.test_sprint2 -v` | `guides/02-apis-and-appsec.md` |
| 3 | NS-C405 / C406 | `python3 -m unittest tests.test_sprint3 -v` | `guides/03-transaction-design.md` |
| 4 | NS-C407 / C408 | `python3 -m unittest tests.test_sprint4 -v` | `guides/04-testing-and-release.md` |

Read the in-portal ticket acceptance criteria. Use a branch for each ticket,
run the tests, write a PR summary using `templates/engineering-report.md`,
and request code review from a person when available. The browser's reviewer
is a deterministic **practice simulation**, not code verification.

### Development boundaries

- Do not introduce third-party dependencies unless the design review calls for it.
- Never replace a failing test with a weaker test to achieve green results.
- Use parameter binding, server-side authorization and atomic transactions.
- Keep the HTTP server bound to `127.0.0.1`.
- Tests create temporary SQLite databases and avoid changing real data.
- The existing Stage 2 commercial labs are separate prerequisites. This is a new
  sustained multi-sprint codebase, not a database migration of those exercises.
