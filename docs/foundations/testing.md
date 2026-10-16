# Testing: evidence of behavior, not a checkbox

## 1. Test the interface, not private details

A well-formed test establishes inputs, executes a behavior and checks the promised output or side effect. Separate unit-level pure functions from integration boundaries such as SQLite and HTTP. When tests read private implementation variables, refactoring becomes painful even when behavior is unchanged. State what property the assertion protects: a response field, a rejected invalid amount, unchanged balances after a failure, or access denied to a different user.

## 2. Design a useful test matrix

For an account API, enumerate categories before writing assertions: authorized existing account, unauthorized existing account, unknown account, malformed identifier, no actor, empty collection, pagination edge, and database failure. Check negative-path state as well as the returned error. Rejecting a transfer is not sufficient if the debit has already persisted. Do not rely solely on example input from the README.

Use fresh fixtures and independent test databases. Each test should set up its own world, especially when mutations are involved. Order-dependent tests may pass locally and fail in CI, undermining trust in the evidence.

## 3. Red, green, refactor

Write the test that reproduces the defect; confirm it fails for the right reason, then fix the code and rerun. Finally refactor while keeping behavior stable. A test that only checks `self.assertTrue(True)` will be green, but adds no confidence. Similarly, a large coverage number indicates execution, not whether important invariants were asserted.

```python
with self.assertRaises(ValueError):
    bank.transfer(cents=0)
self.assertEqual(bank.balance(1), starting_balance)
```

This checks that the service rejects invalid input *and* preserves state. Add a second check for the other account.

## 4. Unit, integration and contract tests

Unit tests execute quickly and isolate one behavior. Integration tests confirm multiple components cooperate. Contract tests guard interface compatibility, including HTTP status, body shape and input rules. End-to-end tests give confidence in realistic user flows but cost more to run and diagnose. Use the narrowest test that convincingly detects a defect, then add integration coverage for critical boundaries.

CI should run independently of hidden local state. Source-controlled test fixtures must be synthetic, and tests should not depend on cloud accounts, current wall-clock time or non-deterministic network services without a specific reason.

## 5. Practice, mutation and reporting

In the testing workshop you will write tests *and* repair a deliberately broken function. Run the supplied negative tests before your change and save their output. Consider a simple mutation: if someone changes `>=` to `>`, does the test suite catch the off-by-one error? Use `python3 -m unittest discover -s tests -v`. When you enter the residency, provide exact commands, the first failing assertion, the patch summary and the final tests. If the test does not probe the failure path, say so; honesty is part of engineering evidence.

## Case study: every test passes, but authorization is broken

**Incoming ticket:** A team reports 100% line coverage, yet a customer can view another customer's account. The unit tests mock the `Bank.lookup` function to return a successful record for every user; they never create two distinct owners. Coverage reports show executed lines, not whether the permission predicate was correct.

**Design the smallest useful regression:** Create Alice's account 1 and Bob's account 2 in a fresh in-memory database. Request Alice's account as Alice (expected success) and as Bob (expected denial). Query both accounts after the denied request to prove no state change. Add a malformed identifier test, an unknown resource test and a response-data-minimization assertion. Avoid a test that asserts only “the request did not crash.”

**Avoid tautological tests:** If the function under test calculates a sum and the test computes its expected value by calling the same helper, both sides can share a defect. Write a simple independently calculated expected result. For boundary amounts, test zero, negative, equal-to-balance, one cent over balance, and a non-integer. Tests against a fake database should not be your only evidence: add one integration test that passes through the real SQLite layer to catch query mistakes.

**Mutation experiment:** Temporarily change `>=` to `>` in the sufficient-funds check. Which test fails? If none does, you lack an exact-balance boundary test. Restore the implementation afterward; demonstrate the original red assertion, the corrected green result and the mutation being rejected. This experiment teaches more than simply counting assertions.

**CI handoff:** New workshop tests should be deterministic: fresh state, no internet dependencies, explicit failure messages and clear commands. `npm run check` is a repository release gate; individual `bash run-checks.sh` files within learner workspaces are expected to fail before the student completes the exercise. Document this difference so a green deployment does not mask uncompleted learner tasks.


# Extended engineering lessons · Stage 4.1A

## 5. Property-based and boundary testing

Example tests check known cases, but invariants describe entire classes of input. Even without a property-test library, generate structured boundary inputs and assert conservation of money, deterministic ordering and input rejection. Record random seeds for reproducible failures. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
def allowed(x): return type(x) is int and 0 < x <= 500
assert not allowed(0) and not allowed(True)
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Many examples do not replace a clearly expressed property.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the testing workshop.

**Review question:** What is a strong transfer invariant? Example tests check known cases, but invariants describe entire classes of input. Many examples do not replace a clearly expressed property.

## 6. Mocking versus integration

A mock can prove an interaction occurred but not that a real transaction commits correctly. Use unit tests for policies and integration tests for databases, HTTP serialization, migrations and concurrent work. Avoid overmocking the component whose behavior matters. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
class FakeClock:
    def now(self): return 42
assert FakeClock().now()==42
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A fake database cannot prove real SQL behavior or isolation.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the testing workshop.

**Review question:** Which test best validates actual SQL constraints? A mock can prove an interaction occurred but not that a real transaction commits correctly. A fake database cannot prove real SQL behavior or isolation.

## 7. Mutation and negative tests

A good regression test should fail when the original defect is reintroduced. Temporarily change a guard or condition to evaluate whether a test detects the specific vulnerability. Negative tests must also verify no side effect happened after rejection. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
def restricted(actor, owner): return actor == owner
assert restricted("a","b") is False
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A suite passing on both correct and intentionally broken code is not meaningful evidence.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the testing workshop.

**Review question:** What does a mutation surviving all tests suggest? A good regression test should fail when the original defect is reintroduced. A suite passing on both correct and intentionally broken code is not meaningful evidence.

## 8. CI gates and flaky tests

Continuous integration repeats clean-environment checks without relying on a developer’s laptop state. Tests that share mutable databases or assume timing/order are often flaky. Pin dependencies, isolate fixtures, report failure artifacts and separate learner-red exercises from release-gate tests. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import tempfile
with tempfile.TemporaryDirectory() as directory:
    assert directory
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A green workflow can still conceal missing security assertions.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the testing workshop.

**Review question:** How should a shared-state flaky test be repaired? Continuous integration repeats clean-environment checks without relying on a developer’s laptop state. A green workflow can still conceal missing security assertions.
