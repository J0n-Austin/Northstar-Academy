import unittest
from starter import normalize_account,totals_by_owner,unique_account_ids
class Contracts(unittest.TestCase):
    def test_trimmed_owner_and_fields(self):
        self.assertEqual(normalize_account({'id':3,'owner':'  amy  ','cents':25,'secret':'X'}),{'id':3,'owner':'amy','cents':25})
    def test_reject_bool_id(self):
        for value in [True,False,0,-1,'3',None]:
            with self.subTest(value=value),self.assertRaises(ValueError): normalize_account({'id':value,'owner':'a','cents':0})
    def test_reject_bad_balance_and_owner(self):
        for d in [{'id':1,'owner':'  ','cents':1},{'id':1,'owner':'a','cents':-1},{'id':1,'owner':'a','cents':True}]:
            with self.subTest(d=d),self.assertRaises(ValueError): normalize_account(d)
    def test_aggregation(self):
        rows=[{'id':1,'owner':'amy','cents':200},{'id':2,'owner':'amy','cents':75},{'id':3,'owner':'bob','cents':90}]
        self.assertEqual(totals_by_owner(rows),{'amy':275,'bob':90})
    def test_no_input_mutation(self):
        d={'id':1,'owner':' amy ','cents':3};normalize_account(d);self.assertEqual(d['owner'],' amy ')
    def test_unique_preserves_first_seen(self):
        self.assertEqual(unique_account_ids([{'id':3},{'id':2},{'id':3},{'id':1}]),[3,2,1])
    def test_unique_rejects_invalid(self):
        with self.assertRaises(ValueError):unique_account_ids([{'id':1},{'id':True}])
