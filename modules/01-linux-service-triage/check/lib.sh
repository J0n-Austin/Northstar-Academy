#!/usr/bin/env bash
# Shared helpers for Module 01 checkers. MOD is the module root.
MOD="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -t 1 ]; then
  GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; DIM=$'\033[0;90m'; NC=$'\033[0m'
else GREEN=""; RED=""; DIM=""; NC=""; fi
pass(){ echo "${GREEN}PASS${NC}  $1"; }
fail(){ echo "${RED}FAIL${NC}  $1"; [ -n "${2:-}" ] && echo "      ${DIM}$2${NC}"; }
# value of a key=value line in a config file
conf_val(){ grep -iE "^[[:space:]]*$2[[:space:]]*=" "$1" | tail -1 | sed -E 's/^[^=]*=[[:space:]]*//' | xargs; }
