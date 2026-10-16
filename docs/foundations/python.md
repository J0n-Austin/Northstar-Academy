# Python engineering: from syntax to maintainable services

## What you will build

Read and extend a small backend service without relying on a framework to conceal basic behavior. You will write value-validation functions, group records, preserve caller-owned data and calculate predictable results. The goal is not memorizing syntax; it is understanding what a function promises its callers and what happens when the promise is broken.

## 1. Data has a shape and a contract

Python is dynamically typed, but backend APIs still have types. An account identifier is a positive integer; a transfer amount is a positive integer measured in cents; an actor is an authenticated identity in a production service (the residency demo instead uses an untrusted header). When a request arrives as JSON, its shape is not guaranteed. A client may send `null`, a list, a decimal, a negative number, or a string where a number was expected.

Write down the contract *before* implementing it: (1) accepted inputs, (2) output type and meaning, (3) failure conditions, (4) mutation policy. For example, a function parsing an account ID may accept only positive `int` values and reject `bool`, even though `isinstance(True, int)` is true. If it raises `ValueError`, the HTTP adapter should translate that into a consistent client error. A silent default can accidentally select the wrong account.

## 2. Values, references and unintended side effects

Numbers, strings and tuples cannot be mutated in place. Lists, sets and dictionaries can. Assigning `copy = account` does not copy the dictionary: both names refer to the same mapping. A shallow copy with `dict(account)` duplicates the outer mapping but not nested mutable members. Before returning records to a client, construct an explicit public representation. Do not remove confidential fields from a shared dictionary in place; a mutation could affect later requests.

```python
private = {"id": 7, "owner": "alice", "cents": 1000}
public = {"id": private["id"], "cents": private["cents"]}
assert "owner" not in public
```

This is *data minimization*, not authorization. Authorization must still happen before any private account is retrieved or serialized. Explain the difference to a reviewer.

## 3. Function boundaries and errors

Separate parsing, business rules and persistence. The HTTP layer answers what was requested and which status to send. Business functions answer whether a transfer is allowed. Data-access functions answer which rows are fetched and updated. This separation enables unit tests that do not open a network socket. An exception indicates a broken assumption or rejected input; catching every exception and returning an empty list disguises programmer errors as legitimate results.

Before changing `app/bank.py`, trace the call from `app/server.py`. Identify where untrusted client input is transformed into an internal value. Annotate which functions can raise and which are allowed to modify persistent state. Use `python3 -m pdb` or strategically placed local diagnostic output when debugging; never leave customer details in a production log.

## 4. Choosing a data structure

Lists preserve sequence and allow index access. Dictionaries provide average constant-time key lookup. Sets give efficient membership checks. A common mistake is using nested list searches to count records: the program works for five accounts but becomes slow for large datasets. Ask what operation dominates the algorithm. For n records, one pass with a dictionary is expected O(n); a scan of all earlier records per entry is O(n²).

## 5. Guided practice

1. Run `python3 -m unittest discover -s tests -v` from `labs/foundations/python`; record the initial failing contract.
2. Implement validation, grouping and safe-copy behavior in `starter.py`; rerun after each change.
3. Add two tests for malformed records and demonstrate that input data is not mutated.
4. Explain why a `dict` was preferable to repeated linear searches, and where a deep copy might be necessary.
5. Open residency ticket NS-C401 and trace an incoming request through both layers before writing code.

## Reflection and engineering handoff

A pull request is not complete because tests turn green. Describe what you changed, why the interface remains stable, and which negative tests cover the edge cases. State any assumptions (e.g., IDs are already parsed integers) and avoid making claims about security that the tests do not support. When you're ready, approach the first residency sprint as an unfamiliar service rather than simply retyping a worked example.

## Case study: a customer account appears to change after reading it

