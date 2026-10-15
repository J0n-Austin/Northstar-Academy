#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build
flags=(-std=c11 -Wall -Wextra -Wpedantic -Werror -g -O0 -Isrc)
if [[ "${SANITIZE:-0}" == "1" ]]; then flags+=(-fsanitize=address,undefined -fno-pie -no-pie); fi
cc "${flags[@]}" src/io.c src/server.c -o build/server
cc "${flags[@]}" src/io.c src/client.c -o build/client
cc "${flags[@]}" src/io.c tests/test_io.c -o build/test_io
cc "${flags[@]}" src/io.c tests/smoke.c -o build/smoke
