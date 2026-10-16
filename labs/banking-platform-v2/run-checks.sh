#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 -m pytest tests/test_smoke.py tests/test_contract.py -q
