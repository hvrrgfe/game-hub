#!/usr/bin/env python3
"""Simple HTTP server for Game Hub - anyone on your network can access."""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8000
DIR = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def log_message(self, format, *args):
        print(f"  [{self.log_date_time_string()}] {args[0]} {args[1]} {args[2]}")

if __name__ == "__main__":
    os.chdir(DIR)
    print(f"""
{"="*50}
  🎮 游戏中心已启动!
  
  本机访问: http://localhost:{PORT}
  局域网访问: http://{__import__('socket').gethostbyname(__import__('socket').gethostname())}:{PORT}
  
  按 Ctrl+C 停止服务器
{"="*50}
""")
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except:
        pass
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止。")
