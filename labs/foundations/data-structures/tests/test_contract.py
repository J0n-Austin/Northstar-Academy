import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]));from starter import first_duplicate,dependency_order,schedule
class Contracts(unittest.TestCase):
 def test_duplicate_order(self):self.assertEqual(first_duplicate([1,2,3,2,1]),2)
 def test_unique(self):self.assertIsNone(first_duplicate([1,2,3]))
 def test_topology(self):
  result=dependency_order({'api':['sql'],'sql':['python'],'python':[]})
  self.assertEqual(set(result),{'api','sql','python'});self.assertLess(result.index('python'),result.index('sql'));self.assertLess(result.index('sql'),result.index('api'))
 def test_cycle(self):
  with self.assertRaises(ValueError):dependency_order({'a':['b'],'b':['a']})
 def test_missing_dependency(self):
  with self.assertRaises(ValueError):dependency_order({'a':['missing']})
 def test_priority_and_ties(self):
  self.assertEqual(schedule([{'id':'b','priority':2},{'id':'a','priority':1},{'id':'c','priority':1}]),['a','c','b'])
if __name__=='__main__':unittest.main()
