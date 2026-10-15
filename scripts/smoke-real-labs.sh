#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for lab in native-c-engineering posix-protocol commercial-api-security commercial-transaction-integrity banking-residency; do
  echo "==> $lab (functional fixture + intended starter defects)"
  bash "$ROOT/labs/$lab/smoke-test.sh"
done
