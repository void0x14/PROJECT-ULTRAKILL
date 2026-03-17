# === DOSYA: server.py ===
import http.server
import sqlite3
import json
import os
import random
import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "db.sqlite")

MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
}

LAYERS_SEED = [
    ("prelude", "Prelude", "Prelude", 0, 1, 0),
    ("limbo", "Limbo", "Act I", 1, 1, 0),
    ("lust", "Lust", "Act I", 2, 0, 0),
    ("gluttony", "Gluttony", "Act I", 3, 0, 0),
    ("greed", "Greed", "Act I", 4, 0, 0),
    ("wrath", "Wrath", "Act I", 5, 0, 0),
    ("gabriel", "Gabriel, Judge of Hell", "Boss", 6, 0, 0),
    ("heresy", "Heresy", "Act II", 7, 0, 0),
    ("violence", "Violence", "Act II", 8, 0, 0),
    ("fraud", "Fraud", "Act II", 9, 0, 0),
    ("treachery", "Treachery", "Act II", 10, 0, 0),
    ("minos_prime", "Minos Prime", "Boss", 11, 0, 0),
    ("sisyphus_prime", "Sisyphus Prime", "Secret Boss", 12, 0, 0),
]


def generate_id():
    return f"{random.randint(0, 2**64):016x}"


def _migrate_db(conn):
    """Run schema migrations on existing databases."""
    c = conn.cursor()
    # Migration: add started_at column to tasks if missing
    c.execute("PRAGMA table_info(tasks)")
    columns = {row["name"] for row in c.fetchall()}
    if "started_at" not in columns:
        c.execute("ALTER TABLE tasks ADD COLUMN started_at REAL")
    conn.commit()


