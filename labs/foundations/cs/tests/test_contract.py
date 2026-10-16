import unittest
from starter import frequencies,topo_order
class Contracts(unittest.TestCase):
    def test_empty_counts(self):self.assertEqual(frequencies([]),{})
    def test_counts(self):self.assertEqual(frequencies(['ok','fail','ok']),{'ok':2,'fail':1})
    def test_empty_graph(self):self.assertEqual(topo_order({}),[])
    def test_dependency_first(self):self.assertEqual(topo_order({'B':['A'],'A':[]}),['A','B'])
    def test_branching(self):self.assertEqual(topo_order({'C':['A','B'],'B':['A'],'A':[]}),['A','B','C'])
    def test_deterministic_order(self):self.assertEqual(topo_order({'B':[],'A':[]}),['A','B'])
    def test_cycle_rejected(self):
        with self.assertRaises(ValueError):topo_order({'A':['B'],'B':['A']})
    def test_missing_dependency_rejected(self):
        with self.assertRaises(ValueError):topo_order({'A':['Z']})
    def test_self_cycle(self):
        with self.assertRaises(ValueError):topo_order({'A':['A']})
