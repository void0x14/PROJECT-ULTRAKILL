# ULTRAKILL Task Engine — Project Brief

## Overview
A gamified task management system inspired by ULTRAKILL game mechanics. Users manage tasks through "Layers of Hell" with a blood-as-time mechanic and Cyber Grind punishment system.

## Architecture
- **Backend**: Python `http.server` + `sqlite3` (zero external dependencies)
- **Frontend**: Vanilla JS ES Modules, Web Components (Shadow DOM), IndexedDB, CSS Variables
- **No CDN, npm, or pip dependencies**

## Core Mechanics
1. **Blood Timer**: Drains 1/sec. Task completions refill blood. 0 blood = Cyber Grind.
2. **Style Ranking**: D/C/B/A/S/SS/SSS based on completion speed vs deadline.
3. **Cyber Grind**: Scrambles UI layout with seeded PRNG. Must complete a task to escape.
4. **Layer System**: Prelude → Act I (Limbo, Lust, Gluttony, Greed, Wrath) → Gabriel → Act II (Heresy, Violence, Fraud, Treachery) → Minos Prime, Sisyphus Prime.

## Tech Constraints
- Allowed Python stdlib: http.server, sqlite3, json, random, datetime, subprocess, socket, os
- No uuid (use random-based ID generation)
- No CDN fonts (monospace system fonts only)
- All CSS inside Shadow DOM must be self-contained (no external var() dependency for critical styles)

## Version
v0.1.0
