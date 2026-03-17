# === DOSYA: punishment_daemon.py ===
import http.server
import subprocess
import json
import socket

CONFIG = {
    "lock_screen": False,
    "block_domains": [],
    "kill_procs": [],
}


class DaemonHandler(http.server.BaseHTTPRequestHandler):

    def _send_json(self, code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        path = self.path.split("?")[0]

        if path == "/punish":
            print("[DAEMON] CYBER GRIND PUNISHMENT TRIGGERED")
            results = []

            if CONFIG["lock_screen"]:
                try:
                    subprocess.Popen(["fish", "-c", "swaylock -f -c 000000"])
                    results.append("screen_locked")
                except Exception as e:
                    results.append(f"lock_failed: {e}")

            for domain in CONFIG["block_domains"]:
                try:
                    subprocess.Popen([
                        "fish", "-c",
                        f"sudo iptables -I OUTPUT -p tcp -d {domain} -j DROP"
                    ])
                    results.append(f"blocked: {domain}")
                except Exception as e:
                    results.append(f"block_failed: {domain}: {e}")

            for proc in CONFIG["kill_procs"]:
                try:
                    subprocess.Popen(["fish", "-c", f"pkill -f {proc}"])
                    results.append(f"killed: {proc}")
                except Exception as e:
                    results.append(f"kill_failed: {proc}: {e}")

            self._send_json(200, {"status": "punished", "actions": results})

        elif path == "/release":
            print("[DAEMON] RELEASING PUNISHMENTS")
            results = []

            for domain in CONFIG["block_domains"]:
                try:
                    subprocess.Popen([
                        "fish", "-c",
                        f"sudo iptables -D OUTPUT -p tcp -d {domain} -j DROP"
                    ])
                    results.append(f"unblocked: {domain}")
                except Exception as e:
                    results.append(f"unblock_failed: {domain}: {e}")

            self._send_json(200, {"status": "released", "actions": results})

        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    PORT = 9090
    server = http.server.HTTPServer(("", PORT), DaemonHandler)
    print(f"[DAEMON] Punishment Daemon :: http://localhost:{PORT}")
    print(f"[DAEMON] Config: {json.dumps(CONFIG, indent=2)}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[DAEMON] Shutdown.")
        server.server_close()
