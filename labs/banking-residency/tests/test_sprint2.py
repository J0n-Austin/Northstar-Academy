import unittest
from tests.common import test_bank, test_server, request
from app.bank import AccessDenied

class Sprint2Tests(unittest.TestCase):
    def test_403_account_owner_allowed(self):
        with test_bank() as bank:
            self.assertEqual(bank.get_account('alice',1)['balance_cents'],10000)

    def test_403_cross_account_access_denied(self):
        with test_bank() as bank:
            with self.assertRaises(AccessDenied):bank.get_account('alice',2)
        with test_server() as (port,_):
            self.assertEqual(request(port,'GET','/accounts/2','alice')[0],403)

    def test_404_search_parameterized_and_scoped(self):
        with test_bank() as bank:
            self.assertEqual([a['id'] for a in bank.search_accounts('alice','1')],[1])
            self.assertEqual(bank.search_accounts('alice',"' OR 1=1 --"),[])
            self.assertEqual(bank.search_accounts('bob','1'),[])
