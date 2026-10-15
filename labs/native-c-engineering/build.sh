#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build
flags=(-std=c11 -Wall -Wextra -Wpedantic -Werror -g -O1 -fno-omit-frame-pointer -Isrc)
if [[ "${SANITIZE:-0}" == "1" ]]; then flags+=(-fsanitize=address,undefined -fno-pie -no-pie); fi
cc "${flags[@]}" src/frame.c tests/test_frame.c -o build/test_frame
cc "${flags[@]}" src/frame.c tests/smoke.c -o build/smoke
