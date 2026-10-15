#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

key="$LAB_ROOT/scenario/secrets/service.key"
if [ ! -f "$key" ]; then
  fail "Task 4" "scenario/secrets/service.key is missing — run bash setup.sh to reset the lab."
  exit 1
fi

# GNU stat (Linux) uses -c '%a'; BSD/macOS stat uses -f '%Lp'.
mode=$(stat -c '%a' "$key" 2>/dev/null || stat -f '%Lp' "$key" 2>/dev/null)

if [ "$mode" = "600" ]; then
  pass "Task 4 — key is owner-only (600)"
  exit 0
else
  fail "Task 4" "mode is ${mode:-unknown}, expected 600 (-rw-------). See hints/04.md"
  exit 1
fi
