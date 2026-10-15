#!/usr/bin/env bash
# Run every task checker and print a score.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "Northstar — Linux Fundamentals Lab"
echo "=================================="
passed=0
total=0
for c in check/check0*.sh; do
  total=$((total + 1))
  if bash "$c"; then
    passed=$((passed + 1))
  fi
done

echo "----------------------------------"
echo "Score: $passed / $total tasks passing"
if [ "$passed" -eq "$total" ]; then
  echo "All tasks complete — nice work."
  exit 0
else
  echo "Keep going. Read the task in tasks/ and the hints in hints/ for anything still failing."
  exit 1
fi
