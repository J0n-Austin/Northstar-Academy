# Software architecture & system design

Trace code and data through explicit modules, isolate transport from business policy, and reason about migration, failure modes and reliability before implementing advanced service changes.

## Learning environment

Use a local Python 3 runtime, avoid production secrets, and document input and output for every claim. The learner workshop deliberately starts with defects and its contract tests are meant to fail until repaired. Never expose training services on a public interface.


# Extended engineering lessons · Stage 4.1A

## 5. Modular monolith versus services

Separating deployable services creates failure modes, network boundaries and operational overhead. Start with well-defined modules in one deployable application; split only when scaling, isolation or team ownership justifies the cost. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
components=["api","domain","repository"]
assert len(components)==3
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Microservices do not automatically improve maintainability or security.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the architecture workshop.

**Review question:** When is a modular monolith often preferable? Separating deployable services creates failure modes, network boundaries and operational overhead. Microservices do not automatically improve maintainability or security.

## 6. Release planning and rollback design

A production change should define acceptance criteria, monitoring, deployment order, migration compatibility and rollback limits. For irreversible data changes, rollback may require forward-fix rather than reverting code. Capture decision records for important tradeoffs. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
release={"build":"1.2","migration":"additive","rollback":"revert API"}
assert release["migration"]=="additive"
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A Git revert does not reverse external payments or destructive database changes.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the architecture workshop.

**Review question:** What belongs in a release plan? A production change should define acceptance criteria, monitoring, deployment order, migration compatibility and rollback limits. A Git revert does not reverse external payments or destructive database changes.
