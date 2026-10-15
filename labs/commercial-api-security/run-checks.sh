#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export PYTHONDONTWRITEBYTECODE=1
PYTHONPATH=src python3 -m unittest discover -s tests -p 'test_*.py' -v
