# ULTRAKILL Task Engine — Product Context

## Why This Project Exists
Traditional task managers are boring. ULTRAKILL Task Engine gamifies productivity by borrowing the intense, high-stakes mechanics from the ULTRAKILL video game. It turns mundane task completion into a visceral, dopamine-driven experience.

## Problems It Solves
1. **Motivation Gap**: Normal to-do lists don't create urgency. Blood Timer forces action.
2. **Boring Completion**: No reward feedback. Style Ranking (D→SSS) gives instant gratification.
3. **No Consequences**: Skipping tasks has no real cost. Cyber Grind punishment (UI chaos + system daemon) creates real stakes.
4. **Flat Structure**: Linear lists feel meaningless. Layer System (Prelude → Treachery) provides narrative progression.

## How It Should Work
- User creates tasks assigned to "Layers of Hell" (themed zones)
- Blood meter drains 1/sec — completing tasks refills it
- Fast completion = higher Style Rank (SSS = fastest)
- Blood hits 0 → Cyber Grind activates (UI scrambles via seeded PRNG)
- Complete a task to escape Cyber Grind
- Progress through layers sequentially, unlocking next on completion
- Optional: punishment_daemon.py blocks internet + locks screen during grind

## User Experience Goals
- **Immediate Feedback**: Every action (create, start, complete) triggers visual/audio response
- **High Stakes**: Always feel the blood draining — never feel safe
- **Satisfying Progression**: Layer map shows journey through Hell
- **Chaotic Punishment**: Cyber Grind should feel genuinely disorienting
- **Zero Friction**: No login, no setup, just run server.py and open browser