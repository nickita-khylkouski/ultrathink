#!/usr/bin/env python3
"""
Simple HTTP server for the web UI
Run: python server.py
Then open: http://localhost:3000
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    server_address = ('', 3000)
    httpd = HTTPServer(server_address, CORSRequestHandler)

    print("🌐 Web UI Server")
    print("=" * 50)
    print("📍 Open: http://localhost:3000")
    print("📡 Serving from:", os.getcwd())
    print("=" * 50)
    print("\nPress Ctrl+C to stop\n")

    httpd.serve_forever()
