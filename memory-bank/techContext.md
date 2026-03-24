# ULTRAKILL Task Engine — Tech Context

## Technologies Used

### Backend
- **Python 3.x** (stdlib only)
  - `http.server` — Custom `BaseHTTPRequestHandler` subclass
  - `sqlite3` — Local file-based database (db.sqlite)
  - `json` — API serialization
  - `random` — ID generation (16-char hex via `randint`)
  - `datetime` — Timestamps
  - `os` — File path resolution
- **No pip dependencies** — zero install required

### Frontend
- **Vanilla JavaScript** (ES Modules)
  - No framework, no transpilation, no bundler
  - `import`/`export` natively supported by modern browsers
- **Web Components** (Custom Elements + Shadow DOM)
  - `blood-bar.js` — Blood meter with danger states
  - `task-arena.js` — Task card grid
  - `style-meter.js` — Rank display (D→SSS)
  - `layer-map.js` — Layer progression map
- **IndexedDB** — Client-side persistence (via `db.js`)
- **CSS Variables** — Theme system (scoped per component)

### Punishment Daemon
- **Python** standalone script (`punishment_daemon.py`)
- `socket` — TCP server on port 9090
- `subprocess` — Execute system commands
- `iptables` — Network blocking
- `swaylock` — Screen lock (Wayland)

## Development Setup
```bash
# Start server (from ultrakill-engine/)
python server.py

# Start punishment daemon (optional, separate terminal)
python punishment_daemon.py

# Open browser
http://localhost:8080
```

## Technical Constraints
1. **Zero External Dependencies** — No npm, pip, CDN
2. **Python stdlib only** — Explicitly allowed: http.server, sqlite3, json, random, datetime, subprocess, socket, os
3. **No uuid module** — Use random.randint for ID generation
4. **No CDN fonts** — System monospace fonts only (font-family: monospace)
5. **Shadow DOM CSS** — All component styles self-contained, no external var() for critical styles
6. **No build step** — ES Modules served directly, no webpack/vite/rollup

## File Structure
```
ultrakill-engine/
├── server.py              # Backend API + static file server
├── punishment_daemon.py   # System punishment daemon (port 9090)
├── test_regressions.py    # Regression test suite (11 tests)
├── db.sqlite              # SQLite database (created on first run)
├── frontend/
│   ├── index.html         # Main HTML (3-panel layout)
│   ├── style.css          # Global styles + CSS variables
│   ├── engine.js          # Core logic (timer, grind, PRNG)
│   ├── state.js           # Reactive state (Proxy)
│   ├── db.js              # IndexedDB abstraction
│   └── components/
│       ├── blood-bar.js   # Blood meter component
│       ├── task-arena.js  # Task card grid component
│       ├── style-meter.js # Rank display component
│       └── layer-map.js   # Layer map component
└── memory-bank/           # Project documentation (this folder)
```

## Tool Usage Patterns
- **Server runs on port 8080** by default
- **Daemon runs on port 9090** — only if punishment system is active
- **Browser** — Any modern browser with ES Module support
- **Testing** — `python test_regressions.py` (unittest framework)
- **Database** — File-based SQLite, no separate DB server needed