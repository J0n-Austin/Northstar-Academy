#!/usr/bin/env bash
# Grade every unit in order and print progress.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
echo "Northstar — Module 01 · Linux Service Triage"
echo "============================================"
labels=("Unit 1 · Read the system" "Unit 2 · Make it start" "Unit 3 · Investigate the load failure" "Milestone · Incident report")
scripts=(check/check01.sh check/check02.sh check/check03.sh check/check-milestone.sh)
passed=0
for i in "${!scripts[@]}"; do
  bash "${scripts[$i]}" && passed=$((passed+1))
done
echo "--------------------------------------------"
echo "Progress: $passed / ${#scripts[@]} complete"
[ "$passed" -eq "${#scripts[@]}" ] && echo "Module complete — telemetryd is healthy and the incident is written up." \
  || echo "Keep going. Open the current unit in units/ and its hint in hints/."
[ "$passed" -eq "${#scripts[@]}" ] && exit 0 || exit 1
