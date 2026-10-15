#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export PYTHONDONTWRITEBYTECODE=1
python3 - "$ROOT" <<'PY'
import os,sys,tempfile
sys.path.insert(0, os.path.join(sys.argv[1],'src'))
from ledger import initialize,balances,transfer
with tempfile.TemporaryDirectory() as tmp:
    path = os.path.join(tmp,'ledger.db')
    initialize(path)
    assert sum(balances(path).values()) == 60000
    transfer(path,'A-100','B-200',1000,'same')
    assert balances(path) == {'A-100':49000,'B-200':11000}
    transfer(path,'A-100','B-200',1000,'same')
    assert balances(path) == {'A-100':48000,'B-200':12000}, 'starter idempotency defect missing'
    before = balances(path)
    try:
        transfer(path,'A-100','B-200',1000,'crash',fail_after_debit=True)
    except RuntimeError:
        pass
    else:
        raise AssertionError('injected exception did not fire')
    assert sum(balances(path).values()) == sum(before.values())-1000, 'starter atomicity defect missing'
print('PASS synthetic finance fixture + expected idempotency/atomicity defects')
PY
