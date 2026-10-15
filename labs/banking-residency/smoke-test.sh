#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'PY'
import tempfile
from pathlib import Path
from app.bank import Bank
from app.server import start
with tempfile.TemporaryDirectory() as tmp:
    bank=Bank(Path(tmp)/'smoke.sqlite3')
    with bank.connect() as con:
        assert con.execute('SELECT COUNT(*) FROM accounts').fetchone()[0]==4
    http=start(port=0,database=str(Path(tmp)/'http.sqlite3'))
    try: assert http.server_address[0]=='127.0.0.1'
    finally: http.server_close()
print('PASS banking residency local-only start, seed, imports')
PY
