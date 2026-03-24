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

---

## Kullanıcı Profili

### Donanım
| Cihaz | Özellik | Önemi |
|-------|---------|--------|
| **Telefon** | Redmi 9, 64GB depolama | Binary boyutu KRİTİK |
| **Desktop** | Ryzen 5 3600, 16GB RAM | Build hızı yeterli |

### Kullanım Modeli
- **LLM Workflow**: LLM'ler kod yazıyor, kullanıcı sadece review/architecture yapıyor
- **Kişisel kullanım**: Dağıtım yok, sadece kendisi kullanacak
- **Hedef**: Core features önce mükemmel çalışsın, sonra yavaş incremental improvement

### Öncelik Sırası
1. ✅ **VERİ GÜVENLİĞİ**: Asla corruption/kayıp olmayacak (SQLite PRAGMA settings kritik)
2. ✅ **CORE FEATURES**: Kan timer, task CRUD, style ranking, layer system çalışacak
3. ✅ **SIFIR DEPENDENCY**: Hiç external paket yok
4. ❌ **Güvenlik**: Önemli değil (kişisel kullanım)
5. ❌ **v0.2.0**: Büyük versiyon atlamaları yok, sürekli incremental

### Versiyonlama
- Format: `0.{feature}.{iteration}.{hotfix}`
- Örnek: `0.100.1234` tarzı
- Amaç: Uzun süre 0.x.x.x serisinde kalmak

### İlgi Diller (Gelecek İçin)
1. 🟠 **Nim** — 6KB binary, Python benzeri syntax
2. 🐹 **Go** — Tek binary, mature ecosystem
3. 🔷 **V** — 0.4sn compile, çok küçük binary