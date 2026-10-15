import os
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from ledger import TransferRejected, balances, initialize, transfer


class TransferContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = os.path.join(self.temp.name, 'ledger.db')
        initialize(self.db)

    def tearDown(self):
        self.temp.cleanup()

    def test_01_initial_balances(self):
        self.assertEqual(balances(self.db), {'A-100': 50000, 'B-200': 10000})

    def test_02_single_transfer_moves_exact_cents(self):
        self.assertEqual(transfer(self.db, 'A-100', 'B-200', 2000, 'tx-1')['status'], 'applied')
        self.assertEqual(balances(self.db), {'A-100': 48000, 'B-200': 12000})

    def test_03_no_negative_or_zero_amount(self):
        for amount in (0, -1):
            with self.subTest(amount=amount):
                with self.assertRaises(TransferRejected):
                    transfer(self.db, 'A-100', 'B-200', amount, 'tx-a')

    def test_04_overdraft_rejected(self):
        with self.assertRaises(TransferRejected):
            transfer(self.db, 'A-100', 'B-200', 999999, 'tx-overdraft')
        self.assertEqual(balances(self.db)['A-100'], 50000)

    def test_05_repeat_request_is_idempotent(self):
        transfer(self.db, 'A-100', 'B-200', 7000, 'same-req')
        transfer(self.db, 'A-100', 'B-200', 7000, 'same-req')
        self.assertEqual(balances(self.db), {'A-100': 43000, 'B-200': 17000})
        with sqlite3.connect(self.db) as conn:
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM movements').fetchone()[0], 1)

    def test_06_same_key_different_payload_rejected(self):
        transfer(self.db, 'A-100', 'B-200', 1000, 'fixed-key')
        with self.assertRaises(TransferRejected):
            transfer(self.db, 'A-100', 'B-200', 2000, 'fixed-key')

    def test_07_fail_after_debit_rolls_back_everything(self):
        before = balances(self.db)
        with self.assertRaises(RuntimeError):
            transfer(self.db, 'A-100', 'B-200', 4000, 'crash-req', fail_after_debit=True)
        self.assertEqual(balances(self.db), before)
        with sqlite3.connect(self.db) as conn:
            self.assertEqual(conn.execute('SELECT COUNT(*) FROM movements').fetchone()[0], 0)

    def test_08_fail_then_retry_applies_once(self):
        with self.assertRaises(RuntimeError):
            transfer(self.db, 'A-100', 'B-200', 4000, 'retry-req', fail_after_debit=True)
        transfer(self.db, 'A-100', 'B-200', 4000, 'retry-req')
        self.assertEqual(balances(self.db), {'A-100': 46000, 'B-200': 14000})

    def test_09_total_value_is_conserved(self):
        transfer(self.db, 'A-100', 'B-200', 1234, 'simple')
        self.assertEqual(sum(balances(self.db).values()), 60000)


if __name__ == '__main__':
    unittest.main()
