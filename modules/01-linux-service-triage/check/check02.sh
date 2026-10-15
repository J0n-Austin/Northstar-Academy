#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
if bash "$MOD/bin/telemetryd" --check >/dev/null 2>&1; then
  pass "Unit 2 — telemetryd starts cleanly (--check healthy)"
  exit 0
else
  err="$(bash "$MOD/bin/telemetryd" --check 2>&1 | tail -1 | sed 's/^ *//')"
  fail "Unit 2" "telemetryd --check still fails: ${err}  See hints/02.md"
  exit 1
fi
