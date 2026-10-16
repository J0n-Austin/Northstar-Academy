import json,threading,unittest
from http.server import ThreadingHTTPServer
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from starter import Handler
class Contracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        cls.worker=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.worker.start()
    @classmethod
    def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.worker.join(timeout=5)
    def req(self,path,user=None):
        headers={'X-Demo-User':user} if user else {}
        try:
            with urlopen(Request(f'http://127.0.0.1:{self.server.server_port}{path}',headers=headers),timeout=4) as res:
                return res.status,json.loads(res.read())
        except HTTPError as e:return e.code,json.loads(e.read())
    def test_health_shape(self):
        status,body=self.req('/health');self.assertEqual(status,200)
        self.assertEqual(body.get('service'),'northstar-foundations');self.assertEqual(body.get('build'),'stage4.1')
    def test_missing_route(self): self.assertEqual(self.req('/missing')[0],404)
    def test_account_authorized(self):
        status,body=self.req('/accounts/1','alice');self.assertEqual(status,200);self.assertEqual(body.get('owner'),'alice')
    def test_other_user_cannot_read_account(self):self.assertIn(self.req('/accounts/1','bob')[0],(403,404))
    def test_no_user_rejected(self):self.assertEqual(self.req('/accounts/1')[0],401)
    def test_invalid_id_rejected(self):self.assertEqual(self.req('/accounts/xyz','alice')[0],400)
    def test_unknown_id_not_found(self):self.assertEqual(self.req('/accounts/999','alice')[0],404)