**Incoming ticket:** A support engineer reports that a GET operation sometimes removes the `owner` field from a cached internal account record. The customer response is supposed to omit private fields, so a junior developer previously wrote `account.pop('owner')` before sending JSON. The call works the first time but mutates the in-memory dictionary used by a subsequent request.

**Reproduce:** Create `record = {'id': 7, 'owner': 'alice', 'cents': 200}`. Call the serializer twice. After the first call, inspect `record.keys()`. Is the bug in the HTTP handler or in the transformation function? The observable defect is *shared state mutation*; the trigger is serialization. Explain why a unit test that only inspects the first response can miss the failure.

**Reason about alternatives:** (A) Copy the dictionary and delete restricted keys, (B) construct an explicit allowlisted public dictionary, (C) return the original reference. B is usually safest because newly introduced confidential fields will not automatically become public. A shallow copy may still share nested lists; a deep copy may cost more and still fail to implement correct authorization. None of the options removes the need to check the requester's permissions before fetching data.

**Mini experiment:** Make a list of three account records. Aggregate balances by owner using a dictionary rather than searching all earlier results for each record. Estimate time as a function of n accounts and k owners. Check that an empty list returns `{}` and a malformed account raises rather than silently being skipped. Add tests that verify input order and dictionaries are unchanged before/after. A reviewer should be able to reconstruct the before-and-after behavior using only your test output and code diff.

**Residency handoff:** Find the path from a GET request in `app/server.py` into `app/bank.py`. Draw three boxes (input parsing, domain logic, persistence). Which boundary is responsible for validation? Which is responsible for authorization? Which is responsible for formatting the outgoing JSON? Write a short design note before modifying NS-C401 or NS-C402.


# Extended engineering lessons · Stage 4.1A

## 5. Iterators and generators

An iterator yields one item at a time instead of materializing a full collection. This enables bounded-memory processing of large transaction logs, but iterators can be exhausted; do not accidentally traverse the same stream twice. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
transactions = (line.strip() for line in [" debit "," credit "]); print(next(transactions))
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A generator expression is lazy; it is not a list and has no guaranteed rewind.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the python workshop.

**Review question:** Why can a transaction-log generator save memory? An iterator yields one item at a time instead of materializing a full collection. A generator expression is lazy; it is not a list and has no guaranteed rewind.

## 6. Type hints and validation

Type annotations help reviewers and static tools understand interfaces, but Python does not enforce them at runtime. Untrusted JSON must still be parsed and validated. Avoid conflating bool and int or silently coercing string amounts into numeric financial values. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
def cents(amount: int) -> int:
    if type(amount) is not int or amount <= 0: raise ValueError("amount")
    return amount
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A type hint does not validate an API request by itself.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the python workshop.

**Review question:** What does amount: int do at runtime? Type annotations help reviewers and static tools understand interfaces, but Python does not enforce them at runtime. A type hint does not validate an API request by itself.

## 7. Context managers and resources

Files and database connections are limited resources. A context manager makes cleanup predictable when an exception interrupts a procedure; it does not automatically make unrelated database operations atomic. Understand what an object’s __exit__ actually guarantees. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
from contextlib import closing
with closing(open("/dev/null")) as stream:
    assert stream.read() == ""
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A with statement only offers guarantees implemented by the context manager.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the python workshop.

**Review question:** What is the key role of a context manager? Files and database connections are limited resources. A with statement only offers guarantees implemented by the context manager.

## 8. Dependency injection and testing seams

A function that reads its own environment, opens its own database and sends HTTP requests is difficult to test. Inject boundaries such as a repository or clock so tests can provide safe fakes. Keep business policy separate from transport or persistence details. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
def account_label(repository, owner):
    return repository.find_label(owner)
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Injection is not the same as exposing internal mutable state to callers.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the python workshop.

**Review question:** Which design most directly improves test isolation? A function that reads its own environment, opens its own database and sends HTTP requests is difficult to test. Injection is not the same as exposing internal mutable state to callers.
