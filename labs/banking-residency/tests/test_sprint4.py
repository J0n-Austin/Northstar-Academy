import unittest
from tests.common import test_bank,test_server,request

class Sprint4Tests(unittest.TestCase):
    def test_407_transfer_history_scoped(self):
        with test_bank() as bank:
            bank.transfer('alice',1,2,75,'history-key-1')
            bank.transfer('bob',2,3,25,'history-key-2')
            self.assertEqual(len(bank.list_transfers('alice')),1)
            self.assertEqual(len(bank.list_transfers('bob')),1)

    def test_407_http_does_not_expose_other_tenant(self):
        with test_server() as (port,bank):
            bank.transfer('alice',1,2,75,'history-key-3')
            code,payload=request(port,'GET','/transfers','bob')
            self.assertEqual(code,200)
            self.assertEqual(payload['transfers'],[])

    def test_408_security_audit_never_serializes_credentials(self):
        with test_bank() as bank:
            fields=bank.safe_audit_event('alice','transfer',{'result':'denied','token':'DUMMY-TOKEN-DO-NOT-LOG','password':'sample'})
            self.assertEqual(fields,{'actor':'alice','operation':'transfer','result':'denied'})
            self.assertNotIn('DUMMY-TOKEN',str(fields))

    def test_408_unexpected_exceptions_are_generic(self):
        with test_server() as (port,_):
            code,_=request(port,'POST','/transfers',body={'foo':'bar'})
            self.assertEqual(code,400)
