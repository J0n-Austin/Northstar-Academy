from contextlib import contextmanager
from http.client import HTTPConnection
from pathlib import Path
import json
import tempfile
import threading
from app.bank import Bank
from app.server import handler_factory
from http.server import ThreadingHTTPServer

@contextmanager
def test_bank():
    with tempfile.TemporaryDirectory() as tmp:
        yield Bank(Path(tmp)/'bank.sqlite3')

@contextmanager
def test_server():
    with test_bank() as bank:
        http=ThreadingHTTPServer(('127.0.0.1',0),handler_factory(bank))
        thread=threading.Thread(target=http.serve_forever,daemon=True)
        thread.start()
        try:yield http.server_port,bank
        finally:http.shutdown();http.server_close();thread.join(timeout=3)

def request(port, method, path, user='alice', body=None):
    con=HTTPConnection('127.0.0.1',port,timeout=3)
    headers={'X-Demo-User':user}
    if body is not None:headers['Content-Type']='application/json'
    con.request(method,path,json.dumps(body) if body is not None else None,headers)
    response=con.getresponse();data=response.read();con.close()
    return response.status,json.loads(data)
