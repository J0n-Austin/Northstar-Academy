# Computer science reasoning for working engineers

## 1. State and invariants

Software operates on state. For a transfer, source and destination balance change; the total across both accounts should remain invariant. For a curriculum, lesson completion changes; prerequisites must form an acyclic graph to support a valid sequence. State invariants turn vague “should work” requirements into properties that can be tested across successful and failed transitions.

Identify a state transition precisely: current state, action, preconditions, postconditions and failure behavior. A successful API status that accompanies a broken balance invariant is still a defect.

## 2. Complexity is a growth model

Big-O describes asymptotic growth rather than exact runtime. A simple loop over n records is usually O(n); a loop performing another n scan for each record becomes O(n²); a dictionary lookup is average O(1), although hash collisions and memory use affect actual performance. Complexity discussions should name n and the operation being counted. Choose data structures by access patterns, not fashion.

```python
counts = {}
for event in events:
    key = event['type']
    counts[key] = counts.get(key, 0) + 1
```

Expected time is O(n) for n events; additional space is O(k) for k distinct event types. A list-only implementation that searches existing keys for every event would tend toward worse performance as k grows.

## 3. Stacks, queues and graphs

A stack removes the most recently added item first (LIFO); a queue removes the earliest item first (FIFO). Both appear in parsers, job schedulers, graph traversal and debugging tools. A dependency graph connects prerequisites to downstream tasks. A topological sort produces an order in which every prerequisite precedes its consumer; it only exists for directed acyclic graphs.

Depth-first traversal commonly uses three states: unseen, visiting and complete. Encountering a visiting node again means you found a directed cycle. The Northstar curriculum verifier enforces this exact rule, making graph theory immediately relevant to software maintenance.

## 4. Choosing architectural boundaries

A modular monolith can clearly separate HTTP, domain and persistence layers without introducing network failures between every component. Distributed services add independent deployments but also retries, partial failure, authentication boundaries, latency and complex observability. Start with requirements and testable constraints. Draw a sequence diagram for a transfer and label each place a failure can occur. Ask how your design prevents double-processing and data loss.

## 5. Exercises and engineering handoff

The CS workshop asks you to implement counts and deterministic topological ordering while rejecting cycles and missing prerequisites. Start by writing down a correctness invariant and estimate time/space complexity. After the tests pass, document an architecture decision: when should the banking service remain a monolith, and what measured requirement might justify splitting it? Connect this explanation to NS-C402 and the release review in NS-C408.

## Case study: a curriculum cannot be scheduled

**Incoming ticket:** A student is told that lesson B requires A, lesson C requires B, and lesson A requires C. The interface shows all three as locked. This is not a student-progress bug: it is a cycle in a directed dependency graph. Before displaying lesson cards, the curriculum validator should reject the invalid data rather than leaving every user stuck.

**Trace a depth-first search:** Mark nodes as unseen, visiting or complete. Enter A (visiting), then B (visiting), then C (visiting), then encounter A again while A is still visiting. This is a cycle. A node already complete does **not** imply a cycle: it can be reused by a different downstream branch. Reject references to missing prerequisite nodes because an unknown lesson cannot be completed.

**Work out an ordering:** Given A with no prerequisites, B requiring A, and C requiring both A and B, the valid order is A,B,C. If D is independent, multiple valid schedules exist. Define a deterministic tie break (e.g. sorted identifiers) so your tests do not fail on arbitrary dictionary iteration order. A topological sort should return each node exactly once with every prerequisite earlier than its dependent. Count the total edges E and nodes V; DFS-based topological ordering is O(V+E) aside from sorting cost.

**Connect performance to engineering decisions:** Suppose a report processes one million events. An O(n²) duplicate search will perform far more comparisons than O(n) set membership on typical inputs. Measure small and medium datasets rather than trusting only a theoretical label. Memory constraints matter as well: maintaining a set of all distinct IDs consumes additional storage. State the data size and access pattern when choosing a structure.

**Architecture handoff:** Draw a request-to-database diagram for the banking service. Identify the trust boundary at input, the transaction boundary in persistence and the verified invariants. Explain why splitting this small service into microservices would introduce extra failure modes without clearly solving the training product's immediate requirements.


# Extended engineering lessons · Stage 4.1A

## 5. Sets, maps and membership

Choosing the right data structure changes complexity. Searching a list is typically linear, while set membership averages constant-time. Sets discard duplicates, so use them for membership or uniqueness, not for preserving ordered audit entries. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
allowed={"alice","bob"}
assert "bob" in allowed and "eve" not in allowed
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Average O(1) lookup does not mean constant runtime under every possible adversarial condition.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the cs workshop.

**Review question:** Which structure models unique membership? Choosing the right data structure changes complexity. Average O(1) lookup does not mean constant runtime under every possible adversarial condition.

## 6. Stacks, queues and scheduling

A stack follows last-in-first-out and a queue follows first-in-first-out. Background jobs need explicit ordering, retries, dead-letter handling and deduplication; a simple Python deque models queue behavior but is not a durable job broker. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
from collections import deque
q=deque(["reconcile","audit"]);assert q.popleft()=="reconcile"
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** An in-process deque loses its contents if the process crashes.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the cs workshop.

**Review question:** Which data structure best models FIFO tasks? A stack follows last-in-first-out and a queue follows first-in-first-out. An in-process deque loses its contents if the process crashes.

## 7. Big-O tradeoffs and measurement

Algorithm analysis estimates growth as input expands. Sorting is often O(n log n), scanning is O(n), and a nested pairwise search is O(n²). Real performance also includes I/O, caching and database execution plans; benchmark alongside reasoning. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
def duplicates(items):
    return len(set(items)) != len(items)
assert duplicates([1,2,1])
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Big-O alone does not establish latency or suitability for tiny fixed workloads.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the cs workshop.

**Review question:** Which approach avoids a nested pairwise comparison for duplicates? Algorithm analysis estimates growth as input expands. Big-O alone does not establish latency or suitability for tiny fixed workloads.

## 8. State machines and invariants

Services move through defined states, and illegal transitions must be rejected. A transfer should progress from created to committed or rejected without reentering committed from a retry. Write transition tables and invariants before implementation. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
allowed={"created":{"committed","rejected"},"committed":set()}
assert "created" not in allowed["committed"]
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A boolean flag is not always enough to capture lifecycle and retry semantics.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the cs workshop.

**Review question:** What protects workflow integrity? Services move through defined states, and illegal transitions must be rejected. A boolean flag is not always enough to capture lifecycle and retry semantics.
