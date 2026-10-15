#!/usr/bin/env bash
# Shared helpers for the task checkers.
# LAB_ROOT is the repo root (one level up from this check/ directory).
LAB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -t 1 ]; then
  GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; DIM=$'\033[0;90m'; NC=$'\033[0m'
else
  GREEN=""; RED=""; DIM=""; NC=""
fi

pass() { echo "${GREEN}PASS${NC}  $1"; }
fail() { echo "${RED}FAIL${NC}  $1"; [ -n "${2:-}" ] && echo "      ${DIM}$2${NC}"; }

# Collapse runs of whitespace, trim ends, drop blank lines.
normalize() { sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//' | grep -v '^$'; }
