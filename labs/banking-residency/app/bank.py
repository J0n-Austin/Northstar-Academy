"""Northstar Banking: synthetic-data exercise, not production financial software.

The HTTP identity comes from a caller-controlled demo header. Do NOT expose this
service to public networks or treat it as an authentication example.
"""
from __future__ import annotations
from contextlib import contextmanager
import sqlite3

class BankError(Exception):
    status = 400
class AccessDenied(BankError):
    status = 403
class NotFound(BankError):
    status = 404
class Conflict(BankError):
    status = 409

SCHEMA = """
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY, owner TEXT NOT NULL, balance_cents INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL, source_id INTEGER NOT NULL, destination_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL, request_key TEXT NOT NULL,
  UNIQUE(actor, request_key)
);
"""

class Bank:
    def __init__(self, db_path):
        self.db_path = str(db_path)
        self.initialize()

    @contextmanager
    def connect(self):
        con = sqlite3.connect(self.db_path, timeout=10)
        con.row_factory = sqlite3.Row
        try:
            yield con
            con.commit()
        except Exception:
            con.rollback()
            raise
        finally:
            con.close()

    def initialize(self):
        with self.connect() as db:
            db.executescript(SCHEMA)
            if db.execute('SELECT COUNT(*) FROM accounts').fetchone()[0] == 0:
                db.executemany('INSERT INTO accounts(id, owner, balance_cents) VALUES (?, ?, ?)', [
                    (1, 'alice', 10000), (2, 'bob', 15000), (3, 'alice', 5000), (4, 'charlie', 7500)])

    def health(self):
        return {'status': 'ok', 'service': 'northstar-banking', 'build': 'legacy'}  # NS-C401: release contract regression

    def list_accounts(self, actor, limit=10):
        if not actor:
            raise AccessDenied('Demo identity required')
        if limit < 1 or limit > 50:
            raise BankError('limit must be from 1 to 50')
        with self.connect() as db:
            rows = db.execute('SELECT id, owner, balance_cents FROM accounts ORDER BY id').fetchall()  # NS-C402: tenant scope and limit are missing
        return [dict(r) for r in rows]

    def get_account(self, actor, account_id):
        with self.connect() as db:
            row = db.execute('SELECT id, owner, balance_cents FROM accounts WHERE id=?', (account_id,)).fetchone()
        if row is None:
            raise NotFound('Account not found')
        # NS-C403: ownership authorization was accidentally omitted
        return dict(row)

    def search_accounts(self, actor, query):
        if not actor:
            raise AccessDenied('Demo identity required')
        if not isinstance(query, str) or len(query)>60:
            raise BankError('Invalid search')
        with self.connect() as db:
            sql=f"SELECT id, owner, balance_cents FROM accounts WHERE owner='{actor}' AND CAST(id AS TEXT) LIKE '%{query}%' ORDER BY id"  # NS-C404: unsafe concatenation
            rows=db.execute(sql).fetchall()
        return [dict(r) for r in rows]

    def transfer(self, actor, source_id, destination_id, amount_cents, request_key):
        if not actor:
            raise AccessDenied('Demo identity required')
        if not isinstance(amount_cents,int) or isinstance(amount_cents,bool) or amount_cents<=0:
            raise BankError('amount_cents must be positive integer')
        if source_id == destination_id:
            raise BankError('Accounts must differ')
        if not isinstance(request_key, str) or not (5<=len(request_key)<=80):
            raise BankError('Request key must contain 5 to 80 characters')
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            previous=db.execute('SELECT id, source_id, destination_id, amount_cents FROM transfers WHERE actor=? AND request_key=?',
                                (actor,request_key)).fetchone()
            # NS-C406: retry lookup exists, but the branch to safely replay or reject changed payloads was removed
            source=db.execute('SELECT id,owner,balance_cents FROM accounts WHERE id=?',(source_id,)).fetchone()
            destination=db.execute('SELECT id FROM accounts WHERE id=?',(destination_id,)).fetchone()
            if not source or not destination:
                raise NotFound('Account not found')
            if source['owner']!=actor:
                raise AccessDenied('Source account unavailable')
            # NS-C405: insufficient-funds check removed; find the missing invariant
            db.execute('UPDATE accounts SET balance_cents=balance_cents-? WHERE id=?',(amount_cents,source_id))
            db.execute('UPDATE accounts SET balance_cents=balance_cents+? WHERE id=?',(amount_cents,destination_id))
            row=db.execute('INSERT INTO transfers(actor,source_id,destination_id,amount_cents,request_key) VALUES (?,?,?,?,?)',
                           (actor,source_id,destination_id,amount_cents,request_key))
            return {'transfer_id':row.lastrowid,'replayed':False}

    def list_transfers(self, actor):
        if not actor:
            raise AccessDenied('Demo identity required')
        with self.connect() as db:
            rows=db.execute('SELECT id,source_id,destination_id,amount_cents FROM transfers ORDER BY id').fetchall()  # NS-C407: scope leak
        return [dict(r) for r in rows]

    def safe_audit_event(self, actor, operation, details):
        """Return structured log fields, never secrets or full request payloads."""
        return {'actor': str(actor), 'operation': str(operation), **details}  # NS-C408: copies raw payload (may contain secrets)
