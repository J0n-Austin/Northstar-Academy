import unittest, sys, stat
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from starter import run_python_snippet,owner_private,required_config
class Contract(unittest.TestCase):
 def test_success(self):
  r=run_python_snippet("print(6*7)"); self.assertEqual((r["exit_code"],r["stdout"].strip()),(0,"42"))
 def test_nonzero_and_stderr(self):
  r=run_python_snippet("import sys;print('error',file=sys.stderr);sys.exit(5)")
  self.assertEqual(r["exit_code"],5);self.assertIn('error',r['stderr'])
 def test_bounded_execution(self):
  with self.assertRaises(TimeoutError):
   run_python_snippet("import time;time.sleep(3)",0.1)
 def test_permissions(self):
  self.assertTrue(owner_private(stat.S_IFREG|0o600));self.assertFalse(owner_private(stat.S_IFREG|0o644))
  self.assertFalse(owner_private(stat.S_IFDIR|0o600))
 def test_config(self):
  self.assertEqual(required_config({'API_MODE':'local'},'API_MODE'),'local')
  with self.assertRaises(ValueError):required_config({},'API_MODE')
if __name__=='__main__':unittest.main()
