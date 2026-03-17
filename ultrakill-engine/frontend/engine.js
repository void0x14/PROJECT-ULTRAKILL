// === DOSYA: frontend/engine.js ===
import { state, subscribe, notify } from "./state.js";
import { initDB, getGrindState, saveGrindState, syncFromServer } from "./db.js";

let bloodInterval = null;

// --- Seeded PRNG (sfc32) ---
function sfc32(a, b, c, d) {
    return function () {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

function getPRNG(seed) {
    const s = Math.floor(seed * 2147483647);
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, s);
}

// --- Blood Timer ---
function startBloodTimer() {
    if (bloodInterval) clearInterval(bloodInterval);
    bloodInterval = setInterval(() => {
        const b = state.blood;
        if (b.current > 0) {
            const next = Math.max(0, b.current - 1);
            state.blood = { current: next, max: b.max };
            // sync to server every 10 seconds
            if (next % 10 === 0) {
                fetch("/api/blood/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ current: next }),
                }).catch(() => {});
            }
        } else if (!state.grindActive) {
            triggerCyberGrind();
        }
    }, 1000);
}

// --- Cyber Grind ---
export async function triggerCyberGrind(seed) {
    const finalSeed = seed != null ? seed : Math.random();
    state.grindSeed = finalSeed;
    state.grindActive = true;

    try {
        await fetch("/api/task/fail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
    } catch (e) {
        console.error("[engine] triggerCyberGrind API:", e);
    }
    try {
        await saveGrindState({ active: true, seed: finalSeed });
    } catch (e) {
        console.error("[engine] saveGrindState:", e);
    }
}

export function scrambleLayout(seed) {
    if (seed == null) return;
    const prng = getPRNG(seed);

    // scramble cards inside task-arena shadow DOM
    const arenas = document.querySelectorAll("task-arena");
    arenas.forEach((arena) => {
        const shadow = arena.shadowRoot;
        if (!shadow) return;
        const container = shadow.querySelector(".arena-grid");
        if (container) {
            const cols = [1, 2, 3].map(() => Math.floor(prng() * 3) + 1);
            container.style.gridTemplateColumns = cols.map((c) => c + "fr").join(" ");
        }
        const cards = shadow.querySelectorAll("[data-task-card]");
        cards.forEach((card) => {
            card.style.order = Math.floor(prng() * 20) + 1;
            card.classList.add("scrambling");
        });
    });

    // show grind banner
    const banner = document.getElementById("grind-banner");
    if (banner) banner.classList.add("active");
}

function clearLayout() {
    const arenas = document.querySelectorAll("task-arena");
    arenas.forEach((arena) => {
        const shadow = arena.shadowRoot;
        if (!shadow) return;
        const container = shadow.querySelector(".arena-grid");
        if (container) container.style.gridTemplateColumns = "";
        const cards = shadow.querySelectorAll("[data-task-card]");
        cards.forEach((card) => {
            card.style.order = "";
            card.classList.remove("scrambling");
        });
    });
    const banner = document.getElementById("grind-banner");
    if (banner) banner.classList.remove("active");
}

export async function clearCyberGrind() {
    state.grindActive = false;
    state.grindSeed = null;
    clearLayout();
    try {
        await fetch("/api/grind/clear", { method: "POST" });
    } catch (e) {
        console.error("[engine] clearCyberGrind API:", e);
    }
    try {
        await saveGrindState({ active: false, seed: null });
    } catch (e) {
        console.error("[engine] saveGrindState:", e);
    }
}

// --- Task Operations ---
export async function createTask(layerId, title, bloodReward, deadlineSeconds) {
    try {
        const res = await fetch("/api/task/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                layer_id: layerId,
                title: title,
                blood_reward: bloodReward,
                deadline_seconds: deadlineSeconds,
            }),
        });
        const data = await res.json();
        if (data.success) {
            await refreshState();
        }
        return data;
    } catch (e) {
        console.error("[engine] createTask:", e);
        return { success: false, error: String(e) };
    }
}

export async function completeTask(taskId, completionTimeMs) {
    try {
        const res = await fetch("/api/task/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                task_id: taskId,
                completion_time_ms: completionTimeMs,
            }),
        });
        const data = await res.json();
        if (data.success) {
            state.styleRank = data.style_rank;
            if (data.blood) {
                state.blood = data.blood;
            }
            if (state.grindActive) {
                await clearCyberGrind();
            }
            await refreshState();
        }
        return data;
    } catch (e) {
        console.error("[engine] completeTask:", e);
        return { success: false, error: String(e) };
    }
}

// --- Refresh from Server ---
export async function refreshState() {
    try {
        const data = await syncFromServer();
        if (!data) return;
        state.blood = data.blood;
        state.tasks = data.tasks || [];
        state.layers = data.layers || [];
        if (data.grind) {
            if (data.grind.active && !state.grindActive) {
                state.grindSeed = data.grind.shuffle_seed;
                state.grindActive = true;
            }
        }
    } catch (e) {
        console.error("[engine] refreshState:", e);
    }
}

// --- Session Init ---
async function initSession() {
    try {
        await initDB();
    } catch (e) {
        console.error("[engine] initDB:", e);
    }

    try {
        const data = await syncFromServer();
        if (data) {
            state.blood = data.blood;
            state.tasks = data.tasks || [];
            state.layers = data.layers || [];
            if (data.grind && data.grind.active) {
                state.grindSeed = data.grind.shuffle_seed;
                state.grindActive = true;
            }
        }
    } catch (e) {
        console.error("[engine] initial sync:", e);
        // fallback to IndexedDB
        try {
            const localGrind = await getGrindState();
            if (localGrind && localGrind.active) {
                state.grindSeed = localGrind.seed;
                state.grindActive = true;
            }
        } catch (e2) {
            console.error("[engine] IndexedDB fallback:", e2);
        }
    }
}

// --- Start Engine ---
export async function startEngine() {
    await initSession();

    subscribe("grindActive", (active) => {
        if (active) {
            scrambleLayout(state.grindSeed);
        } else {
            clearLayout();
        }
    });

    startBloodTimer();

    // if grind was already active on load, scramble now
    if (state.grindActive && state.grindSeed != null) {
        // small delay to let components render
        setTimeout(() => scrambleLayout(state.grindSeed), 500);
    }
}
