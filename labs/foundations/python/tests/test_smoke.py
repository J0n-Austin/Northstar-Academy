import unittest
import starter
class Smoke(unittest.TestCase):
    def test_importable(self):self.assertTrue(hasattr(starter,'__file__'))
