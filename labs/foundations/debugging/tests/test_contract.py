import unittest
from starter import summarize,safe_event
class Contracts(unittest.TestCase):
    def test_counts(self):self.assertEqual(summarize([{'type':'warn'},{'type':'warn'},{'type':'ok'}]),{'warn':2,'ok':1})
    def test_reject_missing_type(self):
        with self.assertRaises(ValueError):summarize([{'type':'ok'},{}])
    def test_reject_nonstr_type(self):
        with self.assertRaises(ValueError):summarize([{'type':None}])
    def test_reject_empty_type(self):
        with self.assertRaises(ValueError):summarize([{'type':'  '}])
    def test_reject_non_dict(self):
        with self.assertRaises(ValueError):summarize([{'type':'ok'},'invalid'])
    def test_safe_allowlist(self):self.assertEqual(safe_event({'event':'denied','request_id':'r1','outcome':'blocked','token':'secret'}),{'event':'denied','request_id':'r1','outcome':'blocked'})
    def test_nested_secret_omitted(self):
        out=safe_event({'event':'denied','headers':{'Authorization':'bearer secret'},'request_id':'r2','outcome':'blocked'})
        self.assertNotIn('secret',repr(out));self.assertNotIn('Authorization',repr(out))
    def test_does_not_mutate(self):
        d={'event':'ok','request_id':'r3','outcome':'success','password':'abc'};safe_event(d);self.assertIn('password',d)
