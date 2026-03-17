# === DOSYA: punishment_daemon.py ===
import http.server
import socketserver
import subprocess

CONFIG = {
    "lock_screen": False,
    "block_domains": [],
    "kill_procs": []
}

class DaemonHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/punish':
            print("CYBER GRIND PUNISHMENT TRIGGERED!")
            
            if CONFIG["lock_screen"]:
                subprocess.Popen(["fish", "-c", "swaylock -f -c 000000"])
                
            for proc in CONFIG["kill_procs"]:
                subprocess.Popen(["fish", "-c", f"pkill {proc}"])
                
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status": "punished"}')
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    PORT = 9090
    print(f"Punishment Daemon listening on {PORT}")
    with socketserver.TCPServer(("", PORT), DaemonHandler) as httpd:
        httpd.serve_forever()
