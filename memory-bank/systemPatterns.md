# ULTRAKILL Task Engine — System Patterns

## Architecture Overview
```
┌─────────────────────────────────────────────────┐
│ Browser (Vanilla JS)                            │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ state.js│←→│ engine.js│←→│ Web Components│  │
│  │ (Proxy) │  │ (Timer/  │  │ (Shadow DOM)  │  │
│  └────┬────┘  │  Grind)  │  └───────────────┘  │
│       │       └────┬─────┘                     │
│       └──────┬─────┘                           │
│           db.js (IndexedDB)                     │
└───────────────┬─────────────────────────────────┘
                │ fetch()
┌───────────────┴─────────────────────────────────┐
│ server.py (BaseHTTPRequestHandler)              │
│  ┌──────────────────────────────────────────┐   │
│  │ SQLite (db.sqlite)                       │   │
│  │ layers | tasks | blood_state | grind     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                │ HTTP POST
┌───────────────┴─────────────────────────────────┐
│ punishment_daemon.py (Port 9090)                │
│ iptables + swaylock + process termination       │
└─────────────────────────────────────────────────┘
```

## Key Patterns

### 1. Proxy-Based Reactive State
- `state.js` exports a Proxy object
- Property setters trigger `notify()` to all subscribers
- Components subscribe in `connectedCallback()`, unsubscribe in `disconnectedCallback()`
- No virtual DOM — components update their own Shadow DOM directly

### 2. Seeded PRNG for Deterministic Chaos
- `sfc32` algorithm (fast, seeded)
- Cyber Grind seed persisted in both SQLite and IndexedDB
- Same seed = same scramble layout (reproducible punishment)
- Seed derived from `Math.random()` on activation

### 3. Dual Storage (SQLite + IndexedDB)
- **SQLite**: Source of truth (server-side)
- **IndexedDB**: Client-side cache for offline/reload persistence
- `syncFromServer()` on load pulls SQLite → IndexedDB → state
- `saveGrindState()` pushes state → IndexedDB immediately, SQLite async

### 4. PRAGMA-Based Migrations
- `_migrate_db()` checks `PRAGMA table_info` for missing columns
- Adds columns via `ALTER TABLE` without dropping/recreating
- Safe for existing databases (non-destructive)

### 5. Shadow DOM Isolation
- Each component has `attachShadow({ mode: 'open' })`
- CSS fully self-contained inside `<style>` tag
- Critical styles use hardcoded values (CSS custom properties inherit but unreliable)
- `data-task-card` attributes for scramble targeting

### 6. Single-Page Without Router
- All state managed via `state.js` Proxy
- No URL routing — everything happens on one page
- Modal system for overlays (task creation, KILAVUZ)

## Component Relationships
```
index.html
  ├── style.css (global layout, CSS variables)
  ├── engine.js (orchestrator: imports state, db; exports triggerCyberGrind)
  ├── state.js (reactive core)
  ├── db.js (storage abstraction)
  ├── components/blood-bar.js ← state.js
  ├── components/task-arena.js ← state.js, engine.js
  ├── components/style-meter.js ← state.js
  └── components/layer-map.js ← state.js
```

## Critical Implementation Paths
1. **Task Creation Flow**: UI → POST /api/task/create → SQLite → syncFromServer → state → components re-render
2. **Completion Flow**: click → POST /api/task/start (set started_at) → click → POST /api/task/complete → calculate rank → update blood → sync
3. **Cyber Grind Flow**: blood=0 → triggerCyberGrind() → POST /api/task/fail → daemon POST /punish → scrambleLayout(seed)
4. **Recovery Flow**: complete task during grind → POST /api/grind/clear → daemon POST /release → unscramble