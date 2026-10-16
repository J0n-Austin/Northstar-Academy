import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]));from starter import authorize_account,validate_transfer,redact_event,release_gate
class Contracts(unittest.TestCase):
 def test_owner(self):
  self.assertTrue(authorize_account('alice',{'owner':'alice'}));self.assertFalse(authorize_account('eve',{'owner':'alice'}))
 def test_transfers(self):
  self.assertTrue(validate_transfer(50,100))
  for x in [0,-1,True,1.5,'30',150]:
   with self.subTest(x=x):self.assertFalse(validate_transfer(x,100))
 def test_logging(self):
  event={'request_id':'xyz','action':'transfer','password':'secret','access_token':'token','customer_ssn':'123'}
  self.assertEqual(redact_event(event),{'request_id':'xyz','action':'transfer'});self.assertIn('password',event)
 def test_release(self):
  self.assertTrue(release_gate({'tests_ok':True,'migration_approved':True,'rollback_documented':True}))
  self.assertFalse(release_gate({'tests_ok':True,'migration_approved':False,'rollback_documented':True}))
  self.assertFalse(release_gate({'tests_ok':True,'migration_approved':True,'rollback_documented':False}))
if __name__=='__main__':unittest.main()
