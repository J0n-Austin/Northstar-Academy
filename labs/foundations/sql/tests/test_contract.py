import unittest,sqlite3
from starter import make_db,list_accounts,transfer
class Contracts(unittest.TestCase):
    def setUp(self):self.db=make_db()
    def tearDown(self):self.db.close()
    def balance(self,id):return self.db.execute('SELECT cents FROM accounts WHERE id=?',(id,)).fetchone()[0]
    def test_only_actor_rows(self):self.assertEqual([r[0] for r in list_accounts(self.db,'alice')],[1,3])
    def test_stable_limit_offset(self):self.assertEqual([r[0] for r in list_accounts(self.db,'alice',1,1)],[3])
    def test_injection_is_data(self):self.assertEqual(list_accounts(self.db,"alice' OR 1=1 --"),[])
    def test_invalid_paging(self):
        for limit,offset in [(0,0),(1000,0),(1,-1)]:
            with self.subTest(limit=limit,offset=offset),self.assertRaises(ValueError):list_accounts(self.db,'alice',limit,offset)
    def test_nonnegative_constraint(self):
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute('UPDATE accounts SET cents=-1 WHERE id=1')
    def test_transfer_moves_cents(self):transfer(self.db,1,2,200);self.assertEqual((self.balance(1),self.balance(2)),(800,700))
    def test_insufficient_funds_unchanged(self):
        with self.assertRaises(ValueError):transfer(self.db,1,2,9999)
        self.assertEqual((self.balance(1),self.balance(2)),(1000,500))
    def test_failure_rolls_back_both(self):
        with self.assertRaises(RuntimeError):transfer(self.db,1,2,200,fail_after_debit=True)
        self.assertEqual((self.balance(1),self.balance(2)),(1000,500))
    def test_invalid_destination(self):
        with self.assertRaises(ValueError):transfer(self.db,1,999,100)
        self.assertEqual(self.balance(1),1000)
