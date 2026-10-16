import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
class Smoke(unittest.TestCase):
 def test_importable(self):
  import starter
  assert starter.first_duplicate([]) is None
