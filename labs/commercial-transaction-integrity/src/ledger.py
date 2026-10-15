"""Synthetic transfer ledger. Deliberate starter defects: duplicate and partial debit.

No external payment providers, credentials, or real accounts.
"""
import sqlite3


class TransferRejected(Exception):
    pass


def connect(path):
    return sqlite3.connect(path, timeout=4)


def initialize(path):
    with connect(path) as db:
        db.executescript('''
            CREATE TABLE IF NOT EXISTS accounts (
              account_id TEXT PRIMARY KEY, balance_cents INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS movements (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              request_id TEXT NOT NULL, source TEXT NOT NULL, destination TEXT NOT NULL,
              amount_cents INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS transfer_requests (
              request_id TEXT PRIMARY KEY, source TEXT NOT NULL, destination TEXT NOT NULL,
              amount_cents INTEGER NOT NULL
            );
        ''')
        if db.execute('SELECT COUNT(*) FROM accounts').fetchone()[0] == 0:
            db.executemany('INSERT INTO accounts VALUES (?, ?)', [('A-100', 50000), ('B-200', 10000)])


def balances(path):
    with connect(path) as db:
        return dict(db.execute('SELECT account_id, balance_cents FROM accounts ORDER BY account_id'))


def transfer(path, source, destination, amount_cents, request_id, fail_after_debit=False):
    """Move cents atomically; same request ID with same args must only apply once.

    NS-COM-201: this starter omits idempotency tracking.
    NS-COM-202: the debit commit occurs before the credit and audit insert.
    """
    if not isinstance(amount_cents, int) or isinstance(amount_cents, bool) or amount_cents <= 0:
        raise TransferRejected('invalid amount')
    if not isinstance(request_id, str) or not request_id.strip():
        raise TransferRejected('invalid request id')
    if source == destination:
        raise TransferRejected('source and destination must differ')

    with connect(path) as db:
        src_row = db.execute('SELECT balance_cents FROM accounts WHERE account_id = ?', (source,)).fetchone()
        dst_row = db.execute('SELECT balance_cents FROM accounts WHERE account_id = ?', (destination,)).fetchone()
        if not src_row or not dst_row:
            raise TransferRejected('unknown account')
        if src_row[0] < amount_cents:
            raise TransferRejected('insufficient funds')

        db.execute('UPDATE accounts SET balance_cents = balance_cents - ? WHERE account_id = ?',
                   (amount_cents, source))
        db.commit()  # Deliberate defect: early commit can leave balances inconsistent.
        if fail_after_debit:
            raise RuntimeError('simulated failure after debit')
        db.execute('UPDATE accounts SET balance_cents = balance_cents + ? WHERE account_id = ?',
                   (amount_cents, destination))
        db.execute('INSERT INTO movements (request_id, source, destination, amount_cents) VALUES (?, ?, ?, ?)',
                   (request_id, source, destination, amount_cents))
    return {'request_id': request_id, 'status': 'applied'}
