#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../labs/banking-platform-v2"
python3 -m pytest tests/test_smoke.py -q
