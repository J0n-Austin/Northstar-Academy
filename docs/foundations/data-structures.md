# Data structures & algorithms

Choose and justify collections and complexity using authentic account, job-queue and dependency examples. Practice invariants and performance before using these concepts in banking workflows.

## Learning environment

Use a local Python 3 runtime, avoid production secrets, and document input and output for every claim. The learner workshop deliberately starts with defects and its contract tests are meant to fail until repaired. Never expose training services on a public interface.


# Extended engineering lessons · Stage 4.1A

## 5. Heaps and priority queues

A heap supports efficiently selecting a minimum-priority element while maintaining partial order. Use it for job scheduling with explicit priorities; understand that equal-priority elements need a tie breaker if stable order matters. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import heapq
h=[(2,"review"),(1,"alert")];heapq.heapify(h)
assert heapq.heappop(h)[1]=="alert"
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A heap is not a fully sorted list and should not be treated as one.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the data-structures workshop.

**Review question:** What workload suits a heap? A heap supports efficiently selecting a minimum-priority element while maintaining partial order. A heap is not a fully sorted list and should not be treated as one.

## 6. Complexity and space budgeting

Analyze both runtime and memory across scale. Loading a 20 GB log into a list is risky, while streaming can bound memory but may add I/O and prohibit rewinding. Document assumptions about maximum input size and service concurrency. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
from itertools import islice
small=list(islice(range(1000000),3));assert small==[0,1,2]
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** An O(n) algorithm can be infeasible if it retains every item in memory.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the data-structures workshop.

**Review question:** Which design bounds memory for large log processing? Analyze both runtime and memory across scale. An O(n) algorithm can be infeasible if it retains every item in memory.
