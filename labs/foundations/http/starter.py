"""Starter: real localhost HTTP contracts via stdlib server."""
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlsplit, parse_qs

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def reply(self, status, body):
        data=json.dumps(body).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers();self.wfile.write(data)
    def do_GET(self):
        parts=urlsplit(self.path)
        if parts.path=='/health':
            self.reply(200,{'status':'ok'}) # TODO include service/build contract
        elif parts.path.startswith('/accounts/'):
            self.reply(200,{'id':parts.path.split('/')[-1]}) # TODO validate and scope
        else:
            self.reply(200,{'error':'not found'}) # TODO HTTP 404
