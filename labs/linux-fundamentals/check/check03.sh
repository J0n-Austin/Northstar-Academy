#!/usr/bin/env bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ans="$LAB_ROOT/answers/03.txt"
if [ ! -f "$ans" ]; then
  fail "Task 3" "answers/03.txt not found. See hints/03.md"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  fail "Task 3" "jq is not installed in this environment (the devcontainer installs it)."
  exit 1
fi

expected=$(jq -r '.services[] | select(.state == "degraded") | .name' \
  "$LAB_ROOT/scenario/service/status.json" | sort)

exp_tmp=$(mktemp); got_tmp=$(mktemp)
printf '%s\n' "$expected" | normalize | sort > "$exp_tmp"
normalize < "$ans" | sort > "$got_tmp"

if diff -q "$exp_tmp" "$got_tmp" >/dev/null; then
  pass "Task 3 — degraded services listed"
  rm -f "$exp_tmp" "$got_tmp"; exit 0
else
  fail "Task 3" "names don't match the degraded set. See hints/03.md"
  rm -f "$exp_tmp" "$got_tmp"; exit 1
fi
