"""Northstar demo banking service. Uses synthetic fixtures ONLY.

Training defects are deliberately present. Not a production banking service.
"""
import sqlite3


class MissingAccount(Exception):
    pass


def connect(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def initialize(db_path):
    with connect(db_path) as db:
        db.executescript('''
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY, owner TEXT NOT NULL, nickname TEXT NOT NULL,
                balance_cents INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY, owner TEXT NOT NULL, memo TEXT NOT NULL,
                amount_cents INTEGER NOT NULL
            );
        ''')
        if db.execute('SELECT COUNT(*) FROM accounts').fetchone()[0] == 0:
            db.executemany('INSERT INTO accounts VALUES (?, ?, ?, ?)', [
                (101, 'alex', 'Everyday Checking', 124500),
                (202, 'blair', 'Rent Reserve', 98250),
            ])
            db.executemany('INSERT INTO transactions VALUES (?, ?, ?, ?)', [
                (1, 'alex', 'groceries', -4250),
                (2, 'alex', 'paycheck', 200000),
                (3, 'blair', 'rent', -98500),
            ])


def account_for_user(db_path, claimed_user, account_id):
    """Return one account only when claimed_user owns it.

    NS-COM-101: the WHERE clause below is deliberately incomplete.
    """
    with connect(db_path) as db:
        row = db.execute('SELECT id, owner, nickname, balance_cents FROM accounts WHERE id = ?',
                         (account_id,)).fetchone()
        if row is None:
            raise MissingAccount('account unavailable')
        return dict(row)


def search_memos(db_path, claimed_user, term):
    """Return only the requester's memo matches. User-provided search is untrusted.

    NS-COM-102: SQL construction is deliberately unsafe. Replace it with
    safely parameterized statements, preserving LIKE search behavior.
    """
    with connect(db_path) as db:
        query = ("SELECT id, owner, memo, amount_cents FROM transactions "
                 f"WHERE owner = '{claimed_user}' AND memo LIKE '%{term}%' ORDER BY id")
        return [dict(row) for row in db.execute(query).fetchall()]
