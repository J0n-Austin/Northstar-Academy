#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
rep="$MOD/answers/incident-report.md"
okhealth=0; okrep=0

if bash "$MOD/bin/telemetryd" --check >/dev/null 2>&1 && bash "$MOD/bin/telemetryd" --stress >/dev/null 2>&1; then
  okhealth=1
fi

if [ -f "$rep" ]; then
  low="$(tr A-Z a-z < "$rep")"
  sections=0
  for s in summary 'impact' 'root cause' 'resolution' 'prevention'; do
    echo "$low" | grep -qE "$s" && sections=$((sections+1))
  done
  # must reference at least two of the three root causes fixed during triage
  causes=0
  echo "$low" | grep -qE 'interval' && causes=$((causes+1))
  echo "$low" | grep -qE 'permission|mode 600|0600|chmod' && causes=$((causes+1))
  echo "$low" | grep -qE 'max_batch|override|telemetryd\.d' && causes=$((causes+1))
  [ "$sections" -ge 5 ] && [ "$causes" -ge 2 ] && okrep=1
fi

if [ "$okhealth" = 1 ] && [ "$okrep" = 1 ]; then
  pass "Milestone — service fully healthy and incident reported to standard"
  exit 0
fi
msg=""
[ "$okhealth" = 0 ] && msg="service must pass BOTH --check and --stress. "
[ "$okrep" = 0 ] && msg="${msg}answers/incident-report.md needs the five sections (Summary, Impact, Root cause, Resolution, Prevention) and must cover at least two of the three root causes."
fail "Milestone" "${msg}See hints/milestone.md"
exit 1
