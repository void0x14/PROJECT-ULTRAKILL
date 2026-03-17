# ULTRAKILL Task Engine — Active Context

## Current State
All 11 project files have been rewritten and verified working in browser.

## Architecture Decisions
- **BaseHTTPRequestHandler instead of SimpleHTTPRequestHandler**: Full control over static file serving allows proper MIME type mapping for ES modules
- **Inline CSS in Shadow DOM**: CSS custom properties DO inherit into Shadow DOM, but for reliability all component critical styles use hardcoded values
- **Seeded PRNG (sfc32)**: Deterministic scramble means same seed = same layout, persisted in both SQLite and IndexedDB
- **Single-page app without routing**: All state managed via Proxy, components auto-update via subscribe
- **random.randint for IDs instead of uuid**: Stays within explicitly allowed stdlib modules

## File Dependencies
```
index.html
  ├── style.css
  ├── engine.js ← state.js, db.js
  ├── components/blood-bar.js ← state.js
  ├── components/task-arena.js ← state.js, engine.js
  ├── components/style-meter.js ← state.js
  └── components/layer-map.js ← state.js
```

## Server Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | / | Serve index.html |
| GET | /frontend/* | Static files |
| GET | /api/state | Full state dump |
| GET | /api/grind/state | Cyber Grind status |
| POST | /api/task/create | Create task |
| POST | /api/task/complete | Complete task + rank |
| POST | /api/task/fail | Trigger Cyber Grind |
| POST | /api/grind/clear | Clear Cyber Grind |
| POST | /api/blood/update | Sync blood level |
| POST | /api/layer/select | Check layer unlock |
