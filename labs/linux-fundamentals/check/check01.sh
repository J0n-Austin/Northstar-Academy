#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ans="$LAB_ROOT/answers/01.txt"
expected=$(grep -h -w ERROR "$LAB_ROOT"/scenario/logs/*.log | grep -i -c timeout)

if [ ! -f "$ans" ]; then
  fail "Task 1" "answers/01.txt not found — write your number there. See hints/01.md"
  exit 1
fi

got=$(tr -cd '0-9' < "$ans")
if [ "$got" = "$expected" ]; then
  pass "Task 1 — timeout errors counted"
  exit 0
else
  fail "Task 1" "got '${got:-<empty>}', which isn't the expected count. See hints/01.md"
  exit 1
fi
