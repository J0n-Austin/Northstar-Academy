import os
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from bank import MissingAccount, account_for_user, initialize, search_memos


class SecureApiContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = os.path.join(self.temp.name, 'bank.sqlite')
        initialize(self.db)

    def tearDown(self):
        self.temp.cleanup()

    def test_01_owner_can_read_own_account(self):
        self.assertEqual(account_for_user(self.db, 'alex', 101)['balance_cents'], 124500)

    def test_02_unknown_account_is_hidden(self):
        with self.assertRaises(MissingAccount):
            account_for_user(self.db, 'alex', 999)

    def test_03_bola_non_owner_must_not_read_account(self):
        with self.assertRaises(MissingAccount):
            account_for_user(self.db, 'alex', 202)

    def test_04_search_happy_path(self):
        self.assertEqual([x['memo'] for x in search_memos(self.db, 'alex', 'grocer')], ['groceries'])

    def test_05_search_quote_is_literal_not_sql(self):
        self.assertEqual(search_memos(self.db, 'alex', "' OR 1=1 --"), [])

    def test_06_search_cannot_cross_user_boundary(self):
        self.assertTrue(all(x['owner'] == 'alex' for x in search_memos(self.db, 'alex', '')))

    def test_07_fixture_is_synthetic(self):
        with sqlite3.connect(self.db) as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM accounts').fetchone()[0], 2)


if __name__ == '__main__':
    unittest.main()
