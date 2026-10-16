import unittest
from starter import parse_cents,can_transfer
class Contracts(unittest.TestCase):
    def test_valid_cents(self):self.assertEqual(parse_cents(150),150)
    def test_zero_rejected(self):
        with self.assertRaises(ValueError):parse_cents(0)
    def test_boolean_rejected(self):
        with self.assertRaises(ValueError):parse_cents(True)
    def test_float_rejected(self):
        with self.assertRaises(ValueError):parse_cents(12.5)
    def test_negative_rejected(self):
        with self.assertRaises(ValueError):parse_cents(-1)
    def test_exact_balance(self):self.assertTrue(can_transfer(200,200))
    def test_insufficient(self):self.assertFalse(can_transfer(199,200))
    def test_invalid_balance(self):
        for b in [-5,True,'200']:
            with self.subTest(b=b),self.assertRaises(ValueError):can_transfer(b,50)
