#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
ans="$MOD/answers/01.txt"
if [ ! -f "$ans" ]; then
  fail "Unit 1" "answers/01.txt not found. Report the three facts there. See hints/01.md"; exit 1
fi
get(){ grep -iE "^[[:space:]]*$1[[:space:]]*=" "$ans" | head -1 | sed -E 's/^[^=]*=[[:space:]]*//' | xargs; }

got_fs="$(get failed_starts)"; got_le="$(get latest_error | tr a-z A-Z)"; got_ep="$(get endpoint)"
exp_fs="$(grep -c 'start failed' "$MOD/var/log/telemetryd.log")"
exp_le="$(grep 'ERROR' "$MOD/var/log/telemetryd.log" | tail -1 | grep -oE 'E_[A-Z_]+' | head -1)"
exp_ep="$(conf_val "$MOD/etc/telemetryd.conf" endpoint)"

ok=1
[ "$got_fs" = "$exp_fs" ] || { ok=0; miss="failed_starts"; }
[ "$got_le" = "$exp_le" ] || { ok=0; miss="${miss:+$miss, }latest_error"; }
[ "$got_ep" = "$exp_ep" ] || { ok=0; miss="${miss:+$miss, }endpoint"; }

if [ "$ok" = 1 ]; then
  pass "Unit 1 — system state reported correctly"
  exit 0
else
  fail "Unit 1" "check these values: ${miss}. See hints/01.md"; exit 1
fi
