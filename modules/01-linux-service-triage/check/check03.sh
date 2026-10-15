#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
rca="$MOD/answers/03-rca.md"
okstress=0; okrca=0

if bash "$MOD/bin/telemetryd" --stress >/dev/null 2>&1; then okstress=1; fi

if [ -f "$rca" ]; then
  low="$(tr A-Z a-z < "$rca")"
  has_cause=$(echo "$low" | grep -cE 'root cause');
  has_ev=$(echo "$low" | grep -cE 'evidence');
  has_fix=$(echo "$low" | grep -cE 'fix|resolution');
  has_prev=$(echo "$low" | grep -cE 'prevent');
  names_issue=$(echo "$low" | grep -cE 'max_batch|telemetryd\.d|override');
  if [ "$has_cause" -gt 0 ] && [ "$has_ev" -gt 0 ] && [ "$has_fix" -gt 0 ] && [ "$has_prev" -gt 0 ] && [ "$names_issue" -gt 0 ]; then
    okrca=1
  fi
fi

if [ "$okstress" = 1 ] && [ "$okrca" = 1 ]; then
  pass "Unit 3 — load failure resolved and root cause documented"
  exit 0
fi
msg=""
[ "$okstress" = 0 ] && msg="telemetryd --stress still fails (find what it drops under load). "
[ "$okrca" = 0 ] && msg="${msg}answers/03-rca.md needs root cause, evidence, fix, prevention, and must name the actual setting."
fail "Unit 3" "${msg}See hints/03.md"
exit 1
