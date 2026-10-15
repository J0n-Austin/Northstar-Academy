import unittest
from tests.common import test_bank,test_server,request
from app.bank import Conflict,AccessDenied

class Sprint3Tests(unittest.TestCase):
    def test_405_success_preserves_total_balance(self):
        with test_bank() as bank:
            original=sum(a['balance_cents'] for a in bank.list_accounts('alice'))
            result=bank.transfer('alice',1,2,350,'demo-405-a')
            self.assertEqual(result['replayed'],False)
            self.assertEqual(bank.get_account('alice',1)['balance_cents'],9650)
            self.assertEqual(sum(a['balance_cents'] for a in bank.list_accounts('alice')),original-350)
            self.assertEqual(bank.get_account('bob',2)['balance_cents'],15350)

    def test_405_no_negative_balance_no_partial_changes(self):
        with test_bank() as bank:
            with self.assertRaises(Conflict):bank.transfer('alice',1,2,999999,'demo-405-b')
            self.assertEqual(bank.get_account('alice',1)['balance_cents'],10000)
            self.assertEqual(bank.get_account('bob',2)['balance_cents'],15000)

    def test_405_foreign_source_denied(self):
        with test_bank() as bank:
            with self.assertRaises(AccessDenied):bank.transfer('alice',2,1,100,'demo-405-c')

    def test_406_idempotent_replay(self):
        with test_bank() as bank:
            a=bank.transfer('alice',1,2,300,'demo-406-key')
            b=bank.transfer('alice',1,2,300,'demo-406-key')
            self.assertEqual(a['transfer_id'],b['transfer_id'])
            self.assertTrue(b['replayed'])
            self.assertEqual(bank.get_account('alice',1)['balance_cents'],9700)

    def test_406_same_key_different_payload_conflict(self):
        with test_bank() as bank:
            bank.transfer('alice',1,2,300,'demo-406-other')
            with self.assertRaises(Conflict):bank.transfer('alice',1,2,400,'demo-406-other')

    def test_406_http_contract(self):
        with test_server() as (port,_):
            body={'source_id':1,'destination_id':2,'amount_cents':125,'request_key':'http-demo-key'}
            self.assertEqual(request(port,'POST','/transfers',body=body)[0],201)
            self.assertEqual(request(port,'POST','/transfers',body=body)[0],200)
