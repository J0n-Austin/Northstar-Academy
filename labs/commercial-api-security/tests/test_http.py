"""Actual localhost HTTP round-trip. No remote network or real identities."""
import json
from pathlib import Path
import sys
import tempfile
from threading import Thread
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from http.server import ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from bank import initialize
from api import make_handler


class HTTPContract(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        path = str(Path(self.tmp.name) / 'bank.db')
        initialize(path)
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(path))
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(2)
        self.tmp.cleanup()

    def fetch(self, route, user):
        req = Request(self.base + route, headers={'X-Demo-User': user})
        try:
            with urlopen(req, timeout=3) as response:
                return response.status, json.load(response)
        except HTTPError as exc:
            return exc.code, json.load(exc)

    def test_owner_api(self):
        code, data = self.fetch('/api/v1/accounts/101', 'alex')
        self.assertEqual((code, data['owner']), (200, 'alex'))

    def test_cross_account_api_is_hidden(self):
        code, data = self.fetch('/api/v1/accounts/202', 'alex')
        self.assertEqual(code, 404)
        self.assertNotIn('nickname', data)

    def test_search_endpoint_does_not_expose_other_owner(self):
        code, data = self.fetch('/api/v1/transactions?q=rent', 'alex')
        self.assertEqual(code, 200)
        self.assertEqual(data['items'], [])

    def test_missing_demo_identity_rejected(self):
        code, _ = self.fetch('/api/v1/accounts/101', 'none')
        self.assertEqual(code, 400)


if __name__ == '__main__':
    unittest.main()
