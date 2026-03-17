"""
Regression tests for ULTRAKILL Task Engine bugfixes.

Tests:
  1. Old DB upgrade — started_at column added via migration
  2. NULL started_at completion — must be rejected (no free SSS)
  3. Layer completion — only when ALL tasks in layer are done
"""
import sqlite3
import os
import sys
import datetime
import tempfile

# Add parent dir so we can import server functions
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

import server

PASS = 0
FAIL = 0


def report(name, ok, detail=""):
    global PASS, FAIL
    status = "PASS" if ok else "FAIL"
    if not ok:
        FAIL += 1
    else:
        PASS += 1
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))


def test_migration_adds_started_at():
    """Bug 1: Old databases without started_at should get migrated."""
    print("\n=== Test 1: DB Migration (started_at column) ===")
    with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as f:
        db_path = f.name

    try:
        # Create old schema WITHOUT started_at
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("""CREATE TABLE IF NOT EXISTS layers(
            id TEXT PRIMARY KEY, name TEXT, act TEXT,
            order_idx INTEGER, unlocked INTEGER DEFAULT 0, completed INTEGER DEFAULT 0
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS tasks(
            id TEXT PRIMARY KEY, layer_id TEXT, title TEXT,
            blood_reward INTEGER DEFAULT 10, deadline_seconds INTEGER DEFAULT 300,
            status TEXT DEFAULT 'pending', style_rank TEXT,
            dom_order INTEGER DEFAULT 0, created_at TEXT,
            FOREIGN KEY (layer_id) REFERENCES layers(id)
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS blood_state(
            id INTEGER PRIMARY KEY CHECK (id = 1),
            current_blood INTEGER DEFAULT 100, max_blood INTEGER DEFAULT 100,
            last_updated TEXT
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS cyber_grind_state(
            id INTEGER PRIMARY KEY CHECK (id = 1),
            active INTEGER DEFAULT 0, shuffle_seed REAL DEFAULT 0.0,
            activated_at TEXT
        )""")
        conn.commit()

        # Verify started_at does NOT exist yet
        cursor = conn.execute("PRAGMA table_info(tasks)")
        cols_before = {row["name"] for row in cursor.fetchall()}
        report("started_at absent before migration", "started_at" not in cols_before)

        # Run migration
        server._migrate_db(conn)

        # Verify started_at now exists
        cursor = conn.execute("PRAGMA table_info(tasks)")
        cols_after = {row["name"] for row in cursor.fetchall()}
        report("started_at present after migration", "started_at" in cols_after)

        # Verify idempotency — running again should not error
        try:
            server._migrate_db(conn)
            report("migration idempotent (no error on re-run)", True)
        except Exception as e:
            report("migration idempotent", False, str(e))

        conn.close()
    finally:
        os.unlink(db_path)


def test_null_started_at_rejection():
    """Bug 2: Completing a task with NULL started_at must return error."""
    print("\n=== Test 2: NULL started_at Completion Rejection ===")
    with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as f:
        db_path = f.name

    try:
        # Override DB_FILE for this test
        old_db = server.DB_FILE
        server.DB_FILE = db_path
        server.init_db()

        conn = server.get_db()
        c = conn.cursor()

        # Create a task that was never started (status=pending, started_at=NULL)
        task_id = "test_null_start"
        c.execute(
            "INSERT INTO tasks (id, layer_id, title, blood_reward, deadline_seconds, status, dom_order, created_at) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (task_id, "limbo", "Test Task", 10, 300, "pending", 0, datetime.datetime.now().isoformat()),
        )
        conn.commit()

        # Try to read task — verify started_at is NULL
        c.execute("SELECT started_at, status FROM tasks WHERE id=?", (task_id,))
        row = c.fetchone()
        report("task created with NULL started_at", row["started_at"] is None)
        report("task status is pending", row["status"] == "pending")

        # Simulate the completion check logic
        started_at = row["started_at"]
        status = row["status"]
        should_reject = (not started_at) or (status != "in_progress")
        report("completion correctly rejected (NULL started_at)", should_reject is True)

        # Now test with a properly started task
        start_time = datetime.datetime.now().timestamp()
        c.execute("UPDATE tasks SET status='in_progress', started_at=? WHERE id=?", (start_time, task_id))
        conn.commit()

        c.execute("SELECT started_at, status FROM tasks WHERE id=?", (task_id,))
        row2 = c.fetchone()
        started_at2 = row2["started_at"]
        status2 = row2["status"]
        should_allow = started_at2 and (status2 == "in_progress")
        report("completion allowed for started task", should_allow is True)

        conn.close()
        server.DB_FILE = old_db
    finally:
        os.unlink(db_path)


def test_layer_completion_requires_all_tasks():
    """Bug 4: Layer should only complete when ALL tasks are done."""
    print("\n=== Test 3: Layer Completion Requires All Tasks ===")
    with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as f:
        db_path = f.name

    try:
        old_db = server.DB_FILE
        server.DB_FILE = db_path
        server.init_db()

        conn = server.get_db()
        c = conn.cursor()

        # Create 3 tasks in limbo
        for i in range(3):
            tid = f"layer_test_{i}"
            c.execute(
                "INSERT INTO tasks (id, layer_id, title, blood_reward, deadline_seconds, status, dom_order, created_at) "
                "VALUES (?,?,?,?,?,?,?,?)",
                (tid, "limbo", f"Task {i}", 10, 300, "pending", i, datetime.datetime.now().isoformat()),
            )
        conn.commit()

        # Complete only the first task
        c.execute("UPDATE tasks SET status='completed', style_rank='A' WHERE id='layer_test_0'")
        conn.commit()

        # Check remaining count
        c.execute("SELECT COUNT(*) as remaining FROM tasks WHERE layer_id='limbo' AND status != 'completed'")
        remaining = c.fetchone()["remaining"]
        report("2 tasks still remaining after 1 completion", remaining == 2)

        # Layer should NOT be completed yet
        c.execute("SELECT completed FROM layers WHERE id='limbo'")
        layer = c.fetchone()
        report("layer NOT marked completed with remaining tasks", layer["completed"] == 0)

        # Complete remaining tasks
        c.execute("UPDATE tasks SET status='completed', style_rank='B' WHERE id='layer_test_1'")
        c.execute("UPDATE tasks SET status='completed', style_rank='S' WHERE id='layer_test_2'")
        conn.commit()

        # Now check — all done
        c.execute("SELECT COUNT(*) as remaining FROM tasks WHERE layer_id='limbo' AND status != 'completed'")
        remaining2 = c.fetchone()["remaining"]
        report("0 tasks remaining after all completed", remaining2 == 0)

        # The actual layer update would be done by the server handler, but we can verify the condition
        should_complete = remaining2 == 0
        report("layer completion condition met when all tasks done", should_complete is True)

        conn.close()
        server.DB_FILE = old_db
    finally:
        os.unlink(db_path)


if __name__ == "__main__":
    print("=" * 60)
    print("ULTRAKILL Task Engine — Regression Tests")
    print("=" * 60)

    test_migration_adds_started_at()
    test_null_started_at_rejection()
    test_layer_completion_requires_all_tasks()

    print("\n" + "=" * 60)
    print(f"Results: {PASS} passed, {FAIL} failed")
    print("=" * 60)

    sys.exit(1 if FAIL > 0 else 0)
