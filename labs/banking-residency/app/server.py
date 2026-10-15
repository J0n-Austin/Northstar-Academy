"""Local-only educational REST API. X-Demo-User is NOT authentication."""
from __future__ import annotations
import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from .bank import Bank, BankError


def handler_factory(bank):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            # Synthetic training app: no raw URL, request header or request body in logs.
            pass

        def respond(self, status, data):
            payload=json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type','application/json')
            self.send_header('Cache-Control','no-store')
            self.send_header('Content-Length',str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def dispatch(self):
            actor=self.headers.get('X-Demo-User', '')
            url=urlsplit(self.path)
            args=parse_qs(url.query)
            if self.command=='GET' and url.path=='/health':
                return 200,bank.health()
            if self.command=='GET' and url.path=='/accounts':
                try: limit=int(args.get('limit',['10'])[0])
                except ValueError: raise BankError('Invalid limit')
                return 200,{'accounts':bank.list_accounts(actor,limit)}
            if self.command=='GET' and url.path.startswith('/accounts/'):
                try: ident=int(url.path.split('/')[-1])
                except ValueError: raise BankError('Invalid account')
                return 200,bank.get_account(actor,ident)
            if self.command=='GET' and url.path=='/accounts-search':
                return 200,{'accounts':bank.search_accounts(actor,args.get('q',[''])[0])}
            if self.command=='GET' and url.path=='/transfers':
                return 200,{'transfers':bank.list_transfers(actor)}
            if self.command=='POST' and url.path=='/transfers':
                try:
                    size=int(self.headers.get('Content-Length','0'))
                    if not 0<size<=4096: raise BankError('Invalid payload size')
                    body=json.loads(self.rfile.read(size))
                    if not isinstance(body,dict): raise ValueError('Expected object')
                    transfer=bank.transfer(actor,body['source_id'],body['destination_id'],body['amount_cents'],body['request_key'])
                    return (200 if transfer['replayed'] else 201),transfer
                except (KeyError,ValueError,json.JSONDecodeError,TypeError):
                    raise BankError('Invalid transfer payload')
            return 404,{'error':'Not found'}

        def do_GET(self):
            self.serve()
        def do_POST(self):
            self.serve()
        def serve(self):
            try:
                code,obj=self.dispatch()
                self.respond(code,obj)
            except BankError as ex:
                self.respond(ex.status,{'error':str(ex)})
            except Exception:
                # Never expose stack traces or secrets to HTTP callers.
                self.respond(500,{'error':'Unexpected server error'})
    return Handler


def start(host='127.0.0.1',port=8765,database='banking-demo.sqlite3'):
    if host not in ('127.0.0.1','localhost'):
        raise ValueError('Training service must bind to loopback, not public interfaces')
    server=ThreadingHTTPServer((host,port),handler_factory(Bank(database)))
    return server

if __name__=='__main__':
    p=argparse.ArgumentParser(description='Synthetic banking training service; localhost only')
    p.add_argument('--port',type=int,default=8765)
    p.add_argument('--database',default='banking-demo.sqlite3')
    args=p.parse_args()
    server=start(port=args.port,database=args.database)
    print(f'Northstar demo running at http://127.0.0.1:{server.server_port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
