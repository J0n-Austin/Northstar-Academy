#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
bash build.sh
# localhost-only ephemeral test; no public listener.
port="$(python3 - <<'PY'
import socket
s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()
PY
)"
./build/server "$port" >build/server.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
# Startup retry is for process scheduling, not a guarantee of production networking.
for _ in $(seq 1 30); do
  if grep -q '^LISTEN' build/server.log; then break; fi
  if ! kill -0 "$pid" 2>/dev/null; then cat build/server.log; exit 1; fi
  sleep 0.05
done
if ! grep -q '^LISTEN' build/server.log; then echo 'server startup timed out'; exit 1; fi
reply="$(./build/client "$port" PING)"
[[ "$reply" == 'PONG' ]] || { echo "Expected PONG, got $reply"; exit 1; }
wait "$pid"
trap - EXIT
printf 'PASS localhost TCP server + client: %s\n' "$reply"
