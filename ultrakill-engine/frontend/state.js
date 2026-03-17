// === DOSYA: frontend/state.js ===
const subscribers = new Map();

function createStore(initialState) {
    const handler = {
        set(target, property, value) {
            target[property] = value;
            if (subscribers.has(property)) {
                const cbs = subscribers.get(property);
                for (let i = 0; i < cbs.length; i++) {
                    try {
                        cbs[i](value);
                    } catch (e) {
                        console.error(`[state] subscriber error for '${property}':`, e);
                    }
                }
            }
            return true;
        },
        get(target, property) {
            return target[property];
        }
    };
    return new Proxy(initialState, handler);
}

export const state = createStore({
    blood: { current: 100, max: 100 },
    activeLayer: "prelude",
    layers: [],
    tasks: [],
    styleRank: "D",
    grindActive: false,
    grindSeed: null,
});

export function subscribe(key, callback) {
    if (!subscribers.has(key)) {
        subscribers.set(key, []);
    }
    subscribers.get(key).push(callback);
}

export function notify(key) {
    if (subscribers.has(key)) {
        const val = state[key];
        const cbs = subscribers.get(key);
        for (let i = 0; i < cbs.length; i++) {
            try {
                cbs[i](val);
            } catch (e) {
                console.error(`[state] notify error for '${key}':`, e);
            }
        }
    }
}
