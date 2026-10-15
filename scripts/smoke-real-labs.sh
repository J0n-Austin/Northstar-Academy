#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for lab in native-c-engineering posix-protocol; do
  echo "==> $lab (expected starter defect and functional smoke test)"
  bash "$ROOT/labs/$lab/smoke-test.sh"
done
