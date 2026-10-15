"""Localhost-only demo HTTP adapter. X-Demo-User is NOT authentication."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from urllib.parse import parse_qs, urlsplit
from bank import MissingAccount, account_for_user, initialize, search_memos


def make_handler(db_path):
    class Handler(BaseHTTPRequestHandler):
        def send_json(self, code, payload):
            encoded = json.dumps(payload, sort_keys=True).encode('utf8')
            self.send_response(code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def do_GET(self):
            url = urlsplit(self.path)
            user = self.headers.get('X-Demo-User', '')
            if user not in {'alex', 'blair'}:
                return self.send_json(400, {'error': 'demo user required'})
            if url.path.startswith('/api/v1/accounts/'):
                try:
                    account_id = int(url.path.rsplit('/', 1)[-1])
                    result = account_for_user(db_path, user, account_id)
                    return self.send_json(200, result)
                except (ValueError, MissingAccount):
                    return self.send_json(404, {'error': 'account unavailable'})
            if url.path == '/api/v1/transactions':
                term = parse_qs(url.query).get('q', [''])[0]
                try:
                    return self.send_json(200, {'items': search_memos(db_path, user, term)})
                except Exception:
                    # Keep the demo from disclosing database exception details.
                    return self.send_json(400, {'error': 'invalid search'})
            return self.send_json(404, {'error': 'unknown route'})

        def log_message(self, fmt, *args):
            pass  # The demo intentionally avoids logging account fields.
    return Handler


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--db', default='northstar-demo.sqlite3')
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    initialize(args.db)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), make_handler(args.db))
    print(f'NS Demo API http://127.0.0.1:{server.server_address[1]}', flush=True)
    print('Only synthetic users; X-Demo-User is a spoofable teaching stub, NOT auth.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
