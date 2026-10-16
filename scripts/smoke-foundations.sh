#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for unit in python http sql testing debugging cs linux networking data-structures architecture; do
  echo "==> foundations/${unit}: smoke and intentional starter failures"
  bash "labs/foundations/${unit}/smoke-test.sh" >/dev/null
  if bash "labs/foundations/${unit}/run-checks.sh" > /tmp/ns-foundations-contracts-$$.log 2>&1; then
    echo "ERROR: starter's learning tests unexpectedly passed: ${unit}" >&2
    rm -f /tmp/ns-foundations-contracts-$$.log
    exit 1
  fi
  if ! grep -qE '^(FAILED \(|ERROR:|FAIL:)' /tmp/ns-foundations-contracts-$$.log; then
    echo "ERROR: workshop failed for an infrastructure issue rather than test assertions: ${unit}" >&2
    cat /tmp/ns-foundations-contracts-$$.log >&2
    rm -f /tmp/ns-foundations-contracts-$$.log
    exit 1
  fi
  rm -f /tmp/ns-foundations-contracts-$$.log
  echo "PASS ${unit}: runnable smoke; defect reproduced by real tests"
done
