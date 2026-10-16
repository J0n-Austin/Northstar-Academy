import unittest,socket,sys,struct,threading
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]));from starter import encode_frame,read_frame,parse_port
class Contracts(unittest.TestCase):
 def test_network_order(self):self.assertEqual(encode_frame(b'abc')[:4],b'\x00\x00\x00\x03')
 def test_fragmented_frame(self):
  a,b=socket.socketpair();a.settimeout(1);b.settimeout(1)
  def sender():
   for c in encode_frame(b'hello'):
    a.sendall(bytes([c]))
   a.shutdown(socket.SHUT_WR)
  t=threading.Thread(target=sender);t.start()
  try:self.assertEqual(read_frame(b),b'hello')
  finally:t.join(timeout=1);a.close();b.close()
 def test_oversize(self):
  a,b=socket.socketpair();a.sendall(struct.pack('!I',5000));a.close()
  try:
   with self.assertRaises(ValueError):read_frame(b,4096)
  finally:b.close()
 def test_closed_early(self):
  a,b=socket.socketpair();a.sendall(b'\x00\x00');a.close()
  try:
   with self.assertRaises((EOFError,ValueError)):read_frame(b)
  finally:b.close()
 def test_ports(self):
  self.assertEqual(parse_port('443'),443)
  for invalid in ['0','65536','-1',' 80','80x']:
   with self.subTest(invalid=invalid):
    with self.assertRaises(ValueError):parse_port(invalid)
if __name__=='__main__':unittest.main()
