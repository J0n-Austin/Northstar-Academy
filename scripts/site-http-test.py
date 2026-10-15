"""Local HTTP-only smoke test of the Pages artifact; not a browser/JS UI test."""
import http.server
import pathlib
import threading
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def log_message(self, format, *args):
        pass

with http.server.ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler) as server:
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}'
    for rel in ('/', '/index.html', '/app/northstar-academy.html',
                '/app/northstar-interactive-lab.html', '/docs/real-labs.html',
                '/mockups/portal.html', '/mockups/competency-record.html'):
        with urllib.request.urlopen(base + rel, timeout=4) as response:
            assert response.status == 200, rel
            assert b'Northstar' in response.read(), rel
    for rel in ('/app/src/engine.js', '/modules/01-linux-service-triage/instructor/solutions.md'):
        try:
            urllib.request.urlopen(base + rel, timeout=4)
            raise AssertionError('Private/non-site artifact served: ' + rel)
        except urllib.error.HTTPError as exc:
            assert exc.code == 404, (rel, exc.code)
    server.shutdown()
print('PASS local HTTP smoke (7 public routes / 2 excluded routes)')
