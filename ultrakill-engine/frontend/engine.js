// === DOSYA: frontend/engine.js ===
import { state, subscribe } from './state.js';
import { getGrindState, saveGrindState } from './db.js';

let bloodInterval = null;

// Seeded PRNG
function sfc32(a, b, c, d) {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}
function getPRNG(seed) {
    const seedInt = Math.floor(seed * 2147483647);
    return sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, seedInt);
}

export function startEngine() {
    bloodInterval = setInterval(() => {
        if (state.blood.current > 0) {
            state.blood = { ...state.blood, current: state.blood.current - 1 };
        } else if (!state.grindActive) {
            triggerCyberGrind();
        }
    }, 1000);

    initSession();
    subscribe('grindActive', active => {
        if (active) scrambleLayout(state.grindSeed);
        else clearLayout();
    });
}

async function initSession() {
    try {
        const res = await fetch('/api/state');
        const data = await res.json();
        state.blood = data.blood;
        state.tasks = data.tasks;
        
        const grindRes = await fetch('/api/grind/state');
        const grindData = await grindRes.json();
        
        if (grindData.active) {
            state.grindSeed = grindData.shuffle_seed;
            state.grindActive = true;
            await saveGrindState({ active: true, seed: grindData.shuffle_seed });
        }
    } catch(e) {
        console.error("API Error", e);
        const localGrind = await getGrindState();
        if (localGrind.active) {
            state.grindSeed = localGrind.seed;
            state.grindActive = true;
        }
    }
}

export async function triggerCyberGrind(seed = null) {
    const finalSeed = seed || Math.random();
    state.grindSeed = finalSeed;
    state.grindActive = true;
    
    try {
        await fetch('/api/task/fail', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) { console.error(e); }
    await saveGrindState({ active: true, seed: finalSeed });
}

export function scrambleLayout(seed) {
    const prng = getPRNG(seed);
    const cards = document.querySelectorAll('[data-task-card]');
    cards.forEach(card => {
        card.style.order = Math.floor(prng() * 20) + 1;
        card.classList.add('scrambling');
    });

    const arenas = document.querySelectorAll('task-arena');
    arenas.forEach(arena => {
        const shadow = arena.shadowRoot;
        if(shadow) {
            const container = shadow.querySelector('.arena-container');
            if(container) {
                const cols = `${Math.floor(prng()*3)+1}fr ${Math.floor(prng()*3)+1}fr ${Math.floor(prng()*3)+1}fr`;
                container.style.gridTemplateColumns = cols;
            }
            const shadowCards = shadow.querySelectorAll('.task-card');
            shadowCards.forEach(card => {
                card.style.order = Math.floor(prng() * 20) + 1;
                card.classList.add('scrambling');
            });
        }
    });
}

function clearLayout() {
    const cards = document.querySelectorAll('[data-task-card]');
    cards.forEach(card => {
        card.style.order = '';
        card.classList.remove('scrambling');
    });
    const arenas = document.querySelectorAll('task-arena');
    arenas.forEach(arena => {
        const shadow = arena.shadowRoot;
        if(shadow) {
            const container = shadow.querySelector('.arena-container');
            if(container) container.style.gridTemplateColumns = '';
            const shadowCards = shadow.querySelectorAll('.task-card');
            shadowCards.forEach(card => {
                card.style.order = '';
                card.classList.remove('scrambling');
            });
        }
    });
}

export async function clearCyberGrind() {
    state.grindActive = false;
    try {
        await fetch('/api/grind/clear', { method: 'POST' });
    } catch(e) { console.error(e); }
    await saveGrindState({ active: false, seed: null });
}
