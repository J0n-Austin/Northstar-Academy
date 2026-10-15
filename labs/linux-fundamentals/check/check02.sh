#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ans="$LAB_ROOT/answers/02.txt"
if [ ! -f "$ans" ]; then
  fail "Task 2" "answers/02.txt not found. See hints/02.md"
  exit 1
fi

expected=$(grep -w ERROR "$LAB_ROOT/scenario/logs/app.log" \
  | grep -oE 'code=E[0-9]+' | sed 's/code=//' \
  | sort | uniq -c | sort -rn | head -3 | awk '{print $2, $1}')

exp_tmp=$(mktemp); got_tmp=$(mktemp)
printf '%s\n' "$expected" | normalize > "$exp_tmp"
normalize < "$ans" > "$got_tmp"

if diff -q "$exp_tmp" "$got_tmp" >/dev/null; then
  pass "Task 2 — top 3 error codes ranked"
  rm -f "$exp_tmp" "$got_tmp"; exit 0
else
  fail "Task 2" "ranking doesn't match (need 3 lines, 'CODE COUNT', highest first). See hints/02.md"
  rm -f "$exp_tmp" "$got_tmp"; exit 1
fi
