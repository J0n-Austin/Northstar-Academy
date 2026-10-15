import unittest
from tests.common import test_bank, test_server, request
from app.bank import BankError

class Sprint1Tests(unittest.TestCase):
    def test_401_health_contract_and_no_sensitive_info(self):
        with test_server() as (port,_):
            code,health=request(port,'GET','/health')
            self.assertEqual(code,200)
            self.assertEqual(health,{'status':'ok','service':'northstar-banking','build':'stage4'})

    def test_402_account_listing_is_tenant_scoped(self):
        with test_bank() as bank:
            self.assertEqual([a['id'] for a in bank.list_accounts('alice')],[1,3])
            self.assertEqual([a['id'] for a in bank.list_accounts('bob')],[2])

    def test_402_account_limit_and_validation(self):
        with test_bank() as bank:
            self.assertEqual(len(bank.list_accounts('alice',1)),1)
            with self.assertRaises(BankError): bank.list_accounts('alice',0)

    def test_http_demo_local_only(self):
        from app.server import start
        with self.assertRaises(ValueError):start(host='0.0.0.0',port=0)
