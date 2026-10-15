#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
bash build.sh
./build/test_io
