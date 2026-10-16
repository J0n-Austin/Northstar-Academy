"""Starter: sqlite3 constraints, safe queries and transactional transfer."""
import sqlite3

def make_db():
    db=sqlite3.connect(':memory:')
    db.execute('CREATE TABLE accounts(id INTEGER PRIMARY KEY, owner TEXT, cents INTEGER)') # TODO constraints
    db.executemany('INSERT INTO accounts VALUES (?,?,?)',[(1,'alice',1000),(2,'bob',500),(3,'alice',300)])
    db.commit();return db

def list_accounts(db,actor,limit=10,offset=0):
    """Authorized, ordered, bounded; reject bad limit/offset."""
    return db.execute('SELECT id, owner, cents FROM accounts ORDER BY id').fetchall() # TODO

def transfer(db,src,dst,cents,fail_after_debit=False):
    """Atomic funds movement. Raise ValueError for invalid inputs or insufficient funds."""
    db.execute('UPDATE accounts SET cents=cents-? WHERE id=?',(cents,src))
    db.commit() # TODO intentionally commits partial debit
    if fail_after_debit: raise RuntimeError('simulated credit failure')
    db.execute('UPDATE accounts SET cents=cents+? WHERE id=?',(cents,dst));db.commit()
