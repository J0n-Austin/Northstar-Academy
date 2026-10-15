#!/usr/bin/env bash
# Reset Module 01 to its starting (broken) state. Safe to run any time.
# This is the authoritative reset: it restores the scenario's config, key,
# and historical log so you can start the units over from scratch.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

mkdir -p etc/telemetryd.d var/log answers

# --- base configuration (ships with a bad interval; Unit 2 fixes it) ---
cat > etc/telemetryd.conf <<'CONF'
# telemetryd base configuration
endpoint  = https://telemetry.northstar.internal/v1/ingest
interval  = 0
key_file  = etc/telemetryd.key
max_batch = 250
CONF

# --- override added during a past incident (the Unit 3 root cause) ---
cat > etc/telemetryd.d/90-local.conf <<'CONF'
# added 2027-02 during the ingest backlog incident — review before keeping
max_batch = 100000
CONF

# --- simulated signing key, deliberately world-readable (Unit 2 fixes perms) ---
cat > etc/telemetryd.key <<'KEY'
# Northstar telemetry signing key (SIMULATED — not a real secret)
NORTHSTAR_TELEMETRY_KEY=sim-train-0000-not-real
KEY
chmod 644 etc/telemetryd.key

# --- historical incident log (read-only reference for Unit 1) ---
cat > var/log/telemetryd.log <<'LOG'
2027-02-11T06:02:14Z INFO  telemetryd boot sequence begin host=plt-ingest-3
2027-02-11T06:02:14Z INFO  loaded config endpoint=https://telemetry.northstar.internal/v1/ingest
2027-02-11T06:02:15Z INFO  healthy interval=15s batch=250
2027-02-11T09:41:02Z WARN  ingest latency rising p95=820ms
2027-02-11T09:58:37Z ERROR start failed E_LOAD: max_batch 100000 exceeds the safe limit of 500 under load
2027-02-11T10:03:11Z INFO  operator applied override etc/telemetryd.d/90-local.conf
2027-02-11T10:03:12Z ERROR start failed E_LOAD: max_batch 100000 exceeds the safe limit of 500 under load
2027-02-12T22:14:49Z WARN  disk usage on /var above 80 percent
2027-02-13T01:20:05Z ERROR start failed E_CONF_INTERVAL: interval must be a positive integer (got '0')
2027-02-13T08:30:41Z INFO  config edited by apprentice onboarding script
2027-02-13T08:31:00Z ERROR start failed E_PERM: key file etc/telemetryd.key must be mode 600, found 644
LOG

rm -f var/log/telemetryd.runtime.log
[ -f answers/.gitkeep ] || touch answers/.gitkeep
chmod +x bin/telemetryd run-checks.sh check/*.sh 2>/dev/null || true

echo "Module 01 reset. The telemetry agent is currently DOWN."
echo "Start with units/01-read-the-system.md"
echo "Run 'bash run-checks.sh' any time to see your progress."
