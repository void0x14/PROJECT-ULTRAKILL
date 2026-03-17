# === DOSYA: server.py ===
import http.server
import socketserver
import sqlite3
import json
import os
import random
import datetime
import urllib.request

DB_FILE = "db.sqlite"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS layers
                 (id TEXT PRIMARY KEY, name TEXT, act TEXT, order_idx INTEGER, unlocked INTEGER, completed INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS tasks
                 (id TEXT PRIMARY KEY, layer_id TEXT, title TEXT, blood_reward INTEGER, deadline_seconds INTEGER, status TEXT, style_rank TEXT, dom_order INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS blood_state
                 (id INTEGER PRIMARY KEY CHECK (id = 1), current_blood INTEGER, max_blood INTEGER, last_updated TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS cyber_grind_state
                 (id INTEGER PRIMARY KEY CHECK (id = 1), active INTEGER, shuffle_seed REAL, activated_at TEXT)''')
    
    # Initialize defaults if empty
    c.execute("SELECT COUNT(*) FROM layers")
    if c.fetchone()[0] == 0:
        layers = [
            ("prelude", "Prelude", "Prelude", 0, 1, 0),
            ("limbo", "Limbo", "Act I", 1, 0, 0),
            ("lust", "Lust", "Act I", 2, 0, 0),
            ("gluttony", "Gluttony", "Act I", 3, 0, 0),
            ("greed", "Greed", "Act I", 4, 0, 0),
            ("wrath", "Wrath", "Act I", 5, 0, 0),
            ("heresy", "Heresy", "Act II", 6, 0, 0),
            ("violence", "Violence", "Act II", 7, 0, 0),
            ("fraud", "Fraud", "Act II", 8, 0, 0),
            ("treachery", "Treachery", "Act II", 9, 0, 0)
        ]
        c.executemany("INSERT INTO layers VALUES (?, ?, ?, ?, ?, ?)", layers)
    
    c.execute("SELECT COUNT(*) FROM blood_state")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO blood_state VALUES (1, 100, 100, ?)", (datetime.datetime.now().isoformat(),))
        
    c.execute("SELECT COUNT(*) FROM cyber_grind_state")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO cyber_grind_state VALUES (1, 0, 0.0, ?)", (datetime.datetime.now().isoformat(),))
        
    conn.commit()
    conn.close()

def calculate_style_rank(completion_time_ms, deadline_seconds):
    deadline_ms = deadline_seconds * 1000
    if completion_time_ms < deadline_ms * 0.3: return "SSS"
    if completion_time_ms < deadline_ms * 0.5: return "SS"
    if completion_time_ms < deadline_ms * 0.7: return "S"
    if completion_time_ms < deadline_ms * 0.9: return "A"
    if completion_time_ms <= deadline_ms * 1.0: return "B"
    return "C"

class ReqHandler(http.server.SimpleHTTPRequestHandler):
    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def _get_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length)
        return json.loads(body.decode('utf-8'))

    def do_GET(self):
        if self.path == '/':
            self.path = '/frontend/index.html'
            return super().do_GET()
        elif self.path.startswith('/frontend/'):
            return super().do_GET()
        elif self.path == '/api/state':
            try:
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute("SELECT current_blood, max_blood FROM blood_state WHERE id=1")
                blood = c.fetchone()
                c.execute("SELECT id, name, act, unlocked, completed FROM layers")
                layers = [{"id": r[0], "name": r[1], "act": r[2], "unlocked": bool(r[3]), "completed": bool(r[4])} for r in c.fetchall()]
                c.execute("SELECT id, layer_id, title, blood_reward, deadline_seconds, status, style_rank FROM tasks")
                tasks = [{"id": r[0], "layer_id": r[1], "title": r[2], "blood_reward": r[3], "deadline_seconds": r[4], "status": r[5], "style_rank": r[6]} for r in c.fetchall()]
                conn.close()
                self._send_json(200, {
                    "blood": {"current": blood[0], "max": blood[1]},
                    "layers": layers,
                    "tasks": tasks
                })
            except Exception as e:
                self._send_json(500, {"error": str(e)})
        elif self.path == '/api/grind/state':
            try:
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute("SELECT active, shuffle_seed FROM cyber_grind_state WHERE id=1")
                grind = c.fetchone()
                conn.close()
                self._send_json(200, {"active": bool(grind[0]), "shuffle_seed": grind[1]})
            except Exception as e:
                self._send_json(500, {"error": str(e)})
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        try:
            if self.path == '/api/task/complete':
                body = self._get_body()
                task_id = body.get('task_id')
                completion_time_ms = body.get('completion_time_ms', 0)
                
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute("SELECT blood_reward, deadline_seconds FROM tasks WHERE id=?", (task_id,))
                task = c.fetchone()
                if not task:
                    self._send_json(404, {"error": "Task not found"})
                    return
                
                rank = calculate_style_rank(completion_time_ms, task[1])
                multiplier = {"SSS": 3.0, "SS": 2.5, "S": 2.0, "A": 1.5, "B": 1.0, "C": 0.5}.get(rank, 1.0)
                reward = int(task[0] * multiplier)
                
                c.execute("UPDATE tasks SET status='completed', style_rank=? WHERE id=?", (rank, task_id))
                c.execute("UPDATE blood_state SET current_blood = MIN(max_blood, current_blood + ?) WHERE id=1", (reward,))
                conn.commit()
                conn.close()
                self._send_json(200, {"success": True, "style_rank": rank, "blood_added": reward})
                
            elif self.path == '/api/task/fail':
                body = self._get_body()
                task_id = body.get('task_id')
                seed = random.random()
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                if task_id:
                    c.execute("UPDATE tasks SET status='failed', style_rank='D' WHERE id=?", (task_id,))
                c.execute("UPDATE cyber_grind_state SET active=1, shuffle_seed=?, activated_at=? WHERE id=1", (seed, datetime.datetime.now().isoformat()))
                conn.commit()
                conn.close()
                
                try:
                    req = urllib.request.Request("http://127.0.0.1:9090/punish", method='POST')
                    urllib.request.urlopen(req, timeout=1)
                except Exception:
                    pass

                self._send_json(200, {"success": True, "cyber_grind": True, "shuffle_seed": seed})

            elif self.path == '/api/task/create':
                body = self._get_body()
                import uuid
                task_id = str(uuid.uuid4())
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute("INSERT INTO tasks (id, layer_id, title, blood_reward, deadline_seconds, status, style_rank, dom_order) VALUES (?, ?, ?, ?, ?, 'pending', NULL, 0)",
                          (task_id, body.get('layer_id'), body.get('title'), body.get('blood_reward'), body.get('deadline_seconds')))
                conn.commit()
                conn.close()
                self._send_json(200, {"success": True, "task_id": task_id})

            elif self.path == '/api/grind/clear':
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute("UPDATE cyber_grind_state SET active=0 WHERE id=1")
                conn.commit()
                conn.close()
                self._send_json(200, {"success": True})
            else:
                self.send_response(404)
                self.end_headers()
        except Exception as e:
            self._send_json(500, {"error": str(e)})

if __name__ == "__main__":
    init_db()
    PORT = 8000
    with socketserver.TCPServer(("", PORT), ReqHandler) as httpd:
        print(f"ULTRAKILL ENGINE running at http://localhost:{PORT}")
        httpd.serve_forever()