def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS layers(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        act TEXT NOT NULL,
        order_idx INTEGER NOT NULL,
        unlocked INTEGER NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS tasks(
        id TEXT PRIMARY KEY,
        layer_id TEXT NOT NULL,
        title TEXT NOT NULL,
        blood_reward INTEGER NOT NULL DEFAULT 10,
        deadline_seconds INTEGER NOT NULL DEFAULT 300,
        status TEXT NOT NULL DEFAULT 'pending',
        style_rank TEXT,
        dom_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT,
        started_at REAL,
        FOREIGN KEY (layer_id) REFERENCES layers(id)
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS blood_state(
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_blood INTEGER NOT NULL DEFAULT 100,
        max_blood INTEGER NOT NULL DEFAULT 100,
        last_updated TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS cyber_grind_state(
        id INTEGER PRIMARY KEY CHECK (id = 1),
        active INTEGER NOT NULL DEFAULT 0,
        shuffle_seed REAL NOT NULL DEFAULT 0.0,
        activated_at TEXT
    )""")

    # Run migrations for existing databases
    _migrate_db(conn)

    c.execute("SELECT COUNT(*) FROM layers")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO layers VALUES (?,?,?,?,?,?)", LAYERS_SEED)

    c.execute("SELECT COUNT(*) FROM blood_state")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO blood_state VALUES (1, 100, 100, ?)",
                  (datetime.datetime.now().isoformat(),))

    c.execute("SELECT COUNT(*) FROM cyber_grind_state")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO cyber_grind_state VALUES (1, 0, 0.0, ?)",
                  (datetime.datetime.now().isoformat(),))

    conn.commit()
    conn.close()


def calculate_style_rank(completion_time_ms, deadline_seconds):
    deadline_ms = deadline_seconds * 1000
    if completion_time_ms < deadline_ms * 0.3:
        return "SSS"
    if completion_time_ms < deadline_ms * 0.5:
        return "SS"
    if completion_time_ms < deadline_ms * 0.7:
        return "S"
    if completion_time_ms < deadline_ms * 0.9:
        return "A"
    if completion_time_ms <= deadline_ms:
        return "B"
    return "C"


RANK_MULTIPLIERS = {
    "SSS": 3.0, "SS": 2.5, "S": 2.0,
    "A": 1.5, "B": 1.0, "C": 0.5, "D": 0.0,
}


def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


class UltrakillHandler(http.server.BaseHTTPRequestHandler):

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status_code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def _serve_static(self, rel_path):
        safe = os.path.normpath(rel_path).lstrip("/")
        file_path = os.path.join(SCRIPT_DIR, safe)
        if not os.path.isfile(file_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")
            return
        ext = os.path.splitext(file_path)[1].lower()
        mime = MIME_TYPES.get(ext, "application/octet-stream")
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(content)))
            self._cors_headers()
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/":
            self._serve_static("frontend/index.html")

        elif path.startswith("/frontend/"):
            self._serve_static(path[1:])

        elif path == "/api/state":
            try:
                conn = get_db()
                c = conn.cursor()
                c.execute("SELECT current_blood, max_blood FROM blood_state WHERE id=1")
                b = c.fetchone()
                c.execute("SELECT id, name, act, order_idx, unlocked, completed FROM layers ORDER BY order_idx")
                layers = [dict(r) for r in c.fetchall()]
                for l in layers:
                    l["unlocked"] = bool(l["unlocked"])
                    l["completed"] = bool(l["completed"])
                c.execute("SELECT id, layer_id, title, blood_reward, deadline_seconds, status, style_rank, dom_order, started_at FROM tasks")
                tasks = [dict(r) for r in c.fetchall()]
                c.execute("SELECT active, shuffle_seed FROM cyber_grind_state WHERE id=1")
                g = c.fetchone()
                conn.close()
                self._send_json(200, {
                    "blood": {"current": b["current_blood"], "max": b["max_blood"]},
                    "layers": layers,
                    "tasks": tasks,
                    "grind": {"active": bool(g["active"]), "shuffle_seed": g["shuffle_seed"]},
                })
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/grind/state":
            try:
                conn = get_db()
                c = conn.cursor()
                c.execute("SELECT active, shuffle_seed FROM cyber_grind_state WHERE id=1")
                g = c.fetchone()
                conn.close()
                self._send_json(200, {"active": bool(g["active"]), "shuffle_seed": g["shuffle_seed"]})
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        path = self.path.split("?")[0]

        if path == "/api/task/create":
            try:
                body = self._read_body()
                task_id = generate_id()
                layer_id = body.get("layer_id", "limbo")
                title = body.get("title", "Unnamed Task")
                blood_reward = int(body.get("blood_reward", 10))
                deadline = int(body.get("deadline_seconds", 300))
                conn = get_db()
                c = conn.cursor()
                c.execute(
                    "INSERT INTO tasks (id, layer_id, title, blood_reward, deadline_seconds, status, style_rank, dom_order, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                    (task_id, layer_id, title, blood_reward, deadline, "pending", None, 0, datetime.datetime.now().isoformat()),
                )
                conn.commit()
                conn.close()
                self._send_json(200, {"success": True, "task_id": task_id})
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/task/start":
            try:
                body = self._read_body()
                task_id = body.get("task_id")
                start_time = datetime.datetime.now().timestamp()
                conn = get_db()
                c = conn.cursor()
                c.execute("UPDATE tasks SET status='in_progress', started_at=? WHERE id=?", (start_time, task_id))
                conn.commit()
                conn.close()
                self._send_json(200, {"success": True, "started_at": start_time})
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/task/complete":
            try:
                body = self._read_body()
                task_id = body.get("task_id")
                conn = get_db()
                c = conn.cursor()
                c.execute("SELECT layer_id, blood_reward, deadline_seconds, started_at, status FROM tasks WHERE id=?", (task_id,))
                row = c.fetchone()
                if not row:
                    conn.close()
                    self._send_json(404, {"error": "Task not found"})
                    return

                # Bug fix: reject completion if task was never started
                started_at = row["started_at"]
                if not started_at or row["status"] != "in_progress":
                    conn.close()
                    self._send_json(400, {"error": "Task must be started before completion"})
                    return

                # Server-calculated completion time to prevent spoofing
                elapsed_seconds = datetime.datetime.now().timestamp() - float(started_at)
                completion_time_ms = int(elapsed_seconds * 1000)

                rank = calculate_style_rank(completion_time_ms, row["deadline_seconds"])
                multiplier = RANK_MULTIPLIERS.get(rank, 1.0)
                reward = int(row["blood_reward"] * multiplier)
                
                # Update task status and blood
                c.execute("UPDATE tasks SET status='completed', style_rank=? WHERE id=?", (rank, task_id))
                c.execute("UPDATE blood_state SET current_blood = MIN(max_blood, current_blood + ?), last_updated=? WHERE id=1",
                          (reward, datetime.datetime.now().isoformat()))
                
                # Bug fix: only mark layer completed when ALL its tasks are done
                layer_id = row["layer_id"]
                c.execute("SELECT COUNT(*) as remaining FROM tasks WHERE layer_id=? AND status != 'completed'", (layer_id,))
                remaining = c.fetchone()["remaining"]
                if remaining == 0:
                    c.execute("UPDATE layers SET completed=1 WHERE id=?", (layer_id,))
                    c.execute("SELECT order_idx FROM layers WHERE id=?", (layer_id,))
                    layer_idx_row = c.fetchone()
                    if layer_idx_row:
                        curr_order = layer_idx_row["order_idx"]
                        c.execute("UPDATE layers SET unlocked=1 WHERE order_idx=?", (curr_order + 1,))
                
                c.execute("SELECT current_blood, max_blood FROM blood_state WHERE id=1")
                blood = c.fetchone()
                conn.commit()
                conn.close()
                self._send_json(200, {
                    "success": True,
                    "style_rank": rank,
                    "blood_added": reward,
                    "blood": {"current": blood["current_blood"], "max": blood["max_blood"]},
                })
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/task/fail":
            try:
                body = self._read_body()
                task_id = body.get("task_id")
                seed = random.random()
                conn = get_db()
                c = conn.cursor()
                if task_id:
                    c.execute("UPDATE tasks SET status='failed', style_rank='D' WHERE id=?", (task_id,))
                c.execute("UPDATE cyber_grind_state SET active=1, shuffle_seed=?, activated_at=? WHERE id=1",
                          (seed, datetime.datetime.now().isoformat()))
                conn.commit()
                conn.close()
                self._send_json(200, {"success": True, "cyber_grind": True, "shuffle_seed": seed})
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/grind/clear":
            try:
                conn = get_db()
                c = conn.cursor()
                c.execute("UPDATE cyber_grind_state SET active=0 WHERE id=1")
                conn.commit()
                conn.close()
                self._send_json(200, {"success": True, "cyber_grind": False})
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/blood/update":
            try:
                body = self._read_body()
                current = int(body.get("current", 0))
                conn = get_db()
                c = conn.cursor()
                c.execute("UPDATE blood_state SET current_blood=?, last_updated=? WHERE id=1",
                          (max(0, current), datetime.datetime.now().isoformat()))
                conn.commit()
                conn.close()
                self._send_json(200, {"success": True, "current": max(0, current)})
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/layer/select":
            try:
                body = self._read_body()
                layer_id = body.get("layer_id")
                conn = get_db()
                c = conn.cursor()
                c.execute("SELECT unlocked FROM layers WHERE id=?", (layer_id,))
                row = c.fetchone()
                if not row:
                    conn.close()
                    self._send_json(404, {"error": "Layer not found"})
                    return
                conn.close()
                self._send_json(200, {"success": True, "layer_id": layer_id, "unlocked": bool(row["unlocked"])})
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # suppress default access logs


if __name__ == "__main__":
    init_db()
    PORT = 8000
    server = http.server.HTTPServer(("", PORT), UltrakillHandler)
    print(f"ULTRAKILL ENGINE :: http://localhost:{PORT}")
    print(f"DB: {DB_FILE}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutdown.")
        server.server_close()
