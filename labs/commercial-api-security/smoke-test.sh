#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export PYTHONDONTWRITEBYTECODE=1
python3 - "$ROOT" <<'PY'
import os, sys, tempfile
sys.path.insert(0, os.path.join(sys.argv[1], 'src'))
from bank import initialize, account_for_user, search_memos
with tempfile.TemporaryDirectory() as tmp:
    db = os.path.join(tmp, 'demo.db')
    initialize(db)
    assert account_for_user(db, 'alex', 101)['owner'] == 'alex'
    assert [r['memo'] for r in search_memos(db, 'alex', 'grocer')] == ['groceries']
print('PASS commercial API fixture + normal behavior')
PY
# This is the training fixture, and must expose both seeded mistakes.
python3 - "$ROOT" <<'PY'
import os, sys, tempfile
sys.path.insert(0, os.path.join(sys.argv[1], 'src'))
from bank import initialize, account_for_user, search_memos
with tempfile.TemporaryDirectory() as tmp:
    db = os.path.join(tmp, 'demo.db')
    initialize(db)
    assert account_for_user(db, 'alex', 202)['owner'] == 'blair', 'starter BOLA defect missing'
    leaked = search_memos(db, 'alex', "' OR 1=1 --")
    assert any(item['owner'] == 'blair' for item in leaked), 'starter SQL defect missing'
print('PASS expected starter defects are reproducible')
PY
