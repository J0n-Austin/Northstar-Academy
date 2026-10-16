# Linux, processes & development environments

Process lifecycle, permissions, configuration and safe command execution are core workplace requirements. Learners reproduce faults with actual Python subprocesses and demonstrate resource cleanup.

## Learning environment

Use a local Python 3 runtime, avoid production secrets, and document input and output for every claim. The learner workshop deliberately starts with defects and its contract tests are meant to fail until repaired. Never expose training services on a public interface.


# Extended engineering lessons · Stage 4.1A

## 5. Environment and configuration

Environment variables configure development services but are not a secure secret store. Treat configuration as explicit, validate required settings at startup, and use separate test values. Never write production keys into example repositories. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import os
mode=os.environ.get("NORTHSTAR_MODE","development")
assert isinstance(mode,str)
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** Reading a secret from an environment variable does not make it safe to log.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the linux workshop.

**Review question:** Which action improves configuration safety? Environment variables configure development services but are not a secure secret store. Reading a secret from an environment variable does not make it safe to log.

## 6. Reproducible developer environments

A clean setup document should bring a teammate to a passing baseline without undocumented global packages. Pin versions, explain run commands and isolate test data. Containers and Codespaces help but do not replace documentation and offline understanding. In production work, write down the preconditions, expected behavior and observable failure before editing code. Use a small reproducible example to challenge your assumptions, then turn a demonstrated failure into a regression test.

### Worked example

```python
import sys
assert sys.version_info.major==3
```

Execute the example, predict its output, and change one boundary condition to determine which guarantee remains valid. Compare observed behavior with the contract and describe where the policy is enforced. This connects directly to a Northstar ticket rather than merely testing syntax.

**Watch out:** A developer environment that only runs on its author’s machine is not reproducible.

**Practice:** Run the worked example, change one input to trigger a boundary case, and explain the result before completing the linux workshop.

**Review question:** What indicates reproducible onboarding? A clean setup document should bring a teammate to a passing baseline without undocumented global packages. A developer environment that only runs on its author’s machine is not reproducible.
